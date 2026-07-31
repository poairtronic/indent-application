# ENTERPRISE MANUFACTURING INDENT & COSTING MANAGEMENT SYSTEM (IMCMS)
## Enterprise Backend Domain Schema & Architecture Specification

**Project:** Enterprise Manufacturing Indent & Costing Management System (IMCMS)  
**Document Type:** Backend Domain Schema & Module Boundaries Specification  
**Version:** 1.0  
**Status:** Approved  

---

# 1. Backend Architecture

```
React (Frontend)
       │
REST API (HTTPS)
       │
       ▼
────────────────────────────────────────────────────────────
                       NestJS Backend
────────────────────────────────────────────────────────────

Authentication Layer
│
├── JWT Authentication
├── Refresh Token
├── RBAC (Role-Based Access Control)
├── Session Management
├── Login History
└── Security Dashboard

────────────────────────────────────────────────────────────

Business Layer

├── Users Module
├── Departments Module
├── Roles Module
├── Permissions Module
│
├── Material Module
├── Product Module
├── Vendor Module
├── Manufacturing Module
│
├── Indent Module
├── Cost Sheet Module
├── Workflow Module
├── Production Module
├── Inventory Module
│
├── Notification Module
├── Audit Module
├── Report Module
├── Analytics Module
└── Settings Module

────────────────────────────────────────────────────────────

Prisma ORM Layer
       │
       ▼
Neon PostgreSQL Database
```

---

# 2. Business Workflow Sequence

```
Design Department ──► Create Indent ──► Create Cost Sheet ──► Submit
                                                                │
                                                                ▼
Workflow Closed ◄── Production Complete ◄── Material Receipt ◄── GM Approval ◄── SM Review ◄── Accounts Verification ◄── Stores Verification
```

---

# 3. Module Responsibilities & Domain Ownership

| Module | Core Responsibilities | Owned Database Tables / Prisma Models | Key Domain Relationships |
| --- | --- | --- | --- |
| **Authentication** | Login, Logout, JWT tokens, Refresh token rotation, Password reset, Change password | `users`, `refresh_tokens`, `password_reset_tokens`, `user_sessions` | Users |
| **Authorization** | Roles, Permissions, Permission mappings, Guards (`JwtAuthGuard`, `RolesGuard`, `PermissionsGuard`) | `roles`, `permissions`, `role_permissions` | Users, Modules |
| **Users** | User CRUD, Profile management, Department & Role assignment, Account status | `users` | `departments`, `roles`, `audit_logs`, `notifications` |
| **Department** | Department CRUD, Department-specific configuration | `departments` | `users` |
| **Product** | Product Master, Engineering Drawings, Revisions, Process Mapping | `products` | `manufacturing_processes`, `materials`, `cost_sheets` |
| **Material** | Material Master, Unit of Measure, Categories | `materials`, `units` | `products`, `indent_items`, `vendors` |
| **Vendor** | Vendor Master, GST Registration details, Address, Contact Info | `vendors` | `materials`, `cost_items` |
| **Manufacturing** | Manufacturing Process Master, Estimated Time, Estimated Base Cost | `manufacturing_processes` | `products`, `process_costs` |
| **Indent** | Draft Indents, Update Draft, Submit, Soft Delete, Attachment Attach/Detach | `indents`, `indent_items`, `indent_attachments` | `cost_sheets`, `workflow_history`, `users` |
| **Cost Sheet** | Estimated Material Cost, Estimated Process Cost, Actual Cost Entry, Variance Calculation | `cost_sheets`, `cost_items`, `process_costs` | `indents`, `products` |
| **Workflow** | Approval Engine, Workflow State Machine, Comments, Approval Timeline | `workflow_history`, `approval_history`, `workflow_stages` | `indents`, `users` |
| **Production** | Material Receipt Confirmation, Production Confirmation, Additional Material Requests | `production_receipts`, `additional_material_requests`, `additional_material_items` | `indents`, `materials` |
| **Inventory** | Material Availability Verification, Stock Reservation, Inventory Transactions | `inventory_transactions` | `materials`, `indents` |
| **Notification** | In-App Notifications, SMTP Email Delivery, Notification Preferences | `notifications`, `notification_recipients`, `email_logs` | `users`, `workflow_history` |
| **Report** | Report Generation (PDF/Excel), History, Downloads | `reports`, `report_downloads` | `users` |
| **Analytics** | Dashboard Analytics APIs, KPIs, Aggregations, Trend Analysis | *None (Reads only)* | Reads `indents`, `workflow`, `production`, `cost_sheets` |
| **Audit** | System Audit Trail, User Activity Logging | `audit_logs`, `activity_logs` | `users` |
| **Settings** | System Configuration, SMTP Host Config, SLA Rules, Company Info | `application_settings` | System-wide |

