# ENTERPRISE MANUFACTURING INDENT & COSTING MANAGEMENT SYSTEM (IMCMS)
## Enterprise Backend Domain Schema & Two-Loop Architecture Specification

**Project:** Enterprise Manufacturing Indent & Costing Management System (IMCMS)  
**Document Type:** Backend Domain Schema & Module Boundaries Specification  
**Version:** 2.0 (Approved 2-Loop Zero-Approval Architecture)  
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

Authentication & Security Layer
│
├── JWT Authentication
├── Refresh Token Rotation
├── Granular Field & Stage RBAC
├── Session Management
└── Executive Security & Audit Dashboard

────────────────────────────────────────────────────────────

Business Layer (Two-Loop Business Architecture)

├── Core Master Modules
│   ├── Users Module
│   ├── Departments Module
│   ├── Roles & Permissions Module
│   ├── Product Module
│   ├── Material Module
│   ├── Vendor Module
│   └── Manufacturing Process Module
│
├── Loop 1: Manufacturing Modules
│   ├── Indent Sheet Module (Design)
│   ├── Process Cost Sheet Module (Design Planned Costs)
│   ├── Stores Module (Material Verification & Issue)
│   └── Production Module (Manufacturing & Customer Delivery)
│
├── Loop 2: Financial & Archival Modules
│   ├── Accounts Module (Actual Cost Entry & Financial Closure)
│   └── System Archival Module (Record Archival & Final Report)
│
└── Cross-Cutting Services
    ├── Workflow State Machine Module
    ├── Executive Notification Module (SM & GM Routing)
    ├── Audit Log Module
    ├── Report Module
    └── Analytics Module

────────────────────────────────────────────────────────────

Prisma ORM Layer
       │
       ▼
Neon PostgreSQL Database
```

---

# 2. Business Workflow Sequence (Two-Loop Architecture)

```
LOOP 1: MANUFACTURING WORKFLOW
Design (Indent & Process Cost Sheet) ──► Stores (Material Issue) ──► Production (Manufacturing) ──► Customer Delivered
                                                                                                        │
                                                                                                        ▼
LOOP 2: FINANCIAL WORKFLOW & ARCHIVAL
Process Completed ◄── System (Archive & Final Report) ◄── Accounts (Cost Verification & Financial Closure)
```

---

# 3. Module Responsibilities & Domain Ownership

| Module | Core Responsibilities | Owned Database Tables / Prisma Models | Key Domain Relationships |
| --- | --- | --- | --- |
| **Authentication** | Login, Logout, JWT tokens, Refresh token rotation | `users`, `refresh_tokens`, `user_sessions` | Users |
| **Authorization** | Roles, Permissions, Permission mappings, Guards | `roles`, `permissions`, `role_permissions` | Users, Modules |
| **Users** | User CRUD, Department & Role assignment | `users` | `departments`, `roles`, `audit_logs` |
| **Product** | Product Master, Engineering Drawings, Revisions | `products` | `manufacturing_processes`, `materials` |
| **Material** | Material Master, Unit of Measure | `materials`, `units` | `products`, `indent_items`, `vendors` |
| **Vendor** | Vendor Master, GST & Address Details | `vendors` | `materials`, `process_costs` |
| **Manufacturing** | Manufacturing Process Master, Default Process Templates | `manufacturing_processes` | `products`, `process_costs` |
| **Indent Sheet** | Draft Indents, Product/Material/Quantity specifications, Drawings | `indents`, `indent_items`, `indent_attachments` | `process_cost_sheets`, `workflow_history` |
| **Process Cost Sheet**| Planned Cost per Process, Actual Cost Entry, Cost Variance calculation | `cost_sheets`, `cost_items`, `process_costs` | `indents`, `products`, `vendors` |
| **Workflow** | Workflow State Machine Transitions, State Validation, History | `workflow_history`, `workflow_stages` | `indents`, `users` |
| **Stores Fulfillment** | Stock Verification, Material Issue & Dispatch to Production | `inventory_transactions`, `material_issues` | `indents`, `materials` |
| **Production** | Raw Material Receipt, Status Updates, Customer Delivery Confirmation | `production_records`, `additional_material_requests` | `indents`, `materials` |
| **Accounts** | In-House & Vendor Cost Entry, Actual Cost Verification, Financial Closure | `cost_sheets`, `financial_records` | `indents`, `vendors` |
| **Notification** | In-App Notifications, SMTP Email Delivery, Executive SM & GM Broadcasts | `notifications`, `notification_recipients` | `users`, `workflow_history` |
| **Audit & Archive** | System Audit Trail, Automated Archival & Final Reporting | `audit_logs`, `archived_transactions` | System-wide |

---

# 4. Workflow State Machine

```
[DRAFT]
   │
   ▼
