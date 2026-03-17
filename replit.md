# NetSphere - Enterprise ISP Billing & Management System

## Overview
Multi-tenant SaaS ISP Billing & Operations Management System for Internet Service Providers. Built with React + Express + PostgreSQL. Enterprise-grade with 29+ fully functional modules, each with expandable submenus and tab-based sub-features.

## Tech Stack
- **Frontend**: React 18, Vite, Tailwind CSS, shadcn/ui components, wouter (routing), TanStack React Query, Leaflet maps, Recharts, Framer Motion
- **Backend**: Express 5, TypeScript (tsx), Drizzle ORM, express-session, multer (file uploads)
- **Database**: PostgreSQL (Drizzle ORM with drizzle-kit for schema push)
- **Auth**: Session-based authentication (admin / admin123)

## Project Structure
- `client/` - React frontend
  - `client/src/App.tsx` - Main app with routing and auth guard
  - `client/src/pages/` - 40+ page components (dashboard, customers, invoices, etc.)
  - `client/src/components/ui/` - shadcn/ui components
  - `client/src/components/app-sidebar.tsx` - Navigation sidebar with collapsible submenus
  - `client/src/components/theme-provider.tsx` - Dark/light theme provider
  - `client/src/hooks/` - Custom hooks (use-auth, use-tab, use-toast, use-mobile, use-permissions)
  - `client/src/lib/` - Utilities (queryClient, utils)
  - `client/src/index.css` - Enterprise blue theme variables and elevation utilities
- `server/` - Express backend
  - `server/index.ts` - Server entry point with seed
  - `server/routes.ts` - 100+ API routes with auth middleware
  - `server/storage.ts` - DatabaseStorage class with all CRUD operations
  - `server/db.ts` - PostgreSQL connection (Drizzle)
  - `server/seed.ts` - Database seeding with sample data
  - `server/vite.ts` - Vite dev server setup
  - `server/static.ts` - Production static file serving
- `shared/` - Shared types and schemas
  - `shared/schema.ts` - 30+ Drizzle table schemas with Zod validation

## Modules
Dashboard, Customers, Packages, Invoices, Tickets, Areas, Vendors, Resellers, Accounting, Transactions, Tasks, Projects, Credit Notes, Expenses, Attendance (with breaks tracking), Holiday & Leave (dedicated page with Leave Management + Public Holidays tabs), Assets, Inventory, Product Types, Suppliers, HR & Payroll, Access/Roles, Company Profile, Notifications, Reports, Settings, Audit Log, Bulk Messaging, IPAM, Billing Rules, RADIUS, Outages, Network Monitoring, MikroTik, Customer Portal, Payment Gateway, Customer Map, Revenue Analytics, Aging Report, Bandwidth Usage, Daily Collection, CIR Customers, Corporate Customers

## Assets Module (/assets)
### Asset Types (?tab=types)
- `asset_types` table with full CRUD: name, category (11 categories: Network Equipment, OLT, Router, Switch, ONU, Fiber Infrastructure, Power Equipment, Office Equipment, Tools, Vehicles, IT Hardware), subcategory, codePrefix, defaultLocationType, warrantyDefaultPeriod, expectedLifespan, depreciationMethod (Straight Line, Reducing Balance, Manual), depreciationRate, maintenanceRequired, criticalAsset, tracking toggles (serialNumber, macAddress, stockQuantity, assignment), status (active/limited/deprecated/under_review/archived)
- KPI dashboard: 6 cards (Total Types, Network Equipment, Infrastructure, Office/IT, Active, Archived)
- 3 chart cards: Category Distribution, Depreciation Methods, Top Types by Usage
- Searchable/filterable data grid with category and status filters
- Protection: cannot delete types that have assets assigned; archive instead
- Lifecycle stages display and financial mapping reference cards
- API: `/api/asset-types` (GET, POST, PATCH, DELETE via crudRoutes)

### Assets List (?tab=list)
- `assets` table expanded: assetTag, name, type, category, brand, model, serialNumber, macAddress, vendorId, purchaseDate, purchaseCost, warrantyEnd, location, locationType (pop/warehouse/office/field), assignedTo, assignedType (staff/customer/pop/warehouse), installedBy, installationDate, depreciationMethod, depreciationRate, bookValue, ipAddress, vlan, firmwareVersion, lastMaintenanceDate, nextMaintenanceDate, invoiceReference, notes, status, createdAt
- Asset statuses: available (In Stock/amber), deployed (green), maintenance (blue), reserved (purple), faulty (red), retired (gray), lost (red)
- 7 KPI cards: Total Assets, Network Devices, In Stock, Deployed, Maintenance, Retired, Critical Infrastructure
- 3 analytics cards: Assets by Category, Deployment by Location, Financial Summary (total book value, warranty expiring, faulty)
- Enhanced data grid: Asset ID, Name+Category, Type, Serial/MAC, Brand/Model, Location+Type, Assigned To, Warranty status badge, Book Value, Status, Actions
- Search by name/tag/serial/MAC; filter by status, type, location type
- Click row to open Asset Details Drawer (slide-out panel)
- Asset Details Drawer: General Info (8 fields), Deployment Info (6 fields), Financial Info (6 fields), Technical Info (IP/VLAN/firmware), Maintenance dates, Notes, Quick Status Change buttons
- Action dropdown: View Details, Edit, Mark Maintenance, Mark Deployed, Retire Asset (no permanent delete)
- 5-section add/edit form: General (tag/name/type/category/brand/model/serial/MAC/status), Purchase & Vendor (vendor/date/invoice/cost/warranty/bookValue), Location & Assignment (location/type/assignedTo/assignedType/installedBy/installationDate), Technical & Network (IP/VLAN/firmware), Depreciation & Maintenance (method/rate/dates), Notes
- Lifecycle tracking card + Maintenance overview card
- API: `/api/assets` (GET, POST, PATCH, DELETE via crudRoutes)
### Transfer & Movement (?tab=transfers)
- 6 KPI cards: This Month, In Transit, Pending Approval, Completed, Returned, Rejected
- 3 analytics cards: Transfers by Type, Status Distribution, Approval Workflow steps
- Transfers table (10 cols: Transfer ID, Asset, From, To, Type, Requested By, Priority, Dispatch, Status, Actions)
- Action dropdown per row: View Details, Approve, Dispatch, Receive, Complete, Reject, Cancel (state-dependent)
- Slide-out details drawer (Asset Info, Transfer Details, People & Dates, Condition, Reason, Notes, Status Actions)
- New Transfer dialog (4 sections: Transfer Info with auto-fill from asset, Locations, Assignment & Schedule, Options with switches)
- Transfer statuses: pending (blue), approved (green), in_transit (amber), received (emerald), completed (green), rejected (red), cancelled (gray)
- Transfer types: relocation, deployment, return, replacement, maintenance, decommission
- Priority: high (red), normal (blue), low (gray); urgent flag with AlertTriangle icon
- API: `/api/asset-transfers` (GET, POST, PATCH, DELETE via crudRoutes)

