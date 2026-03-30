# NetSphere - Enterprise ISP Billing & Management System

## Overview
NetSphere is a multi-tenant SaaS ISP Billing & Operations Management System designed for Internet Service Providers. It offers a comprehensive suite of 29+ modules, each with expandable submenus and tab-based sub-features, to manage billing, operations, customer relations, and network infrastructure. The system is built to be enterprise-grade, supporting various ISP operational needs from customer management to network monitoring and financial accounting.

## User Preferences
I prefer clear and concise explanations. When making changes, prioritize iterative development and ask for confirmation before implementing major architectural shifts.

## System Architecture

### UI/UX
The frontend is built with React 18, Vite, Tailwind CSS, shadcn/ui components, wouter for routing, TanStack React Query, Leaflet maps for GIS features, Recharts for data visualization, and Framer Motion for animations. Design principles emphasize an enterprise blue theme with consistent elevation utilities. Dynamic theming (dark/light) is supported. Many modules feature gradient-themed KPI cards and dark-header tables for a modern, professional aesthetic.

### Technical Implementations
- **Frontend**: Utilizes React hooks (`use-auth`, `use-tab`, `use-toast`, `use-mobile`, `use-permissions`) for state management and common functionalities.
- **Backend**: Developed with Express 5 and TypeScript (tsx). Drizzle ORM is used for database interactions, with `drizzle-kit` for schema management. Session-based authentication is implemented. `multer` handles file uploads.
- **Database**: PostgreSQL is the primary database, managed via Drizzle ORM.
- **Shared Components**: `shared/` directory houses common types and Zod validation schemas for data consistency between frontend and backend.
- **Core Modules**:
    - **Asset Management**: Comprehensive tracking of asset types, lists, transfers, assignments, allocation, and requests with detailed forms, analytics, and lifecycle tracking. Includes dedicated pages for Asset Tracking, Allocation, and Requests.
    - **Inventory & Product Management**: Master classification system for products, brand management, inventory list with real-time stock visibility across warehouses, batch and serial number tracking.
    - **Purchase Orders**: Full procurement workflow including creation, approval, receiving (GRN), and financial tracking.
    - **Customer Management**: Dedicated modules for general customers, CIR (Committed Information Rate), and Corporate customers, each with tailored management interfaces, mapping, and billing. Includes dynamic customer type management and customer rights configuration. Features a **Service Scheduler** tab in the customer profile for managing package upgrade/downgrade requests (current month or next month), new equipment requests, equipment replacement requests, and other service requests. Service requests are tracked with status workflow (pending → approved → in progress → completed/rejected) and priority levels.
    - **Reseller Management**: Full reseller lifecycle management with a dedicated profile page (`/resellers/:id`) modeled after the CIR Customer Profile. Features a dark sidebar with key metrics, two-row tabbed content area (Personal Information, Network & Service, Billing & Finance, Commission & Bank, Agreement & Settings, Vendor Panels, Wallet Transactions, Customer Summary, Complain History, SMS History, Referrals), and a multi-section edit dialog covering all reseller fields including vendor panel configuration.
    - **HR & Payroll**: Employee management, attendance with break tracking, holiday/leave management, advance/loan management with EMI calculation, detailed salary processing with partial payment and payslip generation, bonus and commission management (including auto-commissions), employee types/roles, and shift scheduling.
    - **Accounting & Finance**: General ledger with hierarchical account types, income/expense entry, transaction management with various collection types (customer, recovery officer, CIR, corporate, reseller), refund/credit management, internal fund transfers, and a robust approval workflow system. Budget allocation is also supported.
    - **Network Operations**: IPAM (IP Address Management) with IP pool, subnet, VLAN management, and conflict detection. MikroTik/BRAS integration for device management, RADIUS/AAA for authentication/accounting, and bandwidth usage monitoring. Includes FTTH/P2P mapping for physical network infrastructure visualization.
    - **Notifications & Communication**: Centralized notification type management, SMS/Email/WhatsApp API integration for multi-channel communication, bulk campaign management, push SMS console, and push notification system.
    - **Reporting & Analytics**: A dedicated reports module with a dashboard and specific reports for customers, billing, payments, network, inventory, assets, HR, notifications, activity logs, and vendors.
    - **System Administration**: General settings (company profile, localization, financial, operational, branding), activity logging, payment gateway settings with webhooks and settlements, invoice template designer, HRM rights setup, and staff user login/account management.

### Feature Specifications
- **Data Grids**: Extensive use of searchable, filterable, and sortable data grids with pagination and bulk actions.
- **Forms**: Multi-step and multi-section forms with Zod validation, auto-fill capabilities, and conditional logic.
- **Analytics**: Numerous KPI cards, pie charts, bar charts, line charts, and area charts for data visualization and trend analysis across all modules.
- **Workflow Automation**: Features like auto-provisioning, auto-adjustment of receivables, automated notifications, and multi-level approval processes.
- **Security**: Role-based access control, session-based authentication, password policies, login activity logging, and audit trails for critical operations.
- **Mapping**: Interactive Leaflet maps for customer locations, network devices, and fiber infrastructure.

## External Dependencies
- **Frontend**: React 18, Vite, Tailwind CSS, shadcn/ui, wouter, TanStack React Query, Leaflet (maps), Recharts (charts), Framer Motion.
- **Backend**: Express 5, TypeScript (tsx), Drizzle ORM, express-session, multer.
- **Database**: PostgreSQL.