[DESIGN_COMPLETED] ──────► Stores Notification
   │
   ▼
[STORES_PROCESSING] ─────► Production Notification
   │
   ▼
[PRODUCTION_PROCESSING] ──► Accounts Notification
   │
   ▼
[CUSTOMER_DELIVERED] (Loop 1 Closed)
   │
   ▼
[ACCOUNTS_COST_VERIFICATION]
   │
   ▼
[ACCOUNTS_FINANCIAL_CLOSURE] (Loop 2 Financial Closure)
   │
   ▼
[ARCHIVED]
   │
   ▼
[COMPLETED] (Business Transaction Closed)
```

---

# 5. Executive Notification Routing Matrix

| Trigger Event | Direct Department Action | Executive Notification (SM & GM) |
| --- | --- | --- |
| **Design Submits Document** | Stores Department receives task | SM & GM receive real-time notification |
| **Stores Issues Raw Material** | Production Department receives material | SM & GM receive real-time notification |
| **Production Completes & Delivers** | Accounts Department receives task | SM & GM receive real-time notification |
| **Accounts Finalizes Costs** | System triggers Automated Archival | SM & GM receive real-time notification |
| **System Archives Transaction** | Business Transaction Closed | SM & GM receive final completion alert |

---

# 6. Department Business Rules & Ownership Boundaries

### Design Department
- **Owns:** Indent Sheet creation, Process Cost Sheet creation (planned cost per manufacturing process).
- **Can:** Edit Drafts, Upload Attachments, Define Manufacturing Processes (Turning, Heat Treatment, Grinding, etc.), Select Vendor/In-House.
- **Cannot:** Modify Stores issue quantities or Accounts actual cost values.

### Stores Department
- **Owns:** Material fulfillment and raw material dispatch.
- **Can:** Verify Stock, Issue Raw Materials, Dispatch to Production Work Center.
- **Cannot:** Edit engineering specifications or actual vendor financial costs.

### Production Department
- **Owns:** Product manufacturing execution and customer delivery.
- **Can:** Receive Raw Materials, Update Production Status, Confirm Customer Delivery.
- **Cannot:** Alter process planned costs or material requirements.

### Accounts Department
- **Owns:** Financial Verification and Closure.
- **Can:** Collect Vendor Bills, Enter Actual Cost per process, Calculate Cost Variance, Finalize Financial Record.
- **Cannot:** Alter product drawings or raw material specifications.

### Senior Manager & General Manager (Executive Roles)
- **Owns:** Passive Executive Monitoring & Oversight.
- **Can:** View complete live workflow status, inspect cost variances, read full audit history.
- **Rule:** Do NOT perform approvals or rejections; notified at every stage transition.

---

# 7. AI Development Rules & Technical Constraints

1. **NestJS Modular Architecture:** Each module owns its controllers, services, DTOs, and Prisma queries.
2. **Controller Responsibility:** Controllers handle HTTP routing, request DTO validation, and response formatting ONLY. All business logic belongs in services.
3. **Prisma ORM:** Use Prisma ORM exclusively for database queries. No raw SQL strings.
4. **Transactions:** Wrap multi-step operations (`Submit Indent Sheet`, `Material Issue`, `Customer Delivery`, `Financial Closure`) in Prisma transactions (`$transaction`).
5. **UUID Primary Keys:** Use UUID v4 for all database primary keys (`@id @default(uuid())`).
6. **Soft Deletes:** Implement soft deletes (`deletedAt`) for all business entities. Never hard-delete records.
7. **Audit Logging:** Every Create, Update, Status Change, Issue, Delivery, Cost Entry, and Archival action MUST generate an audit log entry.
8. **Notification Triggers:** State machine transitions MUST trigger `NotificationService` events for Senior Managers & General Managers.
9. **Zero Approval Engine:** Do NOT implement approval tables, approval queues, or rejection routes. State machine advances linearly based on department actions.
