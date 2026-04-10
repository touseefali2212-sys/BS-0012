# NetSphere - Enterprise ISP Billing & Management System

## Overview
NetSphere is a multi-tenant SaaS ISP Billing & Operations Management System designed for Internet Service Providers. It provides a comprehensive suite of modules for billing, operations, customer relations, and network infrastructure management. The system supports various ISP operational needs, from customer management to network monitoring and financial accounting, aiming to be an enterprise-grade solution for the ISP industry.

## User Preferences
I prefer clear and concise explanations. When making changes, prioritize iterative development and ask for confirmation before implementing major architectural shifts.

## System Architecture

### UI/UX
The frontend is built with React 18, Vite, Tailwind CSS, shadcn/ui components, wouter for routing, TanStack React Query, Leaflet maps for GIS features, Recharts for data visualization, and Framer Motion for animations. The design adheres to an enterprise blue theme with consistent elevation utilities and supports dynamic theming (dark/light). Many modules feature gradient-themed KPI cards and dark-header tables.

### Technical Implementations
- **Frontend**: Utilizes React hooks for state management and common functionalities.
- **Backend**: Developed with Express 5 and TypeScript (tsx). Drizzle ORM handles database interactions, with `drizzle-kit` for schema management. Session-based authentication is implemented, and `multer` manages file uploads.
- **Database**: PostgreSQL is the primary database, managed via Drizzle ORM.
- **Shared Components**: Common types and Zod validation schemas are shared between frontend and backend for data consistency.
- **Edit Profile Flow**: Customer "Edit Profile" functionalities re-use the "Add Customer" page in edit mode, pre-filling forms and using PATCH requests for updates, ensuring consistency between add and edit experiences.
- **ONT/ONU Integration with OLT**: Customer profiles include an "ONT/ONU Integration with OLT" section displaying linked ONU/ONT devices with full chain information (ONU → Splitter → OLT). It supports assigning, unlinking, and viewing device details.
- **OLT Management Module**: Provides dedicated pages for listing and managing OLTs, featuring KPI cards, searchable tables, and a 9-tab management interface for OLT overview, SNMP monitoring, PON ports, ONU/ONT devices, uplinks/interfaces, traffic, alarms, configuration, and logs. Includes simulated live metrics and integrates with OLT/ONU/Splitter APIs.
- **Core Modules**:
    - **Asset Management**: Tracks asset types, lists, transfers, assignments, allocation, and requests.
    - **Inventory & Product Management**: Manages product classification, brands, inventory lists, batch, and serial numbers across warehouses.
    - **Purchase Orders**: Covers the full procurement workflow from creation to financial tracking.
    - **Customer Management**: Dedicated modules for general, CIR, and Corporate customers with tailored interfaces, mapping, and billing. Features extensive profile views (14 tabs), bulk actions, and multi-channel notification capabilities.
    - **Package Change & Bandwidth Management**: A workflow page with 7 tabs for managing package change requests across all customer types, including billing previews and audit trails.
    - **Service Scheduler Management**: Centralized service scheduling page with 7 workflow tabs for various service types, customer search, and assignment capabilities.
    - **Reseller Management**: Comprehensive management of reseller lifecycle, including types/roles, list management, wallet/transactions, and commission reporting. Features a multi-tab wizard for adding and editing resellers.
    - **Company Profile**: Company setup module with tabbed interface (Company Profile + Branches & Departments). Profile tab manages company identity, contact details, logo upload, localization (country, currency, timezone, language), client code settings, and login display options. Branches tab provides full CRUD for company branches with auto-generated branch codes and delete confirmation. Backend and frontend validation for required fields, email, URL, and tax rate.
    - **Vendor Management**: Manages vendor types, adds vendors (bandwidth and panel), vendor packages, wallet/billing, accounts/ledgers, and bandwidth changes. Includes a comparison tool and financial tracking.
    - **Packages Module**: Manages package lists, tax and extra fees with a live preview calculator, and reseller package commissions.
    - **HR & Payroll**: Covers employee management, attendance, leave, advance/loan, salary processing, bonuses, commissions, and shift scheduling.
    - **Accounting & Finance**: Manages general ledger, income/expense, transactions, refunds, fund transfers, budget allocation, and approval workflows.
    - **Network Operations**: Includes IPAM (IP Address Management) with IP pool, subnet, VLAN management, conflict detection, MikroTik/BRAS integration, RADIUS/AAA, bandwidth monitoring, and FTTH/P2P mapping. Features auto-sync between CIR/Corporate customers and IPAM, and live ping monitoring.
    - **NOC Dashboard**: Advanced Network Operations Center dashboard with a dark theme, featuring KPI summaries, a 6-tab layout (Overview, Alerts, Health, Traffic, Fault Detection, SLA), auto-refresh, smart fault detection logic (fiber cut localization, root cause analysis), and load balancing suggestions.
    - **Notifications & Communication**: Centralized management of notification types, SMS/Email/WhatsApp API integration, bulk campaigns, and push notifications.
    - **Reporting & Analytics**: A dedicated module with a dashboard and specific reports for various business areas.
    - **System Administration**: Manages general settings, activity logging, payment gateway configurations, invoice templates, HRM rights, and staff user accounts.

### Feature Specifications
- **Data Grids**: Extensive use of searchable, filterable, sortable data grids with pagination and bulk actions.
- **Forms**: Multi-step and multi-section forms with Zod validation, auto-fill, and conditional logic.
- **Analytics**: Numerous KPI cards, charts (pie, bar, line, area) for data visualization and trend analysis.
- **Workflow Automation**: Includes auto-provisioning, automated adjustments, notifications, and multi-level approval processes.
- **Security**: Role-based access control, session-based authentication, password policies, login activity logging, and audit trails.
- **Mapping**: Interactive Leaflet maps for customer locations, network devices, and fiber infrastructure.

## External Dependencies
- **Frontend**: React 18, Vite, Tailwind CSS, shadcn/ui, wouter, TanStack React Query, Leaflet, Recharts, Framer Motion.
- **Backend**: Express 5, TypeScript (tsx), Drizzle ORM, express-session, multer.
- **Database**: PostgreSQL.