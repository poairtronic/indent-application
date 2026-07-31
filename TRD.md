# TECHNICAL REQUIREMENTS DOCUMENT (TRD)

# Phase 1 – Technical Overview & Solution Architecture

**Project Name:** Enterprise Manufacturing Indent & Costing Management System (IMCMS)  
**Document Type:** Technical Requirements Document (TRD)  
**Phase:** 1 – Technical Overview & Solution Architecture  
**Version:** 2.0 (Approved 2-Loop Zero-Approval Architecture)  
**Status:** Approved  
**Architecture Style:** Enterprise Modular Monolith  
**Technology Stack:** React + NestJS + Neon PostgreSQL  

---

# 1. Document Purpose

## 1.1 Objective

This Technical Requirements Document (TRD) defines the technical implementation strategy for the Enterprise Manufacturing Indent & Costing Management System (IMCMS).

The purpose of this document is to provide a standardized technical blueprint for developers, architects, QA engineers, DevOps engineers, and future development teams.

Unlike the Product Requirements Document (PRD), which defines business requirements, this TRD defines how those requirements will be implemented technically across the **Two-Loop Business Workflow Architecture** and **Zero-Approval Notification Model**.

---

# 2. Project Overview

- **Project Name:** Enterprise Manufacturing Indent & Costing Management System (IMCMS)
- **Project Type:** Enterprise Manufacturing ERP Module
- **System Category:** Web-based Enterprise Application
- **Deployment Model:** Cloud Hosted
- **Target Users:** Design Department, Stores Department, Production Department, Accounts Department, Senior Manager (Executive), General Manager (Executive), System Administrator

---

# 3. Technical Vision

Develop a secure, scalable, maintainable, modular enterprise application capable of digitizing the complete manufacturing indent sheet, process costing, inventory fulfillment, work center execution, financial closure, and archival workflow.

The architecture shall support:
- Enterprise scalability
- Modular development
- Granular field and stage-level security (RBAC)
- Two-Loop business workflow execution
- High performance & low latency (< 2s response)
- Full auditability & zero-approval notification routing
- API-first architecture

---

# 4. Technical Objectives

### Security
- JWT Authentication & Refresh Token Rotation
- Password Encryption (bcrypt)
- Granular Role-Based Access Control (RBAC) & Stage-Based Route Guards

### Scalability
Support future departments, manufacturing work centers, products, vendors, users, and ERP modules.

### Maintainability
- Modular architecture (NestJS modules)
- Clean code & SOLID principles
- Reusable React components & CSS design system

### Performance
- Fast API response (< 2 seconds)
- Optimized database queries via Prisma ORM
- Pagination for list APIs

### Reliability
- ACID Transaction support (`$transaction`)
- Complete audit logging & automated exception handling
- Automated archival of closed transactions

---

# 5. Business Context

The application replaces paper indents, Excel cost sheets, manual signatures, and un-tracked email communications with a centralized digital platform operating on two interconnected business loops:
1. **Loop 1 (Manufacturing Workflow):** Design submission → Stores raw material fulfillment → Production manufacturing & customer delivery.
2. **Loop 2 (Financial Workflow):** Accounts actual cost verification & variance calculation → System archival & business closure.

Senior Managers and General Managers receive automated notifications and monitor progress passively via executive dashboards.

---

# 6. Technical Scope

- **Authentication Domain:** Login, Logout, Password Reset, JWT, Refresh Tokens
- **Authorization Domain:** Roles, Permissions, Granular RBAC, Stage Guards
- **Master Data Domain:** Users, Departments, Materials, Products, Vendors, Manufacturing Processes, Units
- **Business Domain:** Indent Sheets, Process Cost Sheets, 2-Loop Workflow Engine, Stores Fulfillment, Production Work Center, Accounts Financial Closure
- **Enterprise Domain:** Reports, Analytics, Executive Notification Engine, Audit Logs, Archival Subsystem

---

# 7. Logical Architecture

Five logical layers:
1. **Presentation Layer:** React, TypeScript, Tailwind CSS, Vite
2. **Application Layer:** NestJS Controllers (API Endpoints, DTO Validation)
3. **Business Layer:** NestJS Services (Business Logic, 2-Loop Workflow Engine, Notification Service)
4. **Persistence Layer:** Prisma ORM (Prepared Queries, ACID Transactions)
5. **Database Layer:** Neon PostgreSQL (Data Storage, Document Attachments, Audit Logs)

---

# 8. Technology Stack

| Category | Technology | Purpose |
| --- | --- | --- |
| Frontend | React, TypeScript, Vite, Tailwind CSS, React Router, React Hook Form, Zod, Zustand, TanStack Query, Axios | SPA Frontend |
| Backend | NestJS, TypeScript, Prisma ORM, JWT, bcrypt, class-validator, class-transformer | REST API Backend |
| Database | Neon PostgreSQL | Primary Database & Document Storage |
| Deployment | Render | Web Services & Static Sites |

---

# 9. Storage Strategy

Neon PostgreSQL serves as the centralized storage platform for:
- **Master Data:** Users, Roles, Permissions, Departments, Products, Materials, Vendors, Units, Manufacturing Processes
- **Business Data:** Indent Sheets, Process Cost Sheets, Process Costs, Inventory Issues, Production Records, Financial Records
- **Workflow Data:** `WorkflowHistory`, `WorkflowStages`
- **System Data:** Notifications, Notification Recipients, Audit Logs, Reports
- **Engineering Documents:** Drawings, PDFs, Excel, CAD files via PostgreSQL `BYTEA` with metadata

---

# 10. Database Schema Categories

1. **Master Data:** `Users`, `Roles`, `Permissions`, `Departments`, `Products`, `Materials`, `Vendors`, `ManufacturingProcesses`, `Units`
2. **Business Data:** `Indents`, `IndentItems`, `CostSheets`, `CostItems`, `ProcessCosts`
3. **Workflow Data:** `WorkflowHistory`, `WorkflowStages`
4. **Production Data:** `ProductionRecords`, `AdditionalMaterialRequests`, `AdditionalMaterialItems`
5. **System Data:** `Notifications`, `NotificationRecipients`, `EmailLogs`, `UserSessions`, `RefreshTokens`
6. **Audit & Archival Data:** `AuditLogs`, `ArchivedTransactions`
7. **Application Data:** `Reports`, `ReportDownloads`, `ApplicationSettings`

---

# 11. Backend Execution & Key Rules

- **Controllers:** Handle HTTP routes, request parameters, and response DTO formatting only. No direct database calls or business calculations in controllers.
- **Services:** Encapsulate all business logic, workflow state transitions, cost variance calculations, and Prisma transactions.
- **Global Exception Filter:** Intercepts all unhandled errors and returns standardized JSON responses:
```json
{
  "success": false,
  "statusCode": 400,
  "message": "Validation failed",
  "errors": []
}
```
- **Transaction Safety:** Multi-step operations (`Submit Business Transaction`, `Stores Material Issue`, `Customer Delivery`, `Financial Closure`) execute inside Prisma `$transaction` blocks to prevent partial state updates.