## Asset Assignment to Customer (/asset-assignments)
- Centralized device-to-customer allocation management page
- **Theme**: Deep Blue → Teal gradient (#1E3A8A → #0D9488)
- **Layout**: Two-panel — Customer Selection panel (left) + Assigned Assets grid (right)
- **6 KPI Cards**: Total Assigned, Active, Suspended, Returned, Faulty, Total Deposit
- **Customer Panel**: Searchable customer list with selection, shows profile overview (ID, Phone, Area, Connection, Status, Device Count)
- **Assigned Assets Table**: Dark header grid with Assignment ID, Asset Type (with icons), Serial, MAC, IP, VLAN, Customer, Date, Technician, Deposit, Status, Actions
- **Status Types**: Active (green), Pending Activation (amber), Provisioning (blue), Suspended (purple), Returned (red), Faulty (gray)
- **Actions**: View Details, Edit, Suspend Device, Reactivate, Mark Faulty, Return to Inventory, Delete
- **Assign Form (4 sections)**: Section A (Customer & Service), Section B (Asset Selection with searchable inventory, auto-fill serial/MAC/IP/VLAN), Section C (Installation & Billing — date, technician, deposit, ownership type), Section D (Automation — auto-provision, send config, notify customer, generate invoice)
- **Assignment History Timeline**: Chronological vertical timeline with color-coded dots per action, shows IP, technician, reason, billing impact
- **Detail Modal**: Full assignment card with all fields, automation flags, notes
- **Validation**: Cannot assign already assigned asset, duplicate prevention via assignedAssetIds set
- **DB Tables**: `asset_assignments` (assignmentId, customerId, assetId, assetType, serialNumber, macAddress, ipAddress, vlan, installationDate, assignedTechnician, securityDeposit, ownershipType, deviceCondition, autoProvision, sendConfig, notifyCustomer, generateInvoice, depositStatus, status), `asset_assignment_history` (assignmentId, customerId, assetId, action, ipAddress, technician, reason, billingImpact, notes, performedBy)
- **API**: `/api/asset-assignments` (CRUD), `/api/asset-assignments/customer/:customerId`, `/api/asset-assignment-history/customer/:customerId`, `/api/asset-assignment-history/assignment/:assignmentId`
- Schema: `asset_transfers` table with 30+ fields
### Asset Tracking (/asset-tracking) — Dedicated Page
- Real-time operational command center for all organizational assets
- 8 gradient KPI cards: Total Assets, Active, In Transit, Assigned, Maintenance, Lost/Missing, Faulty, Reserved
- 5 tabs: Overview (Dashboard), Live Tracking, Location View, Lifecycle, Alerts
- **Overview tab**: 4 charts (Assets by Location pie, Status Distribution bar, Assets by Type horizontal bar, Fault Rate by Type), Portfolio Value Summary (Total/Deployed/At-Risk/Alerts)
- **Global Search**: Universal search bar searching by Asset ID, Serial, MAC, IP, Customer, Technician, POP, Warehouse with real-time dropdown results showing status badges and customer linkage
- **Live Tracking tab**: Full tracking table with dark gradient header, 14 sortable columns (Asset ID, Name, Type, Serial/MAC, Location, Assigned To, Customer, IP/VLAN, Condition, Warranty, Book Value, Status, Last Movement, Actions), 6 filters (search, status, location, type, condition/warranty, assigned), CSV export, dropdown actions (View Details, View Timeline, Transfer, Assign, Mark Faulty, Send to Maintenance, Suspend, Mark Lost, Mark Available)
- **Location View tab**: 6 location category cards (Warehouse, POP, Customer, Technician, Office, Repair Center) with per-status breakdowns, unassigned assets panel
- **Lifecycle tab**: Split-panel — asset selector list (left) + timeline view (right), chain-of-custody history from purchase → transfers → assignments → maintenance events, color-coded timeline dots
- **Alerts tab**: Automatic anomaly detection — warranty expiring, lost/missing assets, high-value faulty assets, overdue transfers; severity-coded (critical/warning) with direct asset view links
- **Detail dialog**: 5 sections — identification, location & assignment, financial, maintenance, customer assignments, notes; action buttons for timeline, faulty, maintenance
- Integrates data from: /api/assets, /api/asset-transfers, /api/asset-assignments
- File: `client/src/pages/asset-tracking.tsx`
### Asset Allocation (/asset-allocation) — Dedicated Page
- Full asset allocation management: reserve, allocate, and track asset distribution
- 8 gradient KPI cards: Total Allocations, Reserved, Allocated, Pending Approval, Partially Allocated, Fulfillment Rate, High Priority, Cancelled/Expired
- 5 tabs: Overview (dashboard), All Allocations, Reserved Queue, Fulfillment, Audit Log
- **Overview tab**: 3 charts (Status pie, Asset Type bar, Priority horizontal bar), Recent Allocations list
- **All Allocations tab**: Dark gradient header table (12 columns), search, status/priority/type filters, CSV export, dropdown actions (View, Edit, Allocate, Approve, Cancel, Delete)
- **Reserved Queue tab**: Card-based UI for reserved/pending items with action buttons (Send for Approval, Allocate Now, Cancel), priority color-coded left border
- **Fulfillment tab**: 3 summary cards (Fulfillment Rate, Total Units, Fulfilled Units), progress bars per allocation
- **Audit Log tab**: Timeline-based history viewer with allocation selector
- **Create/Edit Dialog**: 2-column form with allocation type, asset type, quantity, priority, source warehouse, destination, destination type, requester, linked project, dates, justification, notes, 4 checkboxes (approval required, reserve serials, auto-select FIFO, notify responsible)
- **View Detail Dialog**: Full allocation details with badges, metadata grid, action buttons
- **Server-side validation**: Stock availability check on create (rejects if insufficient), status transition enforcement via allowedTransitions map
- **Auto history logging**: Every status change creates audit trail entry
- **Status flow**: reserved → pending_approval → allocated → partially_allocated; reserved/pending/allocated → cancelled; reserved/allocated → expired
- DB tables: `asset_allocations` (allocationId unique, allocationType, assetType, quantity, fulfilledQuantity, sourceWarehouse, destination, destinationType, linkedProject, expectedUsageDate, reservationExpiry, priority, justification, requestedBy, approvedBy, approvalRequired, reserveSerials, autoSelect, notifyResponsible, reservedSerialNumbers, status, notes, convertedToTransferId, convertedToAssignmentId), `asset_allocation_history` (allocationId, action, actionBy, actionDate, previousStatus, newStatus, quantityAffected, relatedTransferId, relatedAssignmentId, comments)
- API: `/api/asset-allocations` (GET, POST, PATCH, DELETE), `/api/asset-allocation-history/:allocationId` (GET), `/api/asset-allocation-history` (POST)
- File: `client/src/pages/asset-allocation.tsx`
## Asset Request & Approvals (/asset-requests)
- Dedicated page with 5 tabs: Overview (dashboard), Pending Queue, All Requests, Approval Workflow, Audit Log
- 6 gradient KPI cards: This Month, Pending, Approved, Rejected, Escalated, Est. Value
- 7 request types: New Issuance, Asset Transfer, Device Replacement, Maintenance, Asset Return, Write-Off, Emergency Allocation
- 8 statuses: Draft, Pending, Under Review, Approved, Rejected, Cancelled, Escalated, Executed
- 4 priority levels: Low, Normal, High, Critical (with Emergency flag)
- Pending Queue tab: inline approve/reject/review/escalate actions with comment dialog
- All Requests tab: dark-header table with search, status/type/priority/department filters, dropdown actions
- Approval Workflow tab: visual flow diagram (Technician → Inventory → Network → Finance → Admin), multi-level progress tracking
- Audit Log tab: full decision trail with timestamps
- Detail dialog: request info, approval progress, decision timeline with color-coded history entries

## Product Types (/product-types) — Dedicated Page
- Master classification system for all inventory products, devices, and materials
- 8 gradient KPI cards: Total Product Types, Asset Types, Consumable Products, Saleable Products, Rental Products, Active Types, Inactive Types, Depreciation Tracked
- 3 tabs: Overview Dashboard, Product Types (table), Categories & Attributes
- **Overview Dashboard**: 3 charts (Category pie, Nature distribution bar, High-Value horizontal bar), Recent Product Types list
- **Product Types tab**: 12-column dark gradient header table with search, 5 advanced filters (category, nature, depreciation, serial tracking, status), CSV export, dropdown actions (View, Edit, Duplicate, Deactivate/Activate, Archive, Delete)
- **Categories & Attributes tab**: Category hierarchy tree with parent/child relationships, template quick-create for 6 standard categories (Network Equipment, Customer Devices, Fiber Materials, Tools, Spare Parts, Accessories), per-category depreciation method/rate, custom attributes
- **Create/Edit Form**: 3-column layout with name, SKU, category, sub-category, nature (Asset/Consumable/Saleable/Rental/Service-Linked), brand, model, unit, purchase cost, sale price, tax category, warranty, reorder/min stock levels, description, 7 checkboxes (depreciation, serial tracking, MAC tracking, IP allocation, POS visible, allow discount, bulk import)
- **View Detail Dialog**: Full product type card with all metadata, tracking flags as badges
- **Duplicate Type**: pre-fills form with "(Copy)" suffix and modified SKU
- **Server-side validation**: Unique SKU enforcement, asset-type must enable serial tracking, cannot delete if linked to inventory
- **Product natures**: Asset, Consumable, Saleable, Rental, Service-Linked
- DB tables: `product_types` (productTypeId unique, name, category, subCategory, productNature, brand, model, skuCode unique, defaultUnit, defaultPurchaseCost, defaultSalePrice, taxCategory, depreciationApplicable, warrantyPeriod, trackSerialNumber, trackMacAddress, requireIpAllocation, reorderLevel, minimumStockLevel, description, visibleInPos, allowDiscount, allowBulkImport, status), `product_type_categories` (name unique, parentId, color, description, depreciationMethod, depreciationRate, customAttributes, status)
- API: `/api/product-types` (CRUD), `/api/product-type-categories` (CRUD)
- File: `client/src/pages/product-types.tsx`
- 4-section create/edit form: Request Info, Location & Assignment, Priority & Financials, Options (multi-level, emergency, notify)
- Charts: Pie chart by type, Bar chart by department, Rejection rate indicator, Quick statistics grid
- **DB Tables**: `asset_requests` (requestId, requestType, assetType, assetId, fromLocation, toLocation, department, requestedBy, priority, justification, estimatedValue, requiredByDate, status, currentApprovalStage, approvalLevel, currentLevel, approvedBy, rejectedBy, rejectionReason, requireMultiLevel, isEmergency, notifyDeptHead, notes), `asset_request_history` (requestId, action, actionBy, actionDate, previousStatus, newStatus, comments, role)
- **API**: `/api/asset-requests` (CRUD), `/api/asset-request-history/:requestId`, `/api/asset-request-history` (POST)
- Server-side validation: Zod schema validation, asset availability check for new issuance, auto-history logging on status changes

## Inventory List Module (/inventory-list) — Dedicated Page
- Central operational stock command center providing real-time visibility of all stock items across warehouses
- Reuses existing stock management APIs: `/api/stock-items`, `/api/stock-locations`, `/api/stock-movements`, `/api/products`
- No new tables or routes — read-heavy view page consuming existing data
- 7 gradient KPI cards: Total Products, Total Quantity, Inventory Value, Low Stock, Out of Stock, Reserved Qty, Allocated Qty
- 5 analytics widgets: Stock by Warehouse (donut), Inventory Growth Trend (area), By Category (horizontal bar), Low Stock Risk (grouped bar), Value by Brand (donut)
- Advanced filter panel: 4 dropdowns (Warehouse, Category, Status, Brand) + full-text search across product/SKU/brand/category/warehouse
- 6 quick filters: Low Stock, Out of Stock, High Value (≥100K PKR), Critical, Reserved, Allocated — each with live counts
- 14-column master table with Deep Blue→Teal gradient header (`from-[#1E40AF] to-[#0D9488]`), color-coded row highlights (yellow for low stock, red for out/critical, blue for high value)
- Per-row actions: View Details, Edit Stock, Transfer, Adjust Quantity, Stock Ledger, Archive
- Stock Intelligence side panel (420px) with 3 tabs: Details (product info + quantities + valuation), Warehouses (multi-location breakdown), Movements (chronological audit trail with color-coded in/out entries)
- Dialogs: Transfer (between locations), Adjustment (with approval threshold), Edit Stock (qty/reserved/transit/reorder/min/cost)
- CSV export with proper quoting, Print support
- File: `client/src/pages/inventory-list.tsx`

## Notification Type Management (/notification-types) — Dedicated Page
- Centralized Notification Type Management for defining, configuring, and controlling all system-generated notifications
- Theme: Royal Blue → Amber (`from-[#1D4ED8] to-[#F59E0B]`)
- `notification_types` table: name, moduleSource, eventTrigger, triggerCondition, deliveryChannels (text array: email/sms/in_app/whatsapp/push), priorityLevel (low/medium/high/critical), audienceType (all/roles/users/customers/suppliers), audienceRoles (text array), audienceUsers (text array), emailTemplate, emailSubject, smsTemplate, inAppMessage, whatsappTemplate, pushTitle, pushBody, dynamicVariables, triggerType (event/scheduled/manual), triggerEvent, delayMinutes, escalationEnabled, escalationLevels, escalationTimeoutMinutes, repeatEnabled, repeatIntervalMinutes, repeatMaxCount, lastTriggered, triggerCount, failedCount, successCount, status (active/draft/scheduled/conditional/disabled/archived), createdBy, lastModified, createdAt
- 6 gradient KPI cards: Total Types, Active, Disabled, Event-Based, Scheduled, Failed (Total)
- 4 analytics charts: Notifications by Module (horizontal bar), Delivery Success Rate (donut), Channel Distribution (pie), Priority Distribution (bar)
- 10-column master table with Royal Blue→Amber gradient header, channel icons (Mail/SMS/Bell/WhatsApp/Push), priority badges, status badges, trigger counts with success/fail breakdown
- Filter panel: 4 filters (Module Source, Status, Priority, Channel) + full-text search
- Actions: Preview, Edit, Duplicate, Enable/Disable toggle, Delete
- **Configuration Panel** (create/edit dialog): 4-tab form — General (name, module, event, priority, status, trigger condition, delivery channels), Audience (type + role selection), Templates (per-channel templates with dynamic variable support: {{Customer_Name}}, {{Invoice_Number}}, etc.), Triggers & Logic (trigger type/event, delay, escalation with 3-level auto-escalation, repeat reminders)
- **Preview Dialog**: Full notification type review with metadata grid, channel templates preview, escalation/repeat config display, trigger statistics
- **Duplicate endpoint**: POST `/api/notification-types/:id/duplicate` — copies with "(Copy)" suffix and draft status
- **Toggle endpoint**: PATCH `/api/notification-types/:id/toggle` — switches between active/disabled
- API: `/api/notification-types` (GET, POST, PATCH, DELETE), `/api/notification-types/:id/duplicate`, `/api/notification-types/:id/toggle`
- File: `client/src/pages/notification-types.tsx`

## Batch & Serial Management (/batch-serial) — Dedicated Page
- Track serialized and batch-based products across warehouses
- `batches` table: batchNumber (auto BAT-XXXXXX), productName, skuCode, warehouseId, warehouseName, quantity, available (auto: qty-reserved-allocated), reserved, allocated, unitCost, manufacturingDate, expiryDate, status (active/low_stock/depleted/expired/damaged/archived)
- `serial_numbers` table: serialNumber (unique), macAddress, imei, batchId, batchNumber, productName, skuCode, warehouseId, warehouseName, status (available/reserved/allocated/assigned/sold/damaged/returned/expired), assignedCustomerName, invoiceReference, warrantyStartDate, warrantyExpiry, lastMovementDate, notes
- `serial_movements` table: serialId, serialNumber, referenceType (registration/bulk_import/status_change/purchase_order/sales/transfer/allocation/assignment/return), referenceId, sourceWarehouse, destinationWarehouse, customerName, performedBy, previousStatus, newStatus, notes, createdAt
- 8 gradient KPI cards: Total Batches, Total Serials, Available, Allocated, Sold, Expired Batches, Near Expiry, Damaged
- 3 tabs: Batch Management, Serial Numbers, Movement History
- **Batch Management**: 13-column dark gradient Indigo→Emerald header table, CRUD, near-expiry highlighting, linked serials count, negative available guard
- **Serial Numbers**: 12-column table, status badges, warranty expiry tracking, per-serial movement history drawer with timeline
- **Movement History**: 11-column audit trail with status transition badges
- **Bulk Import**: CSV paste (serial,mac,imei per line), auto-registers with movement log
- **Serial state machine**: available→reserved→allocated→assigned→sold; sold→returned/damaged only
- **Delete guards**: batches with linked serials blocked; sold/assigned/allocated serials blocked from deletion
- API: `/api/batches` (CRUD), `/api/serial-numbers` (CRUD + `/bulk`), `/api/serial-movements` (GET, POST, GET by serial)
- File: `client/src/pages/batch-serial.tsx`

## Stock Management Module (/stock-management) — Dedicated Page
- Centralized stock management dashboard for monitoring, controlling, and managing inventory across all warehouses and locations
- `stock_locations` table: name, locationType (warehouse/pop/office/field), address, manager, capacity, isActive
- `stock_items` table: productId, productName, brandName, category, skuCode, locationId, locationName, currentQuantity, reservedQuantity, inTransitQuantity, availableQuantity (auto-calculated), reorderLevel, minimumStock, averageCost, totalValue (auto-calculated), lastReceivedDate, lastIssuedDate, status (healthy/low_stock/critical/out_of_stock — auto-determined)
- `stock_movements` table: movementId (auto MOV-XXXXXX), stockItemId, movementType (purchase_receipt/transfer_in/transfer_out/allocation/assignment/sales/adjustment/return/write_off), referenceId, productName, locationName, quantityIn, quantityOut, balanceAfter, performedBy, notes, immutable audit trail
- `stock_adjustments` table: adjustmentId (auto ADJ-XXXXX), stockItemId, adjustmentType (physical_count/damage/lost/expired/data_correction), quantityBefore, quantityAdjustment, quantityAfter, reason (mandatory), approvalRequired, approvalStatus (pending/auto_approved/approved/rejected), approvedBy, performedBy, high-value threshold (>50K PKR) triggers approval requirement
- 8 gradient KPI cards: Inventory Value, Total SKUs, Units in Stock, Low Stock, Out of Stock, Reserved, In Transit, Critical Items
- 6 tabs: Stock Overview, Warehouse Matrix, Stock Master, Movement Log, Adjustments, Reorder Alerts
- **Stock Overview**: Stock by Warehouse pie, Monthly Movement bar (In/Out), Stock by Category horizontal bar, Stock Health Summary progress bars
- **Warehouse Matrix**: Location cards with item counts/values/alerts, multi-location cross-reference table with color-coded dots (green/yellow/red) showing stock levels per product per warehouse
- **Stock Master**: 13-column dark gradient header table, search by product/SKU/brand, 4 filters (warehouse, category, status, brand), per-row actions (Edit, Adjust, Transfer, Movement History, Delete), CSV export
- **Movement Log**: Immutable 10-column audit trail with movement type color coding, in/out quantities, running balance
- **Adjustments**: Adjustment history table with approval workflow, approve/reject actions for pending high-value adjustments
- **Reorder Alerts**: Items at/below reorder level with current qty, reorder level, suggested order quantity, estimated value, quick-adjust action, total reorder value summary
- **Stock Transfer**: Multi-location transfer between warehouses (reduces source, increases or creates destination), dual movement logs (transfer_out + transfer_in)
- **Stock Adjustment**: Controlled correction with mandatory reason, auto/manual approval based on value threshold, automatic movement log on approval
- **Auto-calculations**: availableQuantity = current - reserved - inTransit, totalValue = current × avgCost, status auto-determined from qty vs reorder/minimum levels
- API: `/api/stock-locations` (CRUD), `/api/stock-items` (CRUD), `/api/stock-movements` (GET, GET by item, POST), `/api/stock-adjustments` (GET, POST), `/api/stock-adjustments/:id/approve` (PATCH), `/api/stock-transfer` (POST)
- File: `client/src/pages/stock-management.tsx`

## Purchase Orders Module (/purchase-orders) — Dedicated Page
- Enterprise procurement workflow dashboard for managing, approving, and tracking all purchase orders
- `purchase_orders` table: poNumber (auto-generated PO-XXXXX), supplierId, warehouseDestination, poDate, expectedDeliveryDate, paymentTerms (cash/net_15/net_30/net_60/net_90/advance), currency (PKR/USD/EUR/GBP), linkedAllocationId, priorityLevel (low/normal/high/urgent), approvalRequired, approvedBy, approvedDate, rejectedBy, rejectionReason, shippingCost, additionalCharges, subtotal, taxAmount, grandTotal (server-calculated), receivedAmount, paidAmount, paymentStatus (unpaid/partial/paid), paymentDueDate, notes, createdBy, status (draft/pending_approval/approved/partially_received/fully_received/rejected/cancelled), createdAt
- `purchase_order_items` table: purchaseOrderId, productId, productName, description, quantity, unitPrice, discount%, tax%, subtotal (server-calculated), receivedQuantity, damagedQuantity, shortQuantity, serialNumbers, inspectionStatus (pending/passed/failed)
- 8 gradient KPI cards: Total POs (Month), Pending Approvals, Approved POs, Partially Received, Fully Received, Purchase Value, Outstanding Value, Draft POs
- 5 tabs: PO Overview, Create PO, PO Master List, Receiving & GRN, Financial Tracking
- **PO Overview**: Purchases by Supplier pie, Monthly Procurement Trend area chart, PO Status Distribution bar chart, Recent POs list
- **Create PO**: Professional structured form with header section (PO number auto, supplier linked, warehouse, dates, payment terms, currency, priority, approval toggle), line items section (product linked to products table with auto-fill pricing, qty, unit price, discount%, tax%, auto-calculated subtotals), footer section (shipping, additional charges, notes, real-time grand total calculator), credit limit exceeded warning
- **PO Master List**: 10-column dark gradient header table (PO#, supplier, warehouse, dates, amounts, payment/approval status), search, 4 advanced filters (status, supplier, payment status, warehouse), contextual action buttons (view, edit draft, submit for approval, approve, reject, receive goods, cancel, delete), CSV export
- **Receiving & GRN**: Approved/partially received POs listed with receive goods action, receiving dialog with per-item received/damaged/short quantities, serial numbers entry, inspection status, auto-calculates PO status (partial/fully received)
- **Financial Tracking**: 4 financial KPI cards (Total PO Value, Amount Paid, Outstanding Balance, Payment Ratio), payment table with inline record payment input, automatic payment status updates (unpaid → partial → paid)
- **Status Workflow**: draft → pending_approval → approved → partially_received → fully_received; rejected → draft; cancellation from non-terminal states; server-enforced state machine with transition validation
- **Validation Rules**: Cannot create PO for inactive/blacklisted supplier, server-side line item total calculation, status transition enforcement, only draft/cancelled POs can be deleted, line items locked after PO leaves draft
- API: `/api/purchase-orders` (GET, POST, PATCH, DELETE), `/api/purchase-orders/:id` (GET with items), `/api/purchase-order-items/:poId` (GET), `/api/purchase-order-items/:id` (PATCH)
- File: `client/src/pages/purchase-orders.tsx`

## Brands & Products Module (/brands-products) — Dedicated Page
- Centralized product catalog and brand registry with pricing, stock visibility, and operational attributes
- `brands` table: brandId (auto-generated BRD-XXXX), name, countryOfOrigin, officialDistributor, warrantyPolicy, notes, isPreferred, highReliability, warrantySupport, status (active/inactive), createdAt
- `products` table: productId (auto-generated PRD-XXXX), name, productTypeId, brandId, model, skuCode (unique), barcode, unitOfMeasure, purchaseCost, salePrice, taxCategory, warrantyPeriod, depreciationApplicable, trackSerialNumber, trackMacAddress, allowRental, allowDiscount, minimumStockLevel, reorderLevel, description, visibleInPos, visibleInAssets, currentStock, reservedStock, category, supplierId, status (in_stock/low_stock/available_for_sale/rental/out_of_stock/discontinued), createdAt
- 8 gradient KPI cards: Total Products, Active Products, Asset-Type, Saleable, Rental, Low Stock, Out of Stock, Inventory Value
- 4 tabs: Product Catalog Overview, Brand Management, Products Master, Product Profile
- **Product Catalog Overview**: Products by Brand pie, Stock Risk pie, Products by Category bar chart, Recent Products list
- **Brand Management**: Brand card grid with product counts, purchase/sale values, avg warranty, distributor, reliability/warranty support badges; CRUD with delete protection (linked products)
- **Products Master**: 14-column dark gradient header table, search by name/SKU/model/brand, 6 advanced filters (brand, category, status, stock level, serial tracking, rental), dropdown actions (View Profile, Edit, Duplicate, Discontinue/Reactivate, Delete)
- **Product Profile**: Detailed product view with stock data (total/reserved/available + low-stock warnings), product info, financial data (purchase cost/sale price/total values/gross margin), operational data (unit/warranty/reorder/min stock + tracking badges), description
- **Create/Edit Product Form**: 3-4 column form with name, SKU, brand select, model, category, barcode, unit, supplier, pricing (cost/sale/tax/warranty), stock levels (current/reserved/min/reorder), description, 7 checkboxes (serial/MAC/depreciation/rental/discount/POS/assets), status (edit only)
- **Create/Edit Brand Form**: Name, country, distributor, warranty policy, notes, 3 checkboxes (preferred/reliability/warranty support)
- **Server-side validation**: Auto-generate productId/brandId, unique SKU enforcement, asset products must enable serial tracking, cannot delete with stock or linked products
- **CSV Export**: Export filtered products list
- API: `/api/brands` (GET, POST, PATCH, DELETE), `/api/products` (GET, POST, PATCH, DELETE)
- File: `client/src/pages/brands-products.tsx`

## Suppliers Module (/suppliers) — Dedicated Page
- Centralized procurement supplier management, separate from ISP service vendors (/vendors)
- `suppliers` table: supplierId (auto-generated SUP-XXXX, unique), companyName, contactPerson, phone, email, officeAddress, city, country, taxRegistrationNumber, bank fields (name/title/number/branchCode), paymentTerms (cash/15_days/30_days/60_days/90_days), creditLimit, preferredCurrency, productCategoriesSupplied, defaultDeliveryDays, supplierRating (1-5), notes, isPreferredVendor, enableCreditPurchases, requirePoApproval, totalPurchases, totalPayments, outstandingPayable, lastPaymentDate, lastPurchaseDate, onTimeDeliveryRate, orderFulfillmentRate, qualityIssueRate, returnRate, status (active/pending_verification/preferred/credit_hold/blacklisted/inactive), createdAt
- 8 gradient KPI cards: Total Suppliers, Active, Preferred Vendors, On Credit, Outstanding Payables, Monthly Purchase Vol., Avg Rating, Inactive/Hold
- 4 tabs: Overview Dashboard, Suppliers List, Financial Summary, Performance
- **Overview Dashboard**: Status pie chart, Top Suppliers by Purchase Value bar chart, Payment Terms distribution bar chart, Recent Suppliers list with click-to-view
- **Suppliers List tab**: 11-column dark gradient header table, search by name/contact/ID/phone/city, 4 filters (status, payment terms, rating, category), dropdown actions (View Profile, Edit, Suspend/Activate, Mark Preferred, Blacklist, Delete)
- **Financial Summary tab**: 3 financial metric cards (Purchases/Payments/Outstanding), financial detail table with credit utilization progress bars
- **Performance tab**: 4 KPI cards (On-Time Delivery, Fulfillment Rate, Quality Issues, Return Rate), Supplier Performance Scorecard with progress bars and warning flags
- **Create/Edit Dialog**: 2-3 column form with company info, contact, tax/NTN, bank details, payment terms, credit limit, currency, delivery days, star rating picker, checkboxes (preferred/credit/PO approval)
- **View Profile Dialog**: Complete supplier card with status/badges, contact info, financial summary, credit utilization bar, performance metrics, notes
- **Server-side validation**: Auto-generate supplierId (SUP-XXXX), unique NTN enforcement, credit limit required for credit purchases, delete protection (outstanding payables, linked transactions)
- **CSV Export**: Export filtered suppliers list
- API: `/api/suppliers` (GET, POST, PATCH, DELETE)
- File: `client/src/pages/suppliers.tsx`

## Sales / Invoices Module (/invoices)
### Invoice Types (?tab=types)
- 5 invoice type cards: Regular, Recurring, Service, Overdue, Credit Note with counts

### Invoice List (?tab=list)
- 5 group tabs: All, Customers (home type), CIR, Corporate, Reseller — each filters invoices by customerType
- 7 stat cards (reactive to selected tab): Paid, Unpaid, Received, Due Amount, Generated, Advance, Monthly Bill
- Bulk action toolbar: Generate Excel, Generate PDF, Sync Clients, Bulk Status/Zone Change, Enable/Disable Selected, Download Invoice, SMS/Email Selected, Assign Employee, Bulk Billing Date Extend, Bulk Profile Change
- Dark header table with sortable columns: Checkbox, C.Code, ID/IP, Customer Name, Mobile, Zone, Customer Type, Connection Type, Package, Speed, Expire Date, M.Bill, Received, VAT, Balance Due, Advance, Payment Date, Server, M.Status toggle, B.Status badge, Actions
- Action menu per invoice: View, Edit, Print, Download PDF, Copy Link, Send SMS/Email/WhatsApp, Mark as Paid, Mark as Overdue (pending only), Cancel Invoice, Delete
- Pagination with entries-per-page selector, status filter, search bar, multi-select with bulk clear

### Add New Invoice (?tab=add)
- Multi-step invoice creation form with customer/package selection and line items

### Collection Allocation (?tab=allocation)
- 3 KPI cards (Total Collected, Pending Collection, Overdue Amount), allocation summary table

## Accounting Module (/accounting)
### Account Types (?tab=types)
- DB table: `account_types` with 17 fields: name, code, category, normalBalance, parentId, description, reporting flags, posting controls, sortOrder, createdAt
- CRUD API: `/api/account-types`; Seeded 27 hierarchical types across 5 categories
- UI: 5 gradient KPI cards, filter bar (search/category/status), dark-header table with hierarchy indentation, add/edit modal with 4 sections, delete confirmation

## Packages Module (/packages)
- Packages List tab shows both standard packages (from `packages` table) and vendor packages (from `vendor_packages` table) merged into a single list
- Vendor packages created in the Vendor Module automatically appear in the Packages list with a "Vendor" badge
- Vendor packages use negative IDs (`-vp.id`) to distinguish from standard packages; they show "Managed in Vendors" in the Actions column
- 5 stat cards: Total Packages, Active, Internet, IPTV, From Vendors
- Deduplication: vendor packages that already have a matching standard package (same name + vendorId) are excluded from the merged list
- Vendor package description auto-populated with cost/reseller price info

## Transactions Module (/transactions)
### Transactions List (?tab=list)
- Enterprise financial control dashboard with 6 KPI cards, 7-day trend AreaChart, type distribution PieChart
- Advanced filter panel: search, type, status, category, account, customer, vendor, payment method, branch, date range, amount range, quick filters (Today/Week/Month)
- Dark gradient header data grid: Txn ID, Date, Type, Module Source, Customer/Vendor, Debit/Credit Account, Amount, Method, Status, Actions
- Multi-select with bulk export, CSV export, pagination, drill-down detail drawer with journal entry preview, voucher print

### Transaction Types (?tab=types)
- 30 seeded types across 6 categories (income/expense/transfer/adjustment/refund/system)
- 6 KPI cards, PieChart distribution, dark-header table with linked modules badges
- 5-section CRUD form (Basic/Accounting/Module Mapping/Automation/Status), clone/enable/disable

### Customer Collections (?tab=customer-collections)
- Enterprise recovery dashboard with 6 KPI gradient cards: Total Outstanding, Collected Today, Collected This Month, Overdue Amount, Collection Efficiency %, Pending Invoices
- Monthly Collection Trend AreaChart (Collected vs Billed), AR Aging Buckets (0-30, 31-60, 61-90, 90+ days) with clickable filters and progress bars
- Filter bar: search, status, payment method, date range, reset
- Dark gradient header collections grid: Collection ID, Date, Customer (with type), Invoice No, Recovery Officer, Payment Method, Amount, Outstanding After, Status, Actions (View/Print Receipt/Reverse)
- Customer Outstanding Summary table: Customer, Outstanding, Overdue, Oldest Due, Invoice Count, Last Payment, Total Paid, Risk Level (High/Medium/Low with color badges)
- Record Collection 4-section form: Section A (Customer dropdown, Invoice auto-suggest with unpaid filter, outstanding display, branch, recovery officer from employees), Section B (Date, method, amount, reference, cheque#, live net amount), Section C (Debit: Cash/Bank, Credit: AR account), Section D (Controls: auto-adjust AR, partial payment, SMS/email, lock, approval)
- Collection detail drawer: amount/outstanding/invoice summary, journal entry preview, collection details, customer info, collection flags

### Recovery Officer Collection (?tab=recovery-officer)
- Area-wise collection tracking by recovery officer with Summary and Detail view modes
- 6 KPI gradient cards: Total Collected, Today's Collection, Active Areas, Recovery Officers, Top Area, Avg / Area
- Filter bar: area search, area dropdown, officer dropdown; detail mode adds method, status, date range filters
- Summary view: Card grid per area showing total collected, today's collection, transactions, customers, avg per txn, assigned officers, top payment method, collection share % with progress bar
- Detail view (table mode): Area-wise table with zone, officers, transaction count, customers, total/today/avg amounts; click to expand area
- Expanded area detail: Dark header transaction table with Txn ID, Date, Customer, Officer, Method, Amount, Status, Actions (View/Print/Copy)
- Transaction detail dialog: 8-field grid (Txn ID, Date, Customer, Area, Amount, Status, Method, Officer) plus reference/notes; recovery transactions show additional "Recovery & Transfer Details" section (Received By, Transfer Account, Credit Account, Approval Required) with inline Approve/Reject buttons
- CSV export of area collection summary data
- Data derived from customer zone mapping to transaction records (customer.zone → area grouping)
- **Recovery Payment Workflow**:
  - "Recover Payment" button opens 4-section form dialog: (A) Officer & Customer selection with outstanding/zone info and optional invoice link, (B) Cash Recovery Details with date/method/amount/reference, (C) Received By & Transfer Account with journal entry preview, (D) Approval Controls (5 checkboxes: require approval, auto adjust receivable, send notification, lock after save, allow partial payment)
  - Recovery transactions saved with `category="recovery_collection"`, `costCenter` = Received By person, `debitAccountId` = transfer-to account, `createdBy` = recovery officer
  - Pending Recovery Transactions table: shows all `category=recovery_collection` transactions with Recovery ID, Date, Customer, Area, Officer, Received By, Transfer Account, Amount, Status, and Actions (View/Approve/Reject)
  - Approval Confirmation Dialog: shows transaction summary with what will happen on approve (posting, receivable adjustment, status change) or reject (reversal)
  - Status flow: `pending` → `completed` (approve) or `reversed` (reject) via `updateMutation`
  - 8 KPI cards: Total Collected, Today's Collection, Active Areas, Recovery Officers, Pending Approval (orange when >0), Approved (green), Top Area, Avg/Area

### CIR Collections (?tab=cir-collections)
- CIR (Committed Information Rate) dedicated bandwidth client collections
- 6 KPI gradient cards: CIR Outstanding, Collected Today, Collected This Month, Overdue Amount, Active CIR Customers, Collection Efficiency %
- Monthly Collection Trend AreaChart (Collected vs Monthly Recurring), Top Overdue CIR Customers panel
- Filter bar: search, CIR client dropdown, status, payment method, date range, reset
- Dark gradient header collections grid: Collection ID, Date, CIR Customer (with contact), Contract ID, Bandwidth, Payment Method, Amount, Monthly Charges, Status, Actions
- CIR Customer Portfolio table: Company, Contract ID, Bandwidth, Monthly Charges, SLA Level (Platinum/Gold/Silver badges), Contract End, Security Deposit, Status
- Record CIR Collection 4-section form: Section A (CIR customer dropdown with contract/bandwidth/SLA display), Section B (Payment details with bank transfer default), Section C (Accounting posting), Section D (Controls)
- CIR Collection detail drawer: amount/monthly/contract summary, contract details, client info, journal entry, payment/financial info
- CIR Customer detail drawer: full company profile with monthly/bandwidth/total paid/status, contract, technical, financial, contact sections
- CIR collections identified by transaction category "cir_revenue"; 6 seeded CIR customers in seed.ts

### Corporate Collections (?tab=corporate-collections)
- Enterprise B2B corporate client collections management
- 6 KPI gradient cards (Midnight Blue → Royal Blue theme): Corporate Outstanding, Collected Today, Collected This Month, Overdue Amount, Active Corporates, Collection Efficiency % with credit utilization
- Monthly Collection Trend AreaChart, Top Overdue Corporate Clients panel
- Filter bar: search, company dropdown, status, payment method, recovery officer, date range, reset
- Dark gradient header collections grid: Collection ID, Date, Company (with registration), Industry, Payment Method, Amount, Monthly Billing, Credit Limit, Status, Account Manager, Actions
- Corporate Customer Portfolio table: Company (with NTN), Industry, Monthly Billing, Credit Limit, Payment Terms, Account Manager, Connections, Status
- Record Corporate Collection 4-section form: Section A (Corporate client with monthly/credit/connections/payment terms display), Section B (Payment details), Section C (Accounting posting), Section D (Controls)
- Corporate Collection detail drawer: amount/billing/credit summary, corporate details, contact info, journal entry, payment/financial info
- Corporate Customer detail drawer: full profile with monthly/credit/paid/available credit, company profile, financial, contact, technical sections with managed services list
- Corporate collections identified by transaction category "corporate_revenue"; 8 seeded corporate customers (Habib Industries, Allied Healthcare, Faisal Education, Zenith Financial, PakLogistics, Metro Retail, NovaTech, Crescent Pharma) across Manufacturing, Healthcare, Education, Financial Services, Logistics, Retail, Technology, Pharmaceutical industries

### Reseller Collections (?tab=reseller-collections)
- Reseller wallet & credit management collections
- 6 KPI gradient cards (Purple/Violet theme): Reseller Outstanding, Total Wallet Balance, Collected Today, Collected This Month, Resellers on Credit, Active Resellers
- Monthly Collection Trend AreaChart (Collected vs Target), Top Overdue / Low Balance Resellers panel
- Filter bar: search, reseller dropdown, status, payment method, collection type, date range, reset
- Dark gradient header collections grid: Collection ID, Date, Reseller (with area/customers), Collection Type (wallet_topup/credit_settlement/commission_adjustment/security_deposit/penalty_recovery), Payment Method, Amount, Wallet Balance, Credit Limit, Status, Officer, Actions
- Reseller Wallet & Credit Portfolio table: Name, Type, Wallet Balance (color-coded), Credit Limit, Commission %, Territory, Customers, Status
- Record Reseller Collection 4-section form: Section A (Reseller with wallet/credit/customers/security display), Section B (Payment details), Section C (Accounting posting), Section D (Controls: add to wallet, adjust credit, notification, lock, approval)
- Reseller Collection detail drawer: amount/wallet/type summary, reseller details, contact info, journal entry, payment/financial info
- Reseller detail drawer: full profile with wallet/credit/paid/status, reseller profile, financial (credit utilization), territory & coverage, technical
- Reseller collections identified by transaction category "reseller_payment"; vendorId links to reseller; costCenter stores collection type
- 3 seeded resellers (SpeedNet, ConnectPlus, FastWave)

### Refund & Credit (?tab=refund)
- Secure refund and credit adjustment management with approval workflow
- 7 KPI gradient cards (Crimson → Royal Blue theme #7F1D1D → #1D4ED8): Total Refunds, Credits Issued, Pending Requests, Approved, Rejected, Net Adjustment, Refund Ratio %
- Monthly Refund & Credit Trend AreaChart (Refunds vs Credits), Top Entities by Refund Amount panel
- Filter bar: search, type (Refund/Credit), status (Pending/Approved/Rejected/Reversed), entity type (Customer/CIR/Corporate/Reseller), date range, reset
- Dark gradient header (Crimson → Blue) transaction grid: Refund ID, Date, Type (Refund/Credit badge), Entity, Invoice, Category, Amount (negative), Reason, Status, Approved By, Actions (View/Print/Approve/Reject/Reverse)
- Risk & Audit Monitoring panel: Refund Ratio, Pending Queue, Net Revenue Impact, Rejection Rate with threshold alerts
- Approval Workflow Status panel: Pending items with quick Approve/Reject buttons
- Create Refund/Credit 4-section form: Section A (Entity type selector: Customer/CIR/Corporate/Reseller with dynamic dropdown, invoice link, branch), Section B (Refund category: Overpayment/Cancellation/SLA Compensation/Billing Error/Downgrade/Manual/Security Deposit + method: Bank/Wallet/Credit Note/Future Invoice), Section C (Amount, tax adjustment, live net refund, mandatory reason, reference), Section D (Accounting debit/credit, requested by, date, controls: require approval, auto-adjust AR, notification, lock)
- Refund detail drawer: amount/category/status summary, entity details, payment details, journal entry (Sales Return/Refund ↔ Bank/Wallet/AR), financial breakdown, approval workflow info
- Status mapping: completed→Approved, pending→Pending Approval, failed→Rejected, reversed→Reversed
- Refund transactions identified by type "refund" or category "refund"

### Transfer Account (?tab=transfer)
- Secure internal fund transfer management with double-entry accounting compliance
- 6 KPI gradient cards (Dark Teal → Royal Blue #0F766E → #1D4ED8): Transfers Today, Transfers This Month, Cash Balance, Bank Balance, Inter-Branch Transfers, Pending Transfers
- Monthly Transfer Trend AreaChart, Top 5 Most Used Accounts panel
- Filter bar: search, transfer type (Cash→Bank/Bank→Cash/Bank→Bank/Wallet→Bank/Inter-Branch/Internal Ledger), status, account, branch, date range, clear filters
- Dark gradient header (Teal → Blue) transfer grid: Transfer ID, Date, From Account (with arrow icon), To Account (with arrow icon), Branch, Transfer Type (badge), Amount, Fee, Status, Created By, Actions (View/Print/Approve/Reject/Reverse)
- Approval & Audit Log panel: chronological approval/rejection/reversal history with timestamps
- Branch & Liquidity Monitoring panel: Cash Position, Bank Liquidity, Transfer Volume by Branch with transaction counts, pending approval alerts
- Create Transfer 3-section form: Section A (Date, Transfer Type, From/To Account with live balance display, Branch), Section B (Amount, Fee, Reference, Description, live net calculation), Section C (Status: Post Immediately/Requires Approval, Payment Method, Cheque # conditional)
- Transfer detail drawer: transfer details, account flow (source/destination), journal entry preview (Dr/Cr with fee entries), approval info, description
- Same-account validation prevents self-transfers
- Transfer transactions identified by type "transfer"; category stores transfer type; creditAccountId = source, debitAccountId = destination; tax field stores transfer fee
- Status mapping: completed→Completed, pending→Pending Approval, failed→Failed, reversed→Reversed, voided→Cancelled

### Wallet & Prepaid (?tab=wallet)
- Enterprise wallet and prepaid balance management for customers, vendors, and resellers
- 6 KPI gradient cards (Indigo → Cyan theme #4338CA → #06B6D4): Total Wallet Balance, Customer Wallets, Reseller Wallets, Today's Top-Ups, Monthly Volume, Pending Transactions
- Monthly Wallet Activity AreaChart (Top-Ups vs Usage dual area), Top Wallet Holders panel
- Filter bar: search, operation type (Wallet Top-Up/Deduction/Prepaid Credit/Usage/Refund/Transfer), status, entity type (Customer/Vendor/Reseller), date range, clear filters
- Dark gradient header (Indigo → Cyan) transaction grid: Txn ID, Date, Entity (with icon), Entity Type, Operation (color-coded credit/debit badge), Amount (+/−), Method, Balance After, Status, Reference, Actions (View/Print/Approve/Reject/Reverse)
- Recent Wallet Activity Log panel: chronological activity with credit/debit indicators
- Wallet Balance Summary panel: Customer Wallets total, Reseller Wallets total, Operations Breakdown by type with counts, pending approval alerts
- New Wallet Transaction 3-section form: Section A (Entity type selector: Customer/Vendor/Reseller with wallet balance display, operation type, branch), Section B (Amount, fee, date, payment method with JazzCash/EasyPaisa, reference, description, live net amount), Section C (Debit/Credit accounts, status, cheque # conditional)
- Wallet detail drawer: transaction details, entity & amount, journal entry preview (Dr/Cr), approval info, description
- Wallet transactions identified by type "adjustment" with category in (wallet_topup/wallet_deduction/prepaid_credit/prepaid_usage/wallet_refund/wallet_transfer) or costCenter "wallet"

### Approval Workflow (?tab=approval)
- Centralized approval workflow management page for all transaction approval processes
- DB tables: `approval_requests` (24 fields: requestId, transactionId, transactionType, entityName, entityType, amount, branch, requestedBy, approvalLevel, currentLevel, status, approvedBy, rejectedBy, comments, approvalComments, ipAddress, riskCategory, requestDate, approvalDate, category, description), `approval_rules` (13 fields: name, transactionType, minAmount, maxAmount, approvalLevel, approverRole, branch, riskCategory, autoEscalateHours, isActive, description), `approval_history` (10 fields: requestId, action, actionBy, actionDate, comments, ipAddress, previousStatus, newStatus, level)
- CRUD APIs: `/api/approval-requests`, `/api/approval-rules`, `/api/approval-history`
- 6 KPI gradient cards (Charcoal → Royal Blue #1F2937 → #1D4ED8): Total Pending, Approved Today, Rejected Today, High-Value Pending, Escalated, Avg Approval Time
- Monthly Approval Trend AreaChart (Approved/Rejected/Pending stacked), By Transaction Type PieChart
- 4 sub-sections via tabs: Pending Queue, Configuration, History Log, Risk & Governance
- Pending Queue: dark gradient header table with Request ID, Type, Entity, Amount, Branch, Requested By, Level, Date, Risk, Status, Actions (Approve/Reject/Send Back/Escalate/View Details)
- Configuration: 3-level approval hierarchy cards (Accounts Officer/Finance Manager/Admin Director), threshold rules table with CRUD (Rule Name, Transaction Type, Min/Max Amount, Level, Approver Role, Risk, Auto-Escalate, Status), Add/Edit Rule dialog
- History Log: full audit trail table showing all requests with approval/rejection details
- Risk & Governance: 4 governance KPI cards (Approval Rate/Rejection Rate/High-Risk %/Escalation Ratio), Risk Alerts panel for critical pending items, Recent Activity timeline, Escalation & Delay Monitoring
- Request detail drawer: 3 summary cards (Amount/Level/Risk), Request Details section, Decision section, Audit Trail with IP tracking
- Action dialog: Approve/Reject/Escalate/Send Back with mandatory comments for rejection
- Status indicators: Pending (yellow), Approved (green), Rejected (red), Under Review (blue), Escalated (dark)
- Risk categories: Normal (green), Medium (yellow), High (orange), Critical (red)
- 3-level approval hierarchy: L1 Accounts Officer, L2 Finance Manager, L3 Admin/Director
- 10 seeded approval requests across refund/transfer/wallet/write-off/collection/credit_note types
- 6 seeded approval threshold rules, 5 seeded history records

### Add New Account (?tab=add)
- Enhanced `accounts` table with 37 fields: code, name, type, accountTypeId, parentId, description, normalBalance, openingBalance, openingBalanceDate, balance, currency, 7 link flags (linkCustomer/Vendor/Payroll/ResellerWallet/Commission/Expense/BankReconciliation), 4 posting controls (allowDirectPosting/systemGeneratedOnly/lockAfterTransactions/taxApplicable), branch, reportingGroup, categoryTag, 7 bank detail fields (bankName/bankAccountTitle/bankAccountNumber/bankBranchCode/bankIban/bankSwiftCode/bankAddress), isActive, isSystemDefault, createdAt
- Professional 2-column form with 6 sections: Basic Info, Financial Settings, System Integration Mapping (toggle checkboxes), Posting Control, Advanced Options, Bank Account Detail (Bank Name, Account Title, Account Number, Branch Code, IBAN, SWIFT/BIC Code, Bank Branch Address)
- Account Type dropdown linked to account_types table; auto-sets normalBalance by category; multi-currency ready (PKR/USD/EUR/GBP/AED)

### Account List (?tab=accounts)
- 6 gradient KPI cards: Total Accounts, Active Accounts, Total Assets Value, Total Liabilities, Revenue Count, Expense Count
- Enterprise dark-header table: Code, Name, Account Type (color badge), Parent, Current Balance (color-coded), Currency, Status (Active/Inactive/System), Linked Modules (badges), Created Date, Actions
- View Details drawer showing: category, normal balance, opening/current balance, total debit/credit, description, linked modules, bank account details (conditionally shown when bank data exists), posting controls grid
- Edit reuses same form via modal; Delete with confirmation
- Status indicators: Green=Active, Gray=Inactive, Orange=System Linked

### Income Entry (?tab=income)
- Enhanced `transactions` table with 30+ fields: category, tax, discount, netAmount, debitAccountId, creditAccountId, vendorId, chequeNumber, transactionRef, attachment, branch, costCenter, autoAdjustReceivable, allowPartialPayment, sendNotification, lockAfterSave, isRecurring, requireApproval, createdBy, createdAt
- 4 gradient KPI cards (green theme): Today's Income, This Month, Outstanding Receivable, Payment Method Breakdown
- Filter bar: search, date picker, payment method dropdown
- Enterprise dark-header table with: Ref#, Date, Type (category badge), Customer, Debit/Credit Account, Amount, Method, Status, Actions (View/Edit/Void/Delete)
- 4-section modal form: Section A (Basic Info: date, ref#, income type dropdown, customer link, description), Section B (Financial: debit/credit account selects, amount/tax/discount with live net calculation), Section C (Payment: method, transaction ref, conditional cheque# field), Section D (Advanced: toggle checkboxes for auto-adjust/partial/notification/lock/recurring, branch/cost center)
- Transaction detail view dialog showing full breakdown
- Void transaction with confirmation (marks as voided, excluded from reports)
- Income categories: Customer Payment, Installation Fee, Other Income, Manual Revenue, CIR Revenue, Corporate Revenue

### Expense Entry (?tab=expense)
- Same enhanced transactions table as income
- 4 gradient KPI cards (red theme): Today's Expense, This Month, Vendor Payable, Category Breakdown
- Filter bar: search, date picker, expense category dropdown
- Enterprise dark-header table with: Ref#, Date, Category, Vendor/Employee, Debit/Credit Account, Amount, Method, Status, Actions
- 4-section modal form: Section A (Basic Info: date, ref#, expense category dropdown, vendor link), Section B (Financial: debit expense account/credit payment source, amount/tax/discount), Section C (Payment), Section D (Advanced Controls: auto-adjust vendor payable/recurring/lock/require approval/notify)
- Expense categories: Vendor Payment, Salary, Commission, Utility, Maintenance, Bandwidth, Operational, Other Expense

### Budget Allocation (?tab=budget)
- DB tables: `budgets` (18 fields: name, year, period, startDate, endDate, totalAmount, allocatedAmount, usedAmount, branch, allocationMethod, status, softWarningPercent, hardStopPercent, approval/notification controls) and `budget_allocations` (8 fields: budgetId, accountId, department, costCenter, allocatedAmount, usedAmount, notes)
- CRUD APIs: `/api/budgets` and `/api/budget-allocations` with `/api/budget-allocations/budget/:budgetId` for filtering

## Expense Tracking (/expenses)
- Enterprise financial analytics dashboard replacing basic CRUD page
- 5 major sections: Summary Dashboard, Advanced Filters, Analytics Charts, Tracking Table, Drill-Down Detail
- **Section 1 - Summary Dashboard**: 6 gradient KPI cards (Today's Expense, This Month, Year-to-Date, Budget Allocated, Budget Used %, Remaining Budget) with budget progress bar and status badge (Under Budget/Near Limit/Over Budget)
- **Section 2 - Advanced Filters**: Quick filter buttons (Today/Month/Quarter/Year), search, category dropdown (ISP-specific: Utility Bills, Bandwidth, Router & Equipment, Salary, Office Rent, Fiber Maintenance, Marketing, Commission, Installation), status filter, branch filter, payment method filter, reset button
- **Section 3 - Analytics Charts**: 4 Recharts visualizations: Pie Chart (expense by category), Bar Chart (monthly trend), Stacked Bar (branch-wise expense), Composed Chart (budget vs actual comparison)
- **Section 4 - Tracking Table**: Dark gradient header (slate-800→slate-700), alternating rows, sortable columns (date/category/amount), pagination (15 per page), columns: Date, Voucher No, Category (color badge), Description, Branch, Payment Method, Amount, Status (Pending/Approved/Rejected/Paid badges), Actions (View/Edit/Delete)
- **Section 5 - Drill-Down Detail**: Full-screen dialog showing voucher amount header, Voucher Details section, Organization section (branch/area/vendor), Description, Notes, Audit Trail, action buttons (Edit/Print/Close)
- Delete confirmation dialog; Add/Edit modal form with ISP-specific expense categories
- Data sources: `/api/expenses`, `/api/transactions`, `/api/budgets`, `/api/budget-allocations`, `/api/vendors`, `/api/accounts`, `/api/areas`

## Reseller Type & Role Management (/resellers?tab=types)
- DB table: `reseller_types` with commission model, territory, branding, API access, wallet, customer limits
- Seeded 4 defaults: Authorized Dealer, Sub-Reseller, Franchise, White Label
- "Add New Type & Role" button with full CRUD (create/edit/delete)
- Form: label, key, icon, color, status, commission model/rate, territory exclusive, sub-resellers, custom branding, API access, wallet, min/max customers, features list
- KPI cards: Total Types, Active, Territory Exclusive, API Access Enabled
- Type cards with permissions grid (checkmarks/crosses), features badges, edit/delete buttons
- Reseller add/edit forms now include dynamic "Reseller Type & Role" dropdown populated from DB
- Reseller list table shows Type column with icon badges
- Add New Reseller page: 4-step wizard (Personal Info → Packages → Network & Service → Billing and Account)
  - Step 1 Personal Info: Name, Gender, Occupation, DOB, Father Name, Address, CNIC, Registration Form No, Remarks, Profile/CNIC/Registration Form file uploads
  - Step 2 Packages: Reseller Type, Vendor, Default Package, Allowed Packages, Commission settings, Customer limits, Package list cards
  - Step 3 Network & Service: Phones, Email, Contact, City/Area/Territory, Connection Type, Bandwidth, IP Assignment, NAS, Service Zone, Support Level
  - Step 4 Billing & Account: Wallet, Credit Limit, Security Deposit, Opening Balance, Billing Cycle, Payment Method, NTN, Status, Bank Details, Agreement/Contract
- DB fields: name, resellerType, gender, occupation, dateOfBirth, fatherName, contactName, phone, secondaryPhone, email, cnic, ntn, registrationFormNo, address, city, area, territory, profilePicture, cnicPicture, registrationFormPicture, vendorId, packageId, assignedPackages, commissionRate, commissionPaymentMethod, commissionPaymentFrequency, walletBalance, creditLimit, securityDeposit, totalCustomers, agreementStartDate, agreementEndDate, agreementType, autoRenewal, connectionType, bandwidthPlan, ipAssignment, nasId, serviceZone, bankName, bankAccountTitle, bankAccountNumber, bankBranchCode, billingCycle, paymentMethod, openingBalance, supportLevel, maxCustomerLimit, notes, status
- Edit Reseller dialog: expanded to max-w-3xl with all fields organized in labeled sections

## CIR Customers (/cir-customers)
- Committed Information Rate (dedicated bandwidth) client management
- DB table: `cir_customers` with bandwidth, IP, SLA, billing, RADIUS, monitoring fields
- Dashboard KPIs: Total, Active Bandwidth, Monthly Revenue, Suspended, Expiring Contracts
- Multi-section form (Company Info, Bandwidth, IP Config, Contract & SLA, Billing, Monitoring)
- Full CRUD with Zod validation on backend

## Corporate Customers (/corporate-customers)
- Multi-branch enterprise client management
- DB tables: `corporate_customers` + `corporate_connections` (branch connections)
- Dashboard KPIs: Total Corporates, Active, Monthly Revenue, Total Connections, Suspended
- Multi-section form (Company Info, Billing, Contract & SLA, Services, Summary)
- Branch connections sub-view with per-branch package/bandwidth/IP management
- Full CRUD with Zod validation on backend

## Employee Profile (/employee-profile/:id)
- 4 tabs: Employee Information, Personal Information, Salary History, App Login Detail
- Salary History tab: "Pay Salary" button creates a payroll entry directly marked as paid (month selector, editable amount, payment type, bank account details, transaction reference, remarks)
- Salary History tab: "Add Salary" button for manual salary history entries (salary date, month, paid amount, overtime, incentive, bonus, remarks, given by)
- Edit/Delete salary entries, filters (month, date range), pagination, search

## HR Employee List Features
- 4 KPI summary cards (Total/Active/On Leave/Terminated) with colored icons
- Enhanced data table with gradient dark header (slate-800 to slate-700)
- Color-coded department badges (engineering=blue, support=teal, sales=violet, finance=amber, admin=slate, management=indigo, hr=pink, it=cyan, operations=orange)
- Employment type badges (Full Time=emerald, Part Time=blue, Contract=amber, Intern=violet, Probation=orange)
- Gender indicators (M=blue circle, F=pink circle)
- Solid status badges (Active=emerald, On Leave=amber, Terminated=red)
- Alternating row colors with hover effects
- Enhanced pagination (First/Prev/Page Numbers/Next/Last)
- Action buttons: View, Edit, Print, Delete (outline variant with colored text)
- Filter bar: Status, Department dropdowns + page size selector + search input

## Advance & Loan Management (/advances)
- Dedicated page with KPI cards (Active Loans, Advances This Month, Outstanding Balance, Overdue)
- Two tabs: List (data table with filters) and Reports (summary cards)
- Issue Advance/Loan dialog: 3-section form (Employee, Loan Details, Approval)
- Auto EMI calculation for installment-based loans
- Loan Detail dialog: summary cards + installment schedule table with Mark Paid
- Auto-generates installment records on create; marking paid auto-updates loan balance
- Type badges: Advance=blue, Loan=violet; Status: Active=blue, Pending=amber, Completed=emerald, Overdue=red
- Sidebar link: /advances (under HR & Payroll)

## Salary Processing (/salary)
- Dedicated page with 6 KPI cards (Total Employees, Gross Salary, Total Deductions, Net Payable, Paid Count, Pending Salary)
- Pending Salary KPI: shows total pending amount across all employees + employee count (orange themed)
- Month selector with payroll status badge (No Data/Draft/Processed/Approved/Paid)
- Process Payroll: auto-generates entries for all active employees with base salary, loan deductions, tax calculation
- Data table: employee info, salary breakdown (base, overtime, bonus, loan deduction, tax, net), pending column, status, actions
- Pending column: shows pending month count badge + total pending amount per employee (orange themed, from /api/payroll/pending-summary)
- Edit dialog: adjust overtime, bonus, commission, attendance deduction, tax, other deductions, auto-recalculates net
- Partial Payment System: salary_payments table tracks individual payments per payroll entry
  - Pay dialog shows remaining amount for partial entries, pre-fills with remaining balance
  - Status auto-updates: "partial" when paidAmount < netSalary, "paid" when paidAmount >= netSalary
  - Payslip dialog shows payment progress (bar), paid/remaining/payment count, full payment history table
  - Each payment record is editable (amount, method, ref, remarks) and deletable
  - Editing/deleting payments auto-recalculates payroll status
  - API: GET/POST /api/payroll/:id/payments, PATCH/DELETE /api/salary-payments/:id
- Pay Salary dialog: editable Paying Amount, Payment Type selector (Bank Account/Cash/Cheque/Online Transfer), bank details, transaction reference, remarks
- Approve individual entries, Lock/Unlock entire payroll (batch API)
- Unlock Payroll: reverts locked entries to "processed" so they can be edited again
- Pay Salary: checkbox selection for single or multiple employees, bulk pay dialog with per-employee editable amounts, Payment Type selector, bank account list per employee for bank type, transaction reference, remarks textarea
- Select All checkbox in table header; selection info bar shows count + total; clear selection button
- Add Pending Salary: dialog to add pre-system pending salary entries for employees (YYYY-MM range, max 24 months, duplicate detection)
- Batch endpoints: POST /api/payroll/lock, /api/payroll/unlock, /api/payroll/bulk-pay, /api/payroll/add-pending
- GET /api/payroll/pending-summary?excludeMonth=YYYY-MM: returns per-employee unpaid salary summary (count, totalAmount, months[], entries[]) — includes both "pending" and "partial" status entries from old months, with detailed breakdown (month, status, netSalary, totalPaid, remaining per entry)
- GET /api/payroll/payments-summary?month=YYYY-MM: returns per-payroll-entry payment summary (totalPaid, paymentCount, remaining) for Paid/Remaining columns in table
- Salary table shows "Paid" column (green amount + progress bar) and "Remaining" column (red amount) for each entry
- View Payslip dialog: professional payslip layout with earnings/deductions breakdown + pending salary info box + payment history table with edit/delete per payment
- Department-wise distribution chart + Payroll breakdown summary cards
- Payroll statuses: pending (orange), draft (slate), processed (blue), approved (amber), locked (indigo), partial (yellow), paid (emerald)
- DB tables: `payroll` (employeeId, payrollMonth, baseSalary, deductions, net, status, paymentMethod, paymentRef, paidDate), `salary_payments` (payrollId, amount, paymentMethod, paymentRef, remarks, paidDate, paidBy)

## Bonus & Commission Management (/bonus-commission)
- Dedicated page with 5 KPI cards (Total Bonus, Total Commission, Pending Approvals, Top Performer, Paid Expense)
- Month selector + filters (Type, Status, Department) + search
- Add Bonus/Commission dialog: employee selector, type (Fixed Bonus/Performance Bonus/Sales Commission/Collection Commission/Installation Commission/Custom Incentive)
- Dynamic form sections based on type: performance fields (target/achieved), commission fields (linked source/amount/rate with auto-calculation)
- Payroll integration: include in payroll toggle + payroll month selector
- Approval workflow: pending → approved → paid (or rejected)
- Server-side Zod validation + duplicate prevention per employee/type/month
- View detail dialog: full breakdown with employee info, type, calculation, approval timeline, payment status
- Reports section: department-wise distribution bar chart + top 5 employees ranking
- DB table: `bonus_commissions` (employeeId, type, incentiveType, amount, month, targetValue, achievedValue, commissionRate, linkedSource, status, approvedBy, paidDate)
- **Commission Types Management**: "Manage Types" button opens dialog to configure bonus/commission types with:
  - Name, code, category (bonus/commission), calculation mode (fixed amount or percentage), amount/percentage
  - Automatic toggle with trigger events: customer_installation, customer_renewal, customer_upgrade, invoice_collection
  - Status (active/inactive), description
  - DB table: `commission_types` (name, code, category, amount, calculationMode, percentage, isAutomatic, triggerEvent, status)
  - CRUD API: `/api/commission-types`
- **Customer Installation Commission (Auto)**: When a commission type with `triggerEvent: "customer_installation"` is active and automatic:
  - Creating a new customer with `connectedBy` field matching an employee (empCode, fullName, or ID) auto-creates a pending commission entry
  - Fixed mode: uses commission type's amount; Percentage mode: calculates from customer's monthly bill
  - Auto-entry: type=installation_commission, status=pending, requestedBy="System (Auto)", linkedSource=customer ID

## Employee Types & Roles (/employee-types-roles)
- 4 tabs: Employee Types, Roles & Permissions, Org Hierarchy, Analytics
- 5 KPI cards (Employee Types, Active Roles, Management Roles, Field Staff, Contract Types)
- Employee Types: CRUD table with category, working hours, salary structure, eligibility toggles (bonus/commission/overtime)
- Roles & Permissions: CRUD table with department, level, reports-to, commission eligibility, module permissions checkboxes, clone role feature, view details dialog
- Org Hierarchy: visual tree sorted by role level
- Analytics: department distribution + employee type breakdown
- DB tables: `employee_types`, enhanced `roles` table with roleLevel, commissionEligible, etc.

## Shift & Scheduling (/shift-scheduling)
- 4 tabs: Shift Types, Assignments, Schedule Calendar, Analytics
- 5 KPI cards (Total Shifts, Assigned Today, Night Shift, Overtime Enabled, Rotational Shifts)
- Shift Types: full CRUD with start/end time, break minutes, paid break, overtime rules (allowed/after/multiplier), grace period (late/early exit), shift type (fixed/rotational/flexible/split), night/shift allowances, color picker
- Shift Assignment: individual assign (employee + shift + date range) and bulk assign (by department)
- Schedule Calendar: weekly view with employee rows, color-coded shift cells, off-day marking, weekend logic, prev/next week navigation, today button, hover tooltips
- Analytics: shift distribution chart, department shift coverage (with % bars), shift summary cards, overtime & allowances overview
- DB tables: `shifts` (name, code, branch, dept, timing, overtime rules, grace, type, allowances, color, status), `shift_assignments` (employeeId, shiftId, effectiveFrom/To, assignmentType, weekendDays, status)

## Staff User Login Page (/login)
- Premium enterprise split-screen login with gradient branding panel
- Left panel: NetSphere branding, security badges (Role-Based Access, Multi-Branch, Device Binding, GPS Tracking), wave animation
- Right panel: Login form with Username/Employee ID, Password (with toggle), Login Mode dropdown (Office/Field/Recovery/Technician/Admin), Branch selection, Remember Me checkbox
- Forgot Password flow with email reset (separate screen with success confirmation)
- Security features: failed attempt counter (5 max), auto-lock with 60s cooldown timer, shake animation on wrong password
- Login activity logging: every login attempt (success/failed) records userId, username, role, loginMode, branch, IP address, device type, user agent
- Account suspension check (403 response for inactive accounts)
- Remember Me extends session to 7 days
- Mobile responsive (stacked layout on small screens)
- DB table: `login_activity_logs` (userId, username, employeeName, role, loginMode, branch, ipAddress, deviceType, userAgent, status, failReason, loginAt, logoutAt)

## Customer Type Management (/customers?tab=types)
- Dynamic customer type CRUD with database-backed `customer_types` table
- KPI cards: Total Types, Active Types, Total Customers, Default Type
- "Add New Customer Type" button with full form dialog
- Table columns: Type (color-coded badge + default star), Key (code tag), Description, Billing Cycle, Late Fee %, Grace Period, Auto Suspend days, Requirements (CNIC/NTN badges), Customer count, Status
- Form fields: Label, Key, Description, Color picker, Icon selector, Status, Billing Cycle, Late Fee %, Grace Period, Auto Suspend Days, Sort Order, Requires CNIC toggle, Requires NTN toggle, Default Type toggle
- Edit/Delete via dropdown actions per row
- Seeded default types: Home, Business, Enterprise, Reseller, Corporate, Government
- DB table: `customer_types` (key, label, description, icon, color, isDefault, status, billingCycle, lateFeePercentage, gracePeriodDays, requiresCnic, requiresNtn, autoSuspendDays, sortOrder)

## Employee App Login Control & Area Allocation (/access)
- 6-tab interface: HRM Roles, Staff Users, App Access, Areas, Area Allocation, Login Activity Logs
- App Access Configuration: per-role mobile app login control with:
  - Allow/deny app login toggle
  - Login type modes: Office, Field, Recovery, Sales, Technician
  - Device restriction: Single Device, Multiple Devices, Device Binding
  - GPS tracking & live location requirements
  - Feature permission builder: checkbox-based feature toggles per mode
- Area Allocation & Territory Management:
  - Area master setup showing customer counts and assigned staff
  - Employee-to-area assignments with primary/secondary designation
  - Assignment Purpose: General, Complaints, Recovery, Sales, Installation, Maintenance, Survey — color-coded badges
  - Multiple area assignment per employee supported
  - Bulk Assign Areas dialog: select employee + purpose + multiple areas with checkboxes (Select All/Clear)
  - Filter bar: Employee dropdown filter, Purpose dropdown filter, search input (employee/area/emp code)
  - Employee summary card: appears when filtering by specific employee — shows avatar initials, assigned areas count, total customers, recovery areas, complaint areas
  - Table columns: Employee, Department, Area, City/Zone, Customers (from area), Recovery (shows customer count for recovery-purpose assignments), Purpose badge, Type (Primary/Secondary), Allowed Areas (active area count per employee), Effective dates, Status
  - Effective date ranges, notes, and status tracking
  - KPI cards: Total/Active assignments, Primary areas, Unique employees
- Enterprise blue gradient theme (#002B5B to #007BFF)
- DB tables: `app_access_configs` (roleId, allowAppLogin, appLoginType, deviceRestriction, gpsTracking, liveLocation, appFeatures), `area_assignments` (employeeId, areaId, isPrimary, assignmentPurpose, effectiveFrom/To, status, assignedBy, notes)
- Sidebar: HRM section includes App Access Control and Area Allocation links

## Staff User Login & Account Management (/staff-accounts)
- Dedicated page for creating, managing, and controlling employee system access
- Top summary dashboard: 5 gradient stat cards (Total Accounts, Active Users, Locked Accounts, Web Access, App Access)
- Staff account data table with dark gradient header, alternating rows, search + filters (Role, Status, Branch)
- Create Staff Login modal: 3-section form (Employee Selection with auto-fill from HRM, Account Credentials with password generator/strength meter, Login Access Configuration)
- Password management: reset password dialog with generate/copy, password strength indicator
- Account controls: enable/disable toggle, lock/unlock, delete account via dropdown menu
- Login history dialog: per-user login activity with date, IP, device, status, fail reason
- CSV export of filtered accounts
- Role badges: Admin=purple with shield, Manager=blue with shield, Staff=gray
- Status badges: Active=emerald, Disabled=red, Locked=orange, Not Created=gray
- Login type badges: Web=blue monitor, App=teal smartphone, Both=purple globe
- Security: unique username validation, password min 6 chars, force password change on first login, 2FA toggle, device restriction, max login attempts, account expiry
- Extended `users` table: employeeId, department, branch, loginType, accountStatus, maxLoginAttempts, deviceRestriction, twoFactorEnabled, forcePasswordChange, accountExpiryDate, lastLoginAt, createdAt
- API routes: POST /api/users, PATCH /api/users/:id, POST /api/users/:id/reset-password, POST /api/users/:id/toggle-status, GET /api/users/:id/login-history, DELETE /api/users/:id
- Sidebar: HRM > Account Management (/staff-accounts)

## Task Management Module (/tasks)
- **Dashboard tab** (?tab=dashboard): 6 KPI cards, Weekly Task Completion chart, Tasks by Department pie, Tasks by Project pie, Tasks by Branch bar, Team Workload Distribution stacked bar, Overdue Tasks alert
- **Task List tab** (?tab=list): Advanced table with 7 filters, sortable columns, CSV export, quick status actions, checkbox multi-select with Bulk Status Update bar, Days Remaining column
- **Kanban Board tab** (?tab=kanban): 6-column drag-and-drop board (Assigned, In Progress, Pending Approval, On Hold, Completed, Overdue), visual task cards with priority/progress/deadline
- **Timeline & Performance tab** (?tab=timeline): 5 performance KPIs, task timeline, Team Performance Ranking with productivity scores
- **Team Management tab** (?tab=team): Per-member workload cards with completion rate, overdue rate, active tasks, current task list
- **Statuses**: pending, in_progress, pending_approval, on_hold, completed, cancelled; overdue detected dynamically
- **Create/Edit Task Dialog**: 4-section form (A: Task Details with auto-generated TSK-00001 code, project/dept/branch/type/customer linking; B: Assignment with assignee/supervisor/priority/hours/progress; C: Timeline with start/due/reminder dates and auto-calculated days remaining; D: Notes & Checklist)
- **Task Detail Dialog**: Full task view with badges, timeline, progress bar, checklist, notes (internal/customer/general), quick actions
- Schema: `tasks` table expanded with taskCode, supervisor, department, branch, startDate, reminderDate, estimatedHours, progress, checklist, internalNotes, customerNotes, createdAt; projectId links to projects table

## Progress Tracking Page (/progress-tracking)
- **Progress Overview tab**: 6 KPI cards (Active Projects, Active Tasks, Overall Completion %, Overdue Tasks, On-Time Rate, Avg Duration), Weekly Progress Trend line chart, Project Completion Distribution pie, Department Performance Comparison stacked bar, Priority-Based Completion progress bars
- **Project Progress tab**: Per-project progress cards with auto-calculated completion %, task breakdown (total/completed/pending/overdue), delay indicators with delay days, progress bars, budget/timeline info
- **Task Monitoring tab**: Filterable task grid with department/assignee/overdue filters, columns for Code/Title/Project/AssignedTo/Priority/Est.Hours/Progress/DueDate/Status/Delay, sortable, CSV export
- **Employee Performance tab**: Employee Ranking by efficiency score, Monthly Productivity Trend chart, Department Leaderboard, Detailed Employee Metrics table (assigned/completed/on-time rate/overdue/avg duration/efficiency score)
- **Timeline View tab**: Project timeline overview with per-task progress and delay visualization, Milestone Progress section, Delay Analysis with overdue task listing sorted by severity
- Sidebar: Task Management > Progress Tracking (/progress-tracking)

## Project Management Module (/projects)
- **Dashboard tab** (?tab=dashboard): 6 KPI cards (Active, Completed, Delayed, Near Deadline, Total Budget, Budget Used), Monthly Project Trend bar chart, Projects by Department pie chart, Active & Delayed Projects overview cards
- **Project List tab** (?tab=list): Searchable/filterable table with sort by name/date/progress/budget, status/department/type filters, CSV export, inline actions (view, edit, mark completed, put on hold, set active, delete)
- **Timeline & Progress tab** (?tab=timeline): Visual progress tracker with milestones, task counts, budget usage per project
- **Budget & Resources tab** (?tab=budget): 4 budget summary cards, detailed budget breakdown table with variance and utilization
- **Create/Edit Project Dialog**: 4-section form (Basic Info, Timeline, Budget, Team & Responsibility), auto-generated project codes (PRJ-0001), linked expense accounts, milestone tracking
- **Project Detail Dialog**: Full project overview with progress, tasks, budget, team, milestones
- Schema: `projects` table with 30 fields including projectCode, department, branch, projectType, budget fields, team, milestones, tags
- Tasks linked via `projectId` FK on `tasks` table
- Sidebar: Task Management > Projects (/projects?tab=dashboard)

## Task Audit Page (/task-audit)
- **Audit Summary tab**: 6 KPI cards (Total Activities, Modified Today, Status Changes, Reassignments, Due Date Changes, Deletions), Daily Activity Trend bar chart, Action Type Distribution pie chart, Most Modified Projects ranking, Most Active Users ranking
- **Activity Log tab**: Full audit trail table with Log #, Task, Project, Action Type, Old/New Values, Performed By, Date/Time, Severity. Filters: search, action type, user, project, severity. Sort by date asc/desc. CSV export. Task History dialog (timeline view of all changes per task)
- **Alerts & Monitoring tab**: Suspicious Activity Monitor (auto-detects multiple status changes, frequent due date extensions, repeated reassignments, deletions), Deletion Log, Critical Changes panel
- Schema: `task_activity_logs` table (taskId, taskCode, taskTitle, projectId, projectName, actionType, fieldChanged, oldValue, newValue, performedBy, performedByRole, ipAddress, deviceInfo, description, severity, createdAt)
- Audit logging on all task CRUD: create, update (per-field), delete with before/after values
- Sidebar: Task Management > Task Audit (/task-audit)

## Key Database Tables
- `advance_loans` - Employee advances/loans (type, amount, paidAmount, repaymentType, installments, approvalStatus, status)
- `loan_installments` - Installment schedule per loan (loanId, installmentNo, dueDate, amount, paidDate, status)
- `leaves` - Employee leave requests (type, dates, status, remarks, reason, approvedBy)
- `holidays` - Public/company holidays (name, date, type, description, recurring)
- `payroll` - Monthly salary processing (employeeId, payrollMonth, baseSalary, deductions, netSalary, status, paymentMethod, paidDate)
- `bonus_commissions` - Bonus/commission entries (employeeId, type, incentiveType, amount, month, commissionRate, linkedSource, status, approvedBy, paidDate)
- `attendance` - Daily attendance with check-in/out times, locations, devices, shifts
- `attendance_breaks` - Break tracking per attendance record
- `employee_types` - Employment categories (name, category, workingHours, salaryStructure, eligibility flags, probation, leavePolicy)
- `shifts` - Shift types (name, code, startTime, endTime, totalHours, breakMinutes, overtimeRules, graceMinutes, shiftType, allowances, color)
- `shift_assignments` - Employee shift assignments (employeeId, shiftId, effectiveFrom/To, assignmentType, weekendDays, status)

## Network & IPAM Page (/ipam)
- **IP Pool Overview tab** (?tab=overview): 7 KPI cards (Total IP Pools, Total Subnets, Total IPs, Used IPs, Available IPs, Reserved IPs, VLANs), 3 charts (IP Utilization pie, Subnet Distribution bar, VLAN Usage pie), IP Pools Summary table with utilization bars
- **Subnet Management tab** (?tab=subnets): Full CRUD for subnets, auto CIDR calculation (total hosts, usable hosts, broadcast, gateway), IP types (Public/Private/CGNAT/Management), POP/branch, linked device
- **VLAN Configuration tab** (?tab=vlans): Full CRUD for VLANs (ID 1-4094), VLAN types (Internet/Management/IPTV/VoIP/Corporate/Backhaul), status indicators (Active/Disabled/Maintenance), subnet assignment, linked device
- **IP Allocation tab** (?tab=allocation): Full IP address CRUD with enhanced fields (MAC, service type, linked device), status actions (Reserve/Release/Unreserve), filters by status and type, CSV export
- **Conflict Detection tab** (?tab=conflicts): Auto-detection of duplicate IPs, VLAN ID conflicts, IP conflicts, subnet exhaustion alerts (>80%), severity badges, IPAM activity logs table
- Schema: `ip_addresses` (16 fields), `subnets` (16 fields), `vlans` (9 fields), `ipam_logs` (9 fields)
- Theme: NOC Dashboard with Deep Blue → Cyan gradient (#1E3A8A → #06B6D4)

## MikroTik / BRAS Integration Page (/mikrotik)
- **Device Overview tab** (?tab=overview): 6 NOC KPI cards (Total Devices, Active, Offline, Online Users, PPPoE Sessions, Avg Response), 24h Network Traffic area chart, Device Status pie, Device Types breakdown, Integrated Devices table with status indicators/test connection/edit/delete
- **Router Config tab** (?tab=routers): MikroTik router card grid with connection status, IP/port/location/uptime/CPU/MEM, Test Connection, Configure, Security Settings (Encrypted Credentials, IP Whitelisting, Access Control)
- **BRAS / RADIUS tab** (?tab=bras): RADIUS Server Configuration (IP, Secret, Auth/Accounting Ports, NAS ID), RADIUS Features toggles, Supported Service Types (PPPoE, Hotspot, Static IP, DHCP), RADIUS Profiles table from `/api/radius-profiles`
- **User Sync tab** (?tab=sync): 6 sync KPI cards, Automation Rules panel, Subscriber Sync Status table with sync indicators (Synced/Pending/Failed), Force Sync/Disconnect actions
- **Live Sessions tab** (?tab=sessions): Real-time active session grid with username/customer/router/IP/MAC/download/upload/data used/status, Disconnect session, Bandwidth Distribution chart, Session Statistics
- **Logs & Automation tab** (?tab=logs): 4 log type KPIs (API/RADIUS/Sync/Automation), System log table with timestamp/type/device/action/status/code/details, System Automation Logic cards (Customer Created/Invoice Overdue/Payment Received/Bandwidth Upgraded triggers)
- Theme: NOC Dashboard with teal-to-blue gradient, status indicator dots (green=connected, red=disconnected, amber=warning)
- All existing CRUD preserved: network-devices, pppoe-users with add/edit/delete dialogs

## RADIUS / AAA Integration Page (/radius)
- **5-tab NOC dashboard** rebuilt from single CRUD page
- **Theme**: Deep Indigo → Violet gradient (`from-indigo-900 to-violet-600`)
- **Profile Dashboard tab** (?tab=dashboard): 8 KPIs (Total/Active/Inactive Profiles, Total Subscribers, Online Sessions, NAS Devices, Active NAS, Auth Events), 3 charts (Profile Status pie, Subscribers per Profile bar, Data Quota bar), Profile Quick Stats summary table
- **Bandwidth Profiles tab** (?tab=profiles): Full CRUD for `radius_profiles` with search/status filter, columns: Name, Download, Upload, Burst DL/UL, Priority, Quota, Session/Idle Timeout, Address Pool, Shared Users, Status. Actions: Edit, Duplicate, Delete. CSV export
- **NAS / Device Management tab** (?tab=nas): Full CRUD for `radius_nas_devices` (nasName, nasIpAddress, radiusSecret, nasType, location, authPort, acctPort, status, description), show/hide secret toggle, Test Connection action, subscriber count per NAS
- **Session Accounting tab** (?tab=accounting): 4 KPIs (Total/Active/Data/Avg Sessions), subscriber session table from `pppoe_users` with customer lookup, Disconnect action
- **Authentication Logs tab** (?tab=logs): 5 event type KPIs, searchable/filterable log table from `radius_auth_logs`, Failed Authentication Alerts card for Auth-Reject events
- **DB tables**: `radius_nas_devices` (nasName, nasIpAddress, radiusSecret, nasType, location, authPort, acctPort, status, connectedSubscribers, lastSeen, description), `radius_auth_logs` (eventType, username, nasDevice, clientIp, replyMessage, rejectReason, macAddress, status, timestamp)
- All profile/NAS mutations auto-log to `radius_auth_logs`

## Bandwidth Usage Monitor Page (/bandwidth-usage)
- **6-tab NOC analytics dashboard** rebuilt from simple CRUD table
- **Theme**: Electric Blue → Indigo gradient (`from-blue-600 to-indigo-600`)
- **Global Overview tab** (?tab=overview): 6 KPIs (Current Traffic, Peak Today, Avg Daily, Data Today, Online Users, Congested Devices), Real-time Upload/Download area chart (live animated), Peak Hour Timeline bar chart, Usage Summary with Current Throughput / 5-Min Average / 95th Percentile cards
- **POP / Router Usage tab** (?tab=pop): Router-level traffic table with POP location, download/upload, capacity, utilization % with color-coded bars (green <60%, amber 60-80%, red >80%), subscriber count, status indicators, POP Traffic Comparison bar chart
- **Customer Usage tab** (?tab=customers): Per-subscriber bandwidth table with username, customer, package, speed, data used, sessions, FUP status bar, throttle status, status. Filters: search, package filter, heavy users toggle. Actions: View Usage, Disconnect, Apply Throttle
- **VLAN Analytics tab** (?tab=vlan): VLAN traffic table with total/peak usage, packet loss, latency, utilization bars. VLAN Utilization bar chart, Traffic by VLAN Type pie chart
- **Trends & Reports tab** (?tab=trends): Traffic Growth Trend area chart (30 days), Top 10 Consumers bar chart, POP Traffic Comparison, raw bandwidth usage records table with search/date filter, full CRUD (Add/Edit/Delete), CSV export
- **Alerts & FUP tab** (?tab=alerts): 4 alert KPIs (Critical/Warnings/FUP Triggered/Devices Offline), Active Alerts list with severity-coded cards (congestion/FUP exceeded/device down/traffic spikes), Fair Usage Policy Monitor table with usage % bars and actions (Apply Throttle/Manual Override/Notify Customer)
- **DB table**: `bandwidth_usage` (customerId, pppoeUserId, date, downloadMb, uploadMb, totalMb, peakDownload, peakUpload, sessionCount, avgLatency)
- Cross-references: `pppoe_users`, `network_devices`, `vlans`, `customers`

## Customer Map Page (/customer-map)
- **GIS-based NOC intelligence dashboard** rebuilt from area-card layout to full interactive map
- **Theme**: Blue → Teal gradient (`from-blue-600 to-teal-500`)
- **Map Panel**: Full Leaflet.js interactive map with colored customer markers (🟢 Active, 🔴 Disconnected, 🟡 Suspended, 🔵 Corporate), infrastructure device markers (POP/Router/OLT gold markers), auto-centering on customer locations
- **Map Layers**: Light Map (OpenStreetMap), Dark Map (Stadia Dark), Satellite (Esri), Hybrid (Esri Street)
- **6 KPI Cards**: Total Customers, Active, Suspended, Corporate, POP Count, Coverage Areas
- **Filter Bar**: Search (name/ID/area/address/IP), Area filter, Status filter, POP/Server filter, Package filter, Service Type filter, marker legend
- **Customer Popups**: Click marker shows Name, Account ID, Speed, Status, IP, VLAN, POP, Connection Type, Package, Connection Date, View Details/Navigate buttons
- **Infrastructure Layer**: Toggle-able POP/Router/OLT device markers from `network_devices` with location coords, showing device name/type/IP/status/CPU/memory, high-utilization warnings
- **Customer List Panel**: Scrollable customer list sidebar, click-to-focus on map with fly-to animation, shows name/area/package/IP
- **Area Analytics Panel**: Customers by Area bar chart, Status Distribution pie chart, Service Types pie chart, Area Quick Access list; click area to drill down with area-specific stats (Total/Active/Suspended/Revenue) and customer table
- **Customer Detail Modal**: Full customer card with Package, Speed, IP Address, VLAN/Zone, POP/Router, Connection Type, Installation Date, Monthly Bill, Address, Phone, Last Activity. Actions: View Profile, Navigate (Google Maps), Create Task
- **Navigate**: Opens Google Maps with customer lat/lng coordinates
- Cross-references: `customers` (mapLatitude, mapLongitude, area, zone, server, connectionType), `packages`, `network_devices`

## Service Outages Page (/outages)
- **6-tab NOC emergency operations dashboard** rebuilt from basic CRUD page
- **Theme**: Red to Deep Orange gradient (`from-red-600 to-orange-500`)
- **Overview tab** (?tab=dashboard): 6 KPIs (Active Outages, Major Incidents, Customers Affected, POPs Affected, Avg Resolution Time, SLA Breaches), 4 charts (Outages by Region bar, Monthly Incident Trend area, Root Cause Distribution pie, Resolution Time by Severity bar)
- **Active Outages tab** (?tab=active): Full outage grid with ID, Title, Type, Severity, POP, Device, Affected Customers, Start Time, Status, Assigned Engineer, ETA. Filters: search, severity, POP, status. SLA breach highlighting (red/amber rows). Actions: View Details, Edit, Resolve, Escalate, Delete
- **Report Incident tab** (?tab=create): Professional incident form with Outage Types (Fiber Cut, Router Down, Power Failure, VLAN Failure, BRAS Issue, OLT Down, DDoS Attack, Scheduled Maintenance), Severity (Critical/High/Medium/Low), Affected POP/Device/VLAN/Area, Customers/Corporate impacted, Technician/Team assignment, SLA limit, checkboxes for Notify Customers/Management and Create Linked Task
- **Impact Analysis tab** (?tab=impact): 4 impact KPIs (Total/Corporate Affected, Areas Impacted, Revenue Impact), Impact by Outage Type chart, Active Incidents detail table with duration tracking
- **SLA Tracking tab** (?tab=sla): 4 SLA KPIs (Within SLA, Near Breach, Breached, Escalated), SLA monitoring table with elapsed/limit/response/resolution times, visual SLA progress bars (green/amber/red), breach indicators, Escalate action
- **Incident Timeline tab** (?tab=timeline): Chronological vertical timeline with color-coded dots (red=ongoing, green=resolved, amber=warning, blue=info), action/notes/user/timestamp for each entry, linked to outage incidents
- **Outage Detail Modal**: Full incident card with severity/status badges, outage type, affected area/POP/device, customer/corporate counts, engineer/team, timestamps, root cause, resolution, live SLA countdown timer, embedded timeline with add-note capability, quick actions (Edit, Resolve, Escalate)
- **SLA Countdown**: Real-time SLA timer component showing remaining/breached time, auto-refreshes every minute
- **DB tables**: `outages` (enhanced with outageType, affectedPop, affectedDevice, affectedVlan, assignedEngineer, assignedTeam, slaLimitMinutes, resolutionTimeMinutes, slaBreach, corporateAffected, revenueImpact, escalated fields), `outage_timeline` (outageId, action, status, user, notes, timestamp)
- Auto-generates timeline entries on create/resolve/escalate

## General Settings Module (`/general-settings`)
- **Page**: `client/src/pages/general-settings.tsx`
- **Schema**: `general_settings` table — key-value store with settingKey (unique), settingValue, category, label, description, fieldType, updatedAt, updatedBy
- **Theme**: Deep Slate → Royal Blue (`from-[#334155] to-[#2563EB]`)
- **Routes**: GET `/api/general-settings` (all), GET `/api/general-settings/:category`, PUT `/api/general-settings` (bulk upsert), PUT `/api/general-settings/single` (single upsert)
- **Storage**: Upsert-based — updates existing keys or inserts new ones, `updatedAt` set server-side
- **Layout**: Left sidebar category navigation (6 categories) + right content panel (per-category forms)
- **Category navigation**: Shows status badges (Configured/Partial/Missing/Default) based on filled required keys
- **6 Configuration Sections**:
  1. **Company Profile** (11 fields): name, legal name, registration, tax ID, industry, website, email, phone, address, logo, favicon
  2. **Localization** (8 fields): country, currency, symbol, date format, time format, timezone, language, number format — with impact notice card
  3. **System Defaults** (11 fields): dashboard, landing module, auto-logout, session timeout, password policy, 2FA, upload limit, pagination, maintenance mode + message
  4. **Financial Defaults** (8 fields): tax rate, calculation method, payment terms, invoice prefix/format, currency precision, discount type, rounding rules — with impact notice card
  5. **Operational Preferences** (11 fields): PO approval, asset transfer approval, serial/batch tracking, SKU generation, reorder alerts, negative stock, default warehouse, multi-level approval, auto-assignment, notification triggers
  6. **Branding & UI** (8 fields): primary/secondary colors (with color pickers + hex inputs), dark/light mode, sidebar layout, compact view, footer text, login background, portal branding — with live theme gradient preview
- **Features**: Per-category save buttons, unsaved changes indicator badge, reset button, loading/error gating, maintenance mode warning card, switch toggles for boolean settings, select dropdowns with appropriate options
- **Sidebar**: Updated from `/settings?tab=general` to `/general-settings`

## Activity Log Module (`/activity-log`)
- **Page**: `client/src/pages/activity-log.tsx`
- **Schema**: No new tables — consolidates 4 existing log tables: `activity_logs`, `audit_logs`, `login_activity_logs`, `task_activity_logs`
- **Theme**: Charcoal → Deep Blue (`from-[#1F2937] to-[#1E40AF]`)
- **Layout**: Top KPI dashboard → Charts → Filter panel → 5-tab interface
- **KPI Cards (6)**: Activities Today, Failed Logins, Critical Changes, Deleted Records, Payment Modifications, Configuration Changes
- **Charts**: Activity by Module (horizontal bar), Activity by User (horizontal bar)
- **Advanced Filters**: Search text, date range, module, action type, user, status, clear button
- **5 Tabs**:
  1. **User Activities** — Full audit log table with expandable rows showing before/after data diff (old vs new values side-by-side), user avatars, action/module badges, entity links, IP addresses
  2. **Module Activities** — Activity log table (action/module/description) + Task activity logs with field change tracking (old→new values)
  3. **Security Events** — 4 KPI cards (failed logins, deletions, config changes, payment mods), security events table aggregating failed logins, record deletions, config changes, payment mods, data exports — with severity badges and IP tracking
  4. **System Logs** — Login/session logs table with username, employee, role, mode, branch, device type, IP, status (success/failed with reason), logout time
  5. **Export & Archive** — CSV export (functional), Excel/PDF (coming soon), log statistics summary, retention period config (30/90/180/365/unlimited), auto-archive schedule, compliance card
- **Sidebar**: Updated from `/settings?tab=activity-log` to `/activity-log`

## Payment Gateway Settings Module (`/payment-gateway-settings`)
- **Page**: `client/src/pages/payment-gateway-settings.tsx`
- **Schema**: 2 new tables + leverages existing `payment_gateways` + `payments` + `general_settings`:
  - `gateway_webhooks` — id, webhookId (auto `GWHK-XXXXXX`), gatewayId, eventType, webhookUrl, enabled, retryOnFailure, maxRetries, notifyAdminOnFailure, lastTriggered, lastStatus, totalDelivered, totalFailed
  - `gateway_settlements` — id, settlementId (auto `GSTL-XXXXXX`), gatewayId, transactionFeePercent, fixedFee, settlementCycle, autoFeeDeduction, taxOnTransaction, grossAmount, gatewayFee, taxAmount, netAmount, status, periodStart, periodEnd, settledAt
  - Key-value settings via `general_settings` with `payment_gateway_*` category prefix
- **Theme**: Deep Blue → Teal (`from-[#1E3A8A] to-[#0D9488]`)
- **Routes (12)**:
  - Webhooks: GET all, GET by gateway, POST, PATCH, DELETE `/api/gateway-webhooks`
  - Settlements: GET all, GET by gateway, POST, PATCH `/api/gateway-settlements`
  - Settings: GET/PUT `/api/payment-gateway-settings`
- **Layout**: Left panel gateway list + right panel 6 tabs
- **6 Tabs**:
  1. **Gateway Configuration** — Per-gateway: active toggle, environment (sandbox/live), status (active/sandbox/disconnected), provider type, charge %, total transactions
  2. **API & Security** — Per-gateway: API key, secret key, merchant ID, public key (masked with show/hide), callback URL, webhook URL (copy buttons), security toggles (IP validation, duplicate prevention, webhook verification, credential encryption), PCI compliance card
  3. **Transaction Rules** — Per-gateway: 6 automation toggles (auto-receipt, auto-mark-paid, partial payment, late fee, auto-credit, auto-income), limits display. Global rules: min/max payment, currency conversion, timeout, auto-cancel unpaid, refund support, retry failed, overpayment handling (credit/refund/manual)
  4. **Webhooks** — CRUD for 5 event types (payment success/failed, refund, chargeback, settlement), per webhook: gateway assignment, URL, enable/disable, retry config, admin notify, delivery stats
  5. **Settlement & Fees** — Per-gateway: 4 KPI cards (fee %, monthly volume, gateway fees, net received), settlement history table with gross/fees/net/status
  6. **Transaction Logs** — 4 status KPI cards, searchable/filterable transaction table (by customer/status/gateway), dark gradient header, pagination
- **Sidebar**: Updated from `/settings?tab=payment` to `/payment-gateway-settings`

## Notification Settings Module (`/notification-settings`)
- **Page**: `client/src/pages/notification-settings.tsx`
- **Schema**: 3 tables:
  - `notification_channels` — id, channelId (auto `NCHX-XXXXXX`), name, channelType (in_app/web/sms/email/whatsapp/push), enabled, apiStatus, deliveryTimeout, retryAttempts, fallbackChannel, templateMapping, priority, config
  - `notification_triggers` — id, triggerId (auto `NTRG-XXXXXX`), eventName, eventCategory, enabled, channels (JSON), priority, messageTemplate, delay, delayMinutes, roleBasedTrigger, targetRoles, customerGroupTrigger, targetCustomerGroups, branchSpecific, targetBranches
  - `notification_logs` — id, logId (auto `NLOG-XXXXXX`), triggerId, channelType, recipient, subject, message, status, errorMessage, apiResponse, retryCount, sentAt, deliveredAt
  - Also uses `general_settings` key-value store with `notification_*` category prefixes
- **Theme**: Indigo → Electric Blue (`from-[#4F46E5] to-[#2563EB]`)
- **Routes (14)**:
  - Channels: GET/POST/PATCH/DELETE `/api/notification-channels`
  - Triggers: GET all, GET by category, GET by id, POST, PATCH, DELETE `/api/notification-triggers`
  - Logs: GET `/api/notification-logs`, GET `/api/notification-logs/stats`, POST create, POST resend
  - Settings: GET/PUT `/api/notification-settings` (key-value via general_settings)
- **6 Tabs**:
  1. **General Settings** — System-wide enable/disable, default priority, timezone, quiet hours (start/end), default language, multi-language support, notification grouping, history retention, expiry duration
  2. **Channel Configuration** — CRUD for 6 channel types (In-App/Web/SMS/Email/WhatsApp/Push), each with enable/disable, API status, delivery timeout, retry attempts, fallback channel, template mapping, priority
  3. **Event-Based Triggers** — CRUD with 7 categories (Billing/Payment/Service/Inventory/HR/Support/System), per-trigger: channel selection, priority, message template, delay mode (instant/scheduled), role-based/customer-group/branch-specific targeting
  4. **Delivery & Retry Rules** — Max retry attempts, retry interval (minutes/hours), fallback channel, escalation after failure, auto-disable threshold, delivery reporting, bounce tracking, spam detection threshold, automation logic info card
  5. **Customer Preferences** — Customer self-control panel, opt-in/opt-out, channel preference selection, language selection, billing-only mode, GDPR compliance, privacy protection, example/benefits cards
  6. **Logs & Monitoring** — 4 KPI cards (total/delivered/failed/pending), searchable/filterable log table with dark gradient header, resend failed, view API response, export logs
- **Sidebar**: Updated from `/settings?tab=notification` to `/notification-settings`

## Invoice Templates Module (`/invoice-templates`)
- **Page**: `client/src/pages/invoice-templates.tsx`
- **Schema**: `invoice_templates` table — 70+ fields covering template identity, layout section toggles (header/invoice/customer/item/footer), financial/tax config, branding/styling, print/PDF settings, digital export options
- **Theme**: Slate → Royal Blue (`from-[#334155] to-[#2563EB]`)
- **Auto-ID**: `INVT-XXXXXX`
- **Routes (8)**:
  - GET `/api/invoice-templates` (all), GET `/api/invoice-templates/category/:category`, GET `/api/invoice-templates/:id`
  - POST `/api/invoice-templates` (create), PATCH `/api/invoice-templates/:id` (update)
  - POST `/api/invoice-templates/:id/duplicate` (copy with draft status), POST `/api/invoice-templates/:id/set-default` (swap default within category)
  - DELETE `/api/invoice-templates/:id` (blocked if default)
- **5 Invoice Category Tabs**: Customer / Corporate / CIR / Reseller / Inventory — each with own template list, KPI cards (total/active/default counts)
- **5 Editor Tabs per Template**:
  1. **Layout Builder** — Header (4 toggles: logo, company, tax reg, contact + custom text), Invoice Info (5 toggles), Customer Section (4 toggles), Item Table (8 column toggles), Footer (5 toggles + notes/bank/terms text areas)
  2. **Financial & Tax** — Tax mode (inclusive/exclusive), tax label, multi-tax, tax breakdown, withholding tax, late fee, currency symbol/position, decimal precision, rounding rule, discount column, grand total in words, multi-currency
  3. **Branding & Styling** — Primary/accent colors with pickers + hex, font family (6 options), font size, table header style, border style, logo position, watermark text, company seal toggle, live gradient preview
  4. **Print & PDF** — Page size (A4/Letter/Legal/A5), orientation, 4 margin inputs, page numbers, QR payment link, barcode, email-ready formatting, digital stamp, signature URL
  5. **Live Preview** — Real-time rendered invoice with sample data reflecting all configuration: header, customer section, item table with 3 rows, subtotal/discount/tax/total breakdown, footer with notes/bank/terms/signature/QR — updates instantly on any field change
- **Template Actions**: Duplicate, Set Default, Activate/Deactivate, Delete (protected for defaults)
- **Sidebar**: Updated from `/settings?tab=invoice-template` to `/invoice-templates`

## Customer Rights Module (`/customer-rights`)
- **Page**: `client/src/pages/customer-rights.tsx`
- **Schema**: 2 tables:
  - `customer_groups` — id, groupId (auto `CGRP-XXXXXX`), name, description, groupType (default/package/corporate/residential/region/vip/suspended/custom), isSystem, isArchived, totalCustomers, appAccessEnabled, webAccessEnabled, activeRestrictions, createdBy, createdAt, updatedAt, updatedBy
  - `customer_rights` — id, groupId (FK), category, featureKey, enabled, webAccess, appAccess, conditions, updatedAt
- **Theme**: Royal Blue → Teal (`from-[#1D4ED8] to-[#0D9488]`)
- **Routes (8)**:
  - GET `/api/customer-groups` (list), GET `/api/customer-groups/:id`, POST `/api/customer-groups` (create with auto-ID), PATCH `/api/customer-groups/:id`
  - POST `/api/customer-groups/:id/duplicate` (copies group + rights), DELETE `/api/customer-groups/:id` (archive, blocks system groups)
  - GET `/api/customer-rights/:groupId`, PUT `/api/customer-rights/:groupId` (bulk upsert + auto-recalculates activeRestrictions/appAccess/webAccess)
- **Layout**: 3-col left group panel + 9-col right permissions panel, 4-tab interface
- **6 Feature Categories (37 features)**:
  1. **Billing** (7): View bill, billing history, download invoice PDF, payment history, outstanding balance, tax breakdown, usage details
  2. **Payment** (6): Online payment, partial payment, auto-pay, save method, refund status, credit notes
  3. **Notification** (6): Push notifications, SMS/email history, marketing toggle, service alerts, billing reminders
  4. **Preferences** (3): Opt-in/out marketing, language selection, notification channel
  5. **Service & Account** (8): Active package, bandwidth usage, upgrade request, support ticket, ticket tracking, outages, contract download, assigned assets
  6. **Self-Service** (7): Change password, update profile, update contact, relocation, suspension, technician visit, complaints
- **4 Tabs**:
  1. **Billing & Payment** — Billing + Payment category sections with per-feature Enable/Web/App toggles, conditional billing rules (6 rules: suspended, investigation, overdue banner, payment limits, corporate bulk, prepaid hide)
  2. **Notifications** — Notification + Preferences sections, advanced notification controls (4 rules: mandatory critical, promotional campaigns, silence non-critical, compliance)
  3. **Services & Self-Service** — Service + Self-Service sections, restriction controls (6 rules: unpaid support, locked upgrade, asset visibility, relocation overdue, OTP, session timeout), security controls (3: mask financial, payment validation, access logs)
  4. **Summary** — 5 KPIs (Enabled/Financial/Restricted/Web/App counts), smart warnings (payment disabled, critical notifications disabled, financial visibility disabled), feature overview grid, integration notes
- **Group Management**: Left panel with group list, type-colored badges, Create/Edit/Duplicate/Archive, Initialize 7 Default Groups button
- **KPI Row**: 6 cards (Customer Groups, System Groups, Custom Groups, Features Enabled, Restricted, Active Restrictions)
- **Auto-Stats**: Saving rights auto-recalculates group's activeRestrictions, appAccessEnabled, webAccessEnabled
- **Sidebar**: Updated from `/settings?tab=customer-rights` to `/customer-rights`

## HRM Rights Setup Module (`/hrm-rights-setup`)
- **Page**: `client/src/pages/hrm-rights-setup.tsx`
- **Schema**: 2 tables:
  - `hrm_roles` — id, roleId (auto `ROLE-XXXXXX`), name, description, isSystem, isArchived, totalModules, fullAccessModules, limitedAccessModules, appAccessEnabled, webAccessEnabled, createdBy, createdAt, updatedAt, updatedBy
  - `hrm_permissions` — id, roleId (FK), module, submenu, canView, canCreate, canEdit, canDelete, canApprove, canExport, canPrint, webAccess, appAccess, dataScope, conditions, updatedAt
- **Theme**: Slate → Indigo (`from-[#334155] to-[#4F46E5]`)
- **Routes (8)**:
  - GET `/api/hrm-roles` (list active), GET `/api/hrm-roles/:id`, POST `/api/hrm-roles` (create with auto-ID), PATCH `/api/hrm-roles/:id` (update, strips immutable fields)
  - POST `/api/hrm-roles/:id/duplicate` (copies role + all permissions), DELETE `/api/hrm-roles/:id` (archive, blocks system roles)
  - GET `/api/hrm-permissions/:roleId`, PUT `/api/hrm-permissions/:roleId` (bulk upsert + auto-recalculates role stats)
- **Layout**: 3-col left role panel + 9-col right permission panel, 4-tab interface
- **4 Tabs**:
  1. **Permission Matrix** — Expandable modules (11 modules, 50+ submenus), per-submenu 7-action toggle grid (View/Create/Edit/Delete/Approve/Export/Print), column-wide toggle all, per-module Grant Full/Revoke All buttons, access level badges (Full/Limited/No Access)
  2. **Action-Level Config** — Data scope selects (Own/Department/All) per submenu, granular action toggles, conditional access rules (view own, restrict delete, restrict financial, restrict cost)
  3. **App vs Web Control** — Per-module and per-submenu Web/App toggle switches, platform badge labels (Both/Web Only/App Only/Disabled), module-level platform propagation
  4. **Summary & Validation** — 4 summary KPIs (total granted, high-risk, financial access, delete rights), high-risk warning card, financial access alert for non-finance roles, module overview grid with platform badges, permission inheritance rules
- **Role Management**: Left panel with role list, role actions (Edit/Duplicate/Archive), system role lock protection, Create New Role dialog, Edit Role dialog, Initialize Default Roles button (8 system roles)
- **KPI Row**: 6 cards (Total Roles, System Roles, Custom Roles, Total Modules, Full Access, Limited Access)
- **Auto-Stats**: Saving permissions auto-recalculates role's totalModules, fullAccessModules, limitedAccessModules, appAccessEnabled, webAccessEnabled
- **Sidebar**: Updated from `/settings?tab=hrm-rights` to `/hrm-rights-setup`

## SMS, Email & WhatsApp API Module (`/sms-email-api`)
- **Page**: `client/src/pages/sms-email-api.tsx`
- **Schema**: 4 tables:
  - `sms_providers` — 27 fields: providerId, name, apiBaseUrl, apiKey, secretKey, senderId, routeType, countryCode, encoding, rateLimit, fallbackProvider, retryAttempts, timeoutDuration, callbackUrl, ipWhitelist, testMode, status, priority, messagesSent/Delivered/Failed, totalCost, lastSyncAt, createdBy, createdAt, updatedAt
  - `email_providers` — 34 fields: providerId, name, providerType (smtp/api/cloud), smtpHost, smtpPort, encryption, username, password, fromEmail, fromName, apiEndpoint, apiKey, domain, webhookUrl, dkimStatus, spfStatus, bounceHandling, throttleRate, bulkRate, fallbackProvider, retryAttempts, timeoutDuration, testMode, status, priority, emailsSent/Delivered/Failed/Bounced, totalCost, lastSyncAt, createdBy, createdAt, updatedAt
  - `whatsapp_providers` — 35+ fields: providerId, name, providerType (cloud_api/twilio/360dialog/wati/custom), businessAccountId, phoneNumberId, displayPhoneNumber, apiBaseUrl, accessToken, appSecret, webhookVerifyToken, webhookUrl, businessName, businessVerified, qualityRating, messagingLimit, rateLimit, templateNamespace, defaultLanguage, fallbackProvider, retryAttempts, timeoutDuration, testMode, status, priority, messagesSent/Delivered/Read/Failed, totalCost, lastSyncAt, createdBy, createdAt, updatedAt
  - `message_logs` — 15 fields: messageId, type, provider, providerId, recipient, subject, body, module, campaign, status, sentAt, deliveredAt, failureReason, cost, createdAt
- **Theme**: Deep Blue → Cyan (`from-[#1E3A8A] to-[#06B6D4]`), WhatsApp green gradient (`from-[#25D366] to-[#128C7E]`)
- **Auto-IDs**: `SMS-NNN`, `EML-NNN`, `WA-NNN`, `MSG-XXXXXX`
- **Routes**: CRUD for SMS/Email/WhatsApp providers, POST `/:id/test` (simulated test with status transition), POST `/:id/toggle` (enable/disable), GET/POST for message logs
- **PATCH safety**: Strips immutable fields (createdAt, createdBy, providerId, delivery metrics, totalCost)
- **Status indicators**: connected, testing, configured, rate_limited, disconnected, disabled
- **KPI Cards**: 8 — Active SMS, Active Email, WhatsApp Providers, Sent Today, Success Rate, Failed, API Health, Est. Monthly Cost
- **Charts**: 4 — Success vs Failure (donut), Daily Usage Trend (area), Cost by Provider (bar), Error Type Breakdown (progress bars)
- **5 Tabs**: Gateway Overview (charts), SMS Providers (card grid with masked keys, metrics), Email Providers (card grid with DKIM/SPF status, metrics), WhatsApp (card grid with quality rating, business verified badge, sent/delivered/read metrics), Delivery Logs (10-col table, filters with whatsapp type, export, charts)
- **SMS Editor (3 tabs)**: Connection (name, URL, API key, secret, sender ID, country), Routing (route type, encoding, rate limit, fallback, callback URL), Advanced (retry, timeout, IP whitelist, test mode)
- **Email Editor (3 tabs)**: Connection (name, type, conditional SMTP/API fields, webhook), Sender (from email/name, fallback, throttle/bulk rates), Advanced (retry, timeout, bounce handling, test mode)
- **WhatsApp Editor (3 tabs)**: Connection (name, type, business account ID, phone number ID, display phone, API base URL, access token, app secret, webhook verify token, webhook URL), Business (business name, template namespace, default language, messaging limit, fallback), Advanced (rate limit, retry, timeout, test mode)
- **View Details Dialog**: Full provider config display with delivery metric cards (supports SMS/Email/WhatsApp)
- **Masked credentials**: API keys displayed as masked strings on provider cards
- **Sidebar**: Updated from `/notifications?tab=api` to `/sms-email-api`

## Bulk & Campaign Module (`/bulk-campaigns`)
- **Page**: `client/src/pages/bulk-campaigns.tsx`
- **Schema**: `bulk_campaigns` table — 33 fields: campaignId, name, campaignType, priority, module, title, body, bannerImage, icon, deepLink, audienceType, audienceValue, audienceCount, schedulingType, scheduledAt, recurringPattern, timezone, expiryTime, requireAcknowledgment, frequencyCap, deviceTargets, status, totalTargeted/Delivered/Failed/Opened/Clicked/Acknowledged, sentAt, completedAt, createdBy, createdAt, updatedAt
- **Theme**: Indigo → Emerald (`from-indigo-700 to-emerald-600`, `#4F46E5 → #059669`)
- **Auto-ID**: Server-side `CMP-XXXXXX` generation (max+1 scan)
- **Routes**: GET/POST/PATCH/DELETE `/api/bulk-campaigns`, POST `/:id/launch` (draft/scheduled only), POST `/:id/pause` (active only), POST `/:id/resume` (paused only), POST `/:id/cancel` (not completed/cancelled), POST `/:id/complete` (active only), POST `/:id/duplicate`
- **PATCH safety**: Strips immutable fields (createdAt, createdBy, campaignId, status, sentAt, completedAt, delivery metrics); `updatedAt` set server-side
- **Status Machine**: draft → active (launch), active → paused (pause), paused → active (resume), active → completed (complete), any (except completed/cancelled) → cancelled (cancel)
- **KPI Cards**: 8 — Total Campaigns, Active, Scheduled, Total Recipients, Total Delivered, CTR, Engagement Rate, Failed
- **Charts**: 4 — By Module (horizontal bar), Delivery Trend (area), Audience Segmentation (donut), Status Distribution (pie)
- **3 Tabs**: Campaign Overview (4 charts), Campaign Management (11-col table, 4 filters, search, export), Performance Analytics (6 metric cards, device breakdown pie, failure reasons bars, performance area chart)
- **Create/Edit Dialog (5 tabs)**: Basic Info (name, type, priority, module), Message Content (title, body, banner, icon, deepLink), Audience (9 audience types with conditional fields + targeting guide), Advanced (scheduling, recurring, expiry, frequency cap, acknowledgment), Preview (desktop + mobile + summary)
- **Row Actions**: View Details, Edit (draft/scheduled), Duplicate, Launch Now (draft/scheduled), Pause (active), Resume (paused), Mark Complete (active), Cancel (not completed/cancelled), Delete
- **Sidebar**: Updated from `/notifications?tab=bulk` to `/bulk-campaigns`

## Push SMS Console (`/push-sms`)
- **Page**: `client/src/pages/push-sms.tsx`
- **Schema**: `push_messages` table — 33 fields: messageId, channel (sim_sms/email_sms/whatsapp), recipientType (individual/group/city/plan/payment_status/staff/manual/bulk_csv), recipientValue, recipientNames, recipientCount, subject, body, templateId, variables, mediaUrl, ctaButton, paymentLink, scheduledAt, expiryAt, recurring, recurringPattern, batchSize, sendingSpeed, channelPriority, fallbackChannel, campaignName, status (draft/queued/scheduled/sending/sent/partially_sent/failed/cancelled), totalSent/Delivered/Failed/Pending, sentAt, completedAt, createdBy, createdAt, updatedAt
- **Theme**: Midnight Blue → Emerald (`from-[#1E3A8A] to-[#059669]`)
- **Auto-ID**: Server-side `PM-NNNN` generation (max+1 scan)
- **Routes**: GET/POST/PATCH/DELETE `/api/push-messages`, POST `/:id/send` (simulated delivery with 92% success), POST `/:id/retry` (retry failed with 70% recovery), POST `/:id/cancel`
- **KPI Cards**: 6 — SIM Devices, Email Gateways, WhatsApp Channels, Messages Sent, Delivery Rate, Failed
- **5 Tabs**: SIM SMS (device status from sms_providers, quick send, recent messages), Email SMS (gateway list from email_providers, info card, recent messages), WhatsApp (channel list from whatsapp_providers, features card, recent messages), Bulk Upload (CSV upload area, batch/speed config, compose form with personalization variables), Logs & Reports (searchable table with channel/status filters, export CSV, channel distribution pie, status distribution pie)
- **Message Composer Dialog (3 tabs)**: Recipients (8 recipient types with conditional fields: individual customer select, manual phone entry, city/plan/payment filters, group select, advanced exclusion filters, recipient count display), Message (WhatsApp template select, subject, body with char counter/SMS segments, personalization variable insertion, media URL, CTA button, payment link toggle), Delivery (campaign name, schedule datetime, expiry, recurring toggle with pattern, sending speed, batch size, fallback channel with delivery flow visualization)
- **View Details Dialog**: Full message details with delivery metric cards (Sent/Delivered/Failed/Pending), retry/cancel actions
- **Integrates with**: sms_providers, email_providers, whatsapp_providers, customers (for recipient targeting)
- **Sidebar**: Added under Notifications & Messaging

## Push Notifications Module (`/push-notifications`)
- **Page**: `client/src/pages/push-notifications.tsx`
- **Schema**: `push_notifications` table — 27 fields: pushId, title, body, module, priority, icon, imageBanner, audienceType, audienceValue, triggerType, scheduledAt, recurringPattern, deepLink, expiryTime, silentPush, requireAcknowledgment, status, deviceTargets, deliveryCount, clickCount, failedCount, acknowledgedCount, sentAt, createdBy, createdAt, updatedAt
- **Theme**: Electric Blue → Violet (`from-[#2563EB] to-[#7C3AED]`)
- **Auto-ID**: Server-side `PUSH-XXXXXX` generation (max+1 scan)
- **Routes**: GET/POST/PATCH/DELETE `/api/push-notifications`, POST `/:id/send` (strict: only draft/scheduled), POST `/:id/cancel` (strict: only scheduled), POST `/:id/duplicate`
- **PATCH safety**: Strips immutable fields (createdAt, createdBy, pushId, status, sentAt, delivery metrics); `updatedAt` set server-side
- **KPI Cards**: 8 — Total Push, Sent Today, Scheduled, Failed, Success Rate, CTR, Delivered, Click Count (with loading/error gating)
- **Charts**: 4 — By Module (horizontal bar), Delivery Trend 7-day (area), Device Distribution (donut), Status Distribution (pie) (with loading/error gating)
- **3 Tabs**: Push Overview (12-column table, filters, search), Push History (sent-only filtered view), Delivery Analytics (6 metric cards, device pie chart, failure reasons breakdown, performance area chart)
- **Create/Edit Dialog**: 4 tabs — Basic Info (title, body, module, priority, device), Audience (6 types with conditional fields), Advanced (trigger, schedule, deep link, expiry, silent push, acknowledge), Preview (desktop browser, mobile device, admin dashboard live mockups)
- **Row Actions**: View Details, Edit (draft/scheduled only), Duplicate, Send Now (draft only), Cancel (scheduled only), Resend (sent → creates copy), Delete
- **Send Immediately**: Frontend creates as draft then calls `/send` endpoint (proper two-step flow)
- **Sidebar**: Updated from `/notifications?tab=push` to `/push-notifications`

## Alert & Templates Module (`/alert-templates`)
- **Page**: `client/src/pages/alert-templates.tsx`
- **Schema**: Enhanced `notificationTemplates` table with `module`, `priority`, `description`, `usageCount`, `lastUsedAt`, `createdBy`, `createdAt`, `updatedAt` fields
- **Backend**: Dedicated PATCH route strips immutable fields (`createdAt`, `createdBy`, `usageCount`, `lastUsedAt`) and sets `updatedAt` server-side
- **Routes**: GET/POST/PATCH/DELETE `/api/notification-templates` (replaced generic crudRoutes)
- **Theme**: Royal Blue → Amber (`from-[#1D4ED8] to-[#F59E0B]`) — consistent with Notification Types
- **KPI Cards**: 8 cards — Total, Active, Inactive, Email, SMS, Dispatched, Delivered, Failed
- **Analytics Charts**: 4 charts — Templates by Type (donut), Channel Distribution (bar), Delivery Status (pie), Dispatch Trend 7-day (area)
- **3 Tabs**: Template Library (11-column table with gradient header, filters, search, CSV export), Dispatch History (8-column table linked to templates), Variable Reference (dynamic vars list + usage guide + best practices)
- **Template Editor**: 3-tab dialog (Details & Settings, Content Editor with quick-insert variables, Live Preview with sample data)
- **Template Preview**: Full details dialog with metadata, variables, sample message preview, raw template view
- **Row Actions**: Preview, Edit, Duplicate, Toggle Active/Inactive, Delete
- **Sidebar**: Updated from `/notifications?tab=templates` to `/alert-templates`

## Network & IPAM Map (`/network-map`)
- **Page**: `client/src/pages/network-map.tsx`
- **Schema**: 6 new tables:
  - `fiber_routes` (14 fields): routeId, name, coordinates (JSON polyline), oltId, fiberCoreCount, usedFibers, totalLengthM, cableType, status, color, notes, createdAt, updatedAt
  - `network_towers` (11 fields): towerId, name, lat, lng, height, towerType, status, address, notes, createdAt, updatedAt
  - `olt_devices` (13 fields): oltId, name, lat, lng, ipAddress, vendor, model, totalPonPorts, usedPonPorts, status, notes, createdAt, updatedAt
  - `gpon_splitters` (12 fields): splitterId, name, lat, lng, oltId, ponPort, splitRatio, usedPorts, fiberRouteId, status, notes, createdAt, updatedAt
  - `onu_devices` (16 fields): onuId, serialNumber, macAddress, customerId, splitterId, splitterPort, lat, lng, opticalPower, servicePlan, ipAddress, status, activationDate, notes, createdAt, updatedAt
  - `p2p_links` (17 fields): linkId, name, towerAId, towerBId, towerALat/Lng, towerBLat/Lng, frequencyBand, bandwidthMbps, distanceKm, rssi, latencyMs, status, notes, createdAt, updatedAt
- **Theme**: Deep Navy → Electric Blue (`from-[#0B1120] to-[#2563EB]`)
- **Auto-IDs**: FR-NNNN, TWR-NNNN, OLT-NNNN, SPL-NNNN, ONU-NNNN, P2P-NNNN
- **Routes**: Full CRUD (GET/POST/PATCH/DELETE) for all 6 entity types: `/api/fiber-routes`, `/api/network-towers`, `/api/olt-devices`, `/api/gpon-splitters`, `/api/onu-devices`, `/api/p2p-links`
- **KPI Cards**: 8 — Fiber Routes, OLT Devices, Splitters, ONU/ONT, Towers, P2P Links, IP Addresses, Subnets
- **Map**: Interactive Leaflet map with custom SVG icons, 4 tile layers (Street/Satellite/Dark/Hybrid), layer toggle panel, status legend, network summary
- **6 Tabs**: Network Map (full interactive map with layer controls, fiber polylines, device markers, P2P link lines, click-to-place), OLT Devices (table), GPON Splitters (table), ONU/ONT (table), Fiber Routes (table), P2P Links (table)
- **Map Layers**: Fiber Routes (polylines with color coding), Wireless Links (dashed lines), OLT Nodes, Splitters, ONU/ONT, Towers, IP Overlay
- **PON Structure View**: OLT detail dialog shows full hierarchy: OLT → PON Port → Splitter → ONU → Customer
- **Add/Edit Dialogs**: Per-entity forms with map click coordinate placement, fiber route point-by-point drawing tool
- **Detail Dialog**: Full entity details with related data (splitter shows connected ONUs, OLT shows PON structure, tower shows P2P links)
- **Status Colors**: Active=Green, Warning=Yellow, Planned=Blue, Maintenance=Orange, Down=Red, Disconnected=Gray
- **Sidebar**: Added under Network & IPAM as "FTTH / P2P Map"

## Reports Module (`/reports/*`)
- **Dashboard** (`/reports`): `client/src/pages/reports.tsx` — Central reports landing with KPI summary cards (Revenue, Customers, Network, HR, Assets), revenue trend + customer growth + payment method charts, quick-access category grid navigating to dedicated pages, date range & branch filters
- **Customer Reports** (`/reports/customers`): `client/src/pages/reports-customers.tsx` — Tabs: Overview, Growth, Area Distribution, Plan Distribution, Churn. KPI cards + line/pie/bar charts + filterable data table + CSV/PDF export
- **Billing & Invoice** (`/reports/billing`): `client/src/pages/reports-billing.tsx` — KPI cards (Total/Paid/Unpaid/Outstanding), revenue line chart (12 months), aging breakdown (0-30/30-60/60-90/90+ days), plan-wise revenue bar chart
- **Payment Reports** (`/reports/payments`): `client/src/pages/reports-payments.tsx` — Collection KPIs, daily trend chart, payment method pie, payment table with filters
- **Network & IPAM** (`/reports/network`): `client/src/pages/reports-network.tsx` — OLT/PON utilization, ONU online/offline, IP pool usage, P2P link status, utilization bar charts
- **Inventory Reports** (`/reports/inventory`): `client/src/pages/reports-inventory.tsx` — Stock summary KPIs, low stock alerts, category/brand breakdown charts
- **Asset Reports** (`/reports/assets`): `client/src/pages/reports-assets.tsx` — Allocation summary, assigned/available/faulty distribution, asset type breakdown
- **HRM Reports** (`/reports/hrm`): `client/src/pages/reports-hrm.tsx` — Attendance summary, salary totals, department/designation distribution, leave stats
- **Notification Reports** (`/reports/notifications`): `client/src/pages/reports-notifications.tsx` — SMS/Email/WhatsApp delivery stats, campaign performance
- **Activity Log** (`/reports/activity`): `client/src/pages/reports-activity.tsx` — User activity breakdown, module-wise stats, critical actions, failed logins
- **Vendor Reports** (`/reports/vendors`): `client/src/pages/reports-vendors.tsx` — Active vendors, bandwidth, wallet, payment transactions
- **API Endpoints**: 11 aggregation endpoints under `/api/reports/*` (dashboard, customer-stats, billing-stats, payment-stats, network-stats, inventory-stats, asset-stats, hrm-stats, notification-stats, activity-stats, vendor-stats)
- **Sidebar**: "All Reports" section with 13 items (Dashboard + 10 module reports + Revenue Analytics + Aging Report)

## Commands
- `npm run dev` - Start dev server (port 5000)
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run db:push` - Push schema to database