---

# 4. Entity Relationship Overview

```
Department ──► Users ──► Roles ──► Permissions ──► Create ──► Indent ──► Indent Items ──► Cost Sheet ──► Workflow ──► Production ──► Reports
```

---

# 5. Workflow State Machine

```
[DRAFT]
   │
   ▼
[SUBMITTED]
   │
   ▼
[STORES_PENDING] ──► Stores Approval ──► [STORES_APPROVED]
   │                                         │
   ▼                                         ▼
[ACCOUNTS_PENDING] ──► Accounts Approval ──► [ACCOUNTS_APPROVED]
   │                                             │
   ▼                                             ▼
[SENIOR_MANAGER_PENDING] ──► SM Approval ──► [SENIOR_MANAGER_APPROVED]
   │                                                    │
   ▼                                                    ▼
[GENERAL_MANAGER_PENDING] ──► GM Approval ──► [GENERAL_MANAGER_APPROVED]
   │                                                    │
   ▼                                                    ▼
[PRODUCTION_PENDING] ──► Material Receipt ──► [MATERIAL_RECEIVED]
                                                    │
                                                    ▼
                                           [PRODUCTION_COMPLETED]
                                                    │
                                                    ▼
                                                [CLOSED]
```
> **Rejection Rule:** A rejection from any stage returns the document to `DRAFT` status while preserving complete audit history and comments.

---

# 6. Notification Event Matrix

| Trigger Event | Recipients Notified |
| --- | --- |
| **Indent Submit** | Stores Department |
| **Stores Approved** | Accounts Department |
| **Accounts Approved** | Senior Manager |
| **Senior Manager Approved** | General Manager |
| **GM Approved** | Production Department |
| **Material Received** | Accounts, Senior Manager, General Manager |
| **Additional Material Request** | Stores Department, Accounts Department |
| **Workflow Closed** | Design, Accounts, Senior Manager, General Manager |

---

# 7. Department Business Rules & Boundaries

### Design Department
- **Can:** Create Indent, Edit Drafts, Upload Attachments, Enter Estimated Costs.
- **Cannot:** Approve Workflow transitions, Modify Actual Financial Costs.

### Stores Department
- **Can:** Verify Material Availability, Approve/Reject Material Status.
- **Cannot:** Modify Financial Costing or Engineering Specifications.

### Accounts Department
- **Can:** Update Actual Costs, Calculate Cost Variance, Approve Financials.
- **Cannot:** Modify Engineering Drawings or Product Process Specs.

### Senior Manager & General Manager
- **Can:** Review complete history, Approve, Reject with comments.
- **Cannot:** Alter material specifications or unit costs directly.

### Production Department
- **Can:** Receive Materials, Confirm Material Receipt, Request Additional Materials, Close Production.
- **Cannot:** Bypass approval sequence.

---

# 8. Security Architecture (Phase 8C Implemented)

- **Authentication:** JWT with Refresh Token Rotation & bcrypt password hashing.
- **Authorization:** Granular RBAC (`@Permissions(...)` guards).
- **Session Security:** Active session tracking, IP/Device logging, Login audit history, Account Lock after failed attempts, Force Logout capability.

---

# 9. AI Development Rules & Technical Constraints

All AI assistants and developers MUST strictly follow these implementation rules:

1. **NestJS Modular Architecture:** Each module owns its controllers, services, DTOs, and Prisma queries.
2. **Controller Responsibility:** Controllers handle HTTP routing, request DTO validation, and response formatting ONLY. All business logic belongs in services.
3. **Prisma ORM:** Use Prisma ORM exclusively for database queries. No raw SQL strings.
4. **Transactions:** Wrap multi-step operations (`Submit Indent`, `Approve`, `Material Receipt`, `Additional Material Request`) in Prisma transactions (`$transaction`).
5. **UUID Primary Keys:** Use UUID v4 for all database primary keys (`@id @default(uuid())`).
6. **Soft Deletes:** Implement soft deletes (`deletedAt`) for all business entities. Never hard-delete records.
7. **Audit Logging:** Every Create, Update, Approve, Reject, Upload, Download, and Auth action MUST generate an audit log entry.
8. **Guards & DTO Validation:** Protect APIs with `JwtAuthGuard`, `RolesGuard`, and `PermissionsGuard`. Validate payloads using `class-validator` DTOs.
9. **Standardized API Responses:**
```json
{
  "success": true,
  "message": "Operation completed successfully.",
  "data": {}
}
```
10. **State Machine Integrity:** Enforce strict workflow transitions. No module may bypass approval stages.
11. **Loose Coupling:** Modules communicate through public service interfaces—never direct cross-module database manipulation.
