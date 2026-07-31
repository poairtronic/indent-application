# TECHNICAL REQUIREMENTS DOCUMENT (TRD)

# Phase 1 – Technical Overview & Solution Architecture

**Project Name:** Enterprise Manufacturing Indent & Costing Management System (IMCMS)  
**Document Type:** Technical Requirements Document (TRD)  
**Phase:** 1 – Technical Overview & Solution Architecture  
**Version:** 1.0  
**Status:** Approved  
**Architecture Style:** Enterprise Modular Monolith  
**Technology Stack:** React + NestJS + Neon PostgreSQL  

---

# 1. Document Purpose

## 1.1 Objective

This Technical Requirements Document (TRD) defines the technical implementation strategy for the Enterprise Manufacturing Indent & Costing Management System (IMCMS).

The purpose of this document is to provide a standardized technical blueprint for developers, architects, QA engineers, DevOps engineers, and future development teams.

Unlike the Product Requirements Document (PRD), which defines business requirements, this TRD defines how those requirements will be implemented technically.

---

# 2. Project Overview

- **Project Name:** Enterprise Manufacturing Indent & Costing Management System (IMCMS)
- **Project Type:** Enterprise Manufacturing ERP Module
- **System Category:** Web-based Enterprise Application
- **Deployment Model:** Cloud Hosted
- **Target Users:** Design Department, Stores Department, Accounts Department, Senior Manager, General Manager, Production Department, System Administrator

---

# 3. Technical Vision

Develop a secure, scalable, maintainable, modular enterprise application capable of digitizing the complete manufacturing indent, costing, approval, inventory coordination, and production workflow.

The architecture shall support:
- Enterprise scalability
- Modular development
- Role-based security
- Future ERP expansion
- High performance
- Auditability
- Cloud deployment
- API-first architecture

---

# 4. Technical Objectives

The system shall achieve the following technical objectives:

### Security
- JWT Authentication
- Refresh Token Rotation
- Password Encryption (bcrypt)
- Role-Based Access Control (RBAC)
- Permission-based APIs

### Scalability
Support future departments, manufacturing plants, products, vendors, users, and ERP modules.

### Maintainability
- Modular architecture
- Clean code & SOLID principles
- Reusable components & Separation of concerns

### Performance
- Fast API response (< 2 seconds)
- Optimized database queries
- Efficient frontend rendering & Lazy loading
- Pagination for list APIs

### Reliability
- ACID Transaction support
- Audit logging & Exception handling
- Recovery mechanisms

---

# 5. Business Context

The application replaces the current manual workflow involving Paper Indents, Excel Cost Sheets, Manual Approvals, and Email Communication. The digital system becomes the central platform for engineering documentation and approval workflows.

---

# 6. Technical Scope

- **Authentication Domain:** Login, Logout, Password Reset, JWT, Refresh Tokens
- **Authorization Domain:** Roles, Permissions, RBAC, Guards
- **Master Data Domain:** Users, Departments, Materials, Products, Vendors, Manufacturing Processes, Units
- **Business Domain:** Indents, Cost Sheets, Workflow, Approvals, Production, Inventory
- **Enterprise Domain:** Reports, Analytics, Notifications, Audit Logs, Settings

---

# 7. Architecture Principles

- **Principle 1: Single Source of Truth** - Neon PostgreSQL stores all business, system, workflow, and document data.
- **Principle 2: Modular Design** - Each business capability is implemented as an independent module (Auth, Users, Roles, Materials, Products, Indent, Workflow, Production).
- **Principle 3: Separation of Concerns** - `Frontend` → `REST API` → `Business Logic` → `Database`.
- **Principle 4: Loose Coupling** - Modules communicate through services and interfaces rather than direct internal dependencies.
- **Principle 5: High Cohesion** - Each module contains only its own controllers, services, DTOs, Prisma logic, and validation.

---

# 8. Architecture Style

**Enterprise Modular Monolith Architecture**

### Advantages
- Easier deployment & debugging
- Faster development & lower infrastructure cost
- Easier testing while supporting future microservice migration

---

# 9. High-Level Solution Architecture

```
                        Users
                          │
                          ▼
                 React + TypeScript
                     (Frontend)
                          │
                 HTTPS / REST API
                          │
                          ▼
                  NestJS Backend
                          │
      ┌───────────────────┼────────────────────┐
      │                   │                    │
      ▼                   ▼                    ▼
 Authentication      Business Modules     Notifications
      │                   │                    │
      └───────────────────┼────────────────────┘
                          ▼
                  Prisma ORM Layer
                          │
                          ▼
                 Neon PostgreSQL
                          │
      ┌───────────────────┼────────────────────┐
      │                   │                    │
 Master Data        Business Data      File Storage
```

---

# 10. Logical Architecture

Five logical layers:
1. **Presentation Layer:** React, TypeScript, Tailwind CSS
2. **Application Layer:** NestJS Controllers (API Endpoints, DTO Validation)
3. **Business Layer:** NestJS Services (Business Logic, Workflow Engine, Approval Engine)
4. **Persistence Layer:** Prisma ORM (Queries, Transactions, Mappings)
5. **Database Layer:** Neon PostgreSQL (Data Storage, Document Attachments, Audit Logs)

---

# 11. Technology Stack

| Category | Technology | Purpose |
| --- | --- | --- |
| Frontend | React, TypeScript, Vite, Tailwind CSS, React Router, React Hook Form, Zod, Zustand, TanStack Query, Axios | SPA Frontend |
| Backend | NestJS, TypeScript, Prisma ORM, JWT, bcrypt, class-validator, class-transformer | REST API Backend |
| Database | Neon PostgreSQL | Primary Database & Document Storage |
| Deployment | Render | Web Services & Static Sites |

---

# 12. Storage Strategy

Neon PostgreSQL serves as the centralized storage platform for:
- Master Data (Users, Roles, Permissions, Departments, Products, Materials, Vendors, Units)
- Business Data (Indents, Cost Sheets, Workflow History, Approval History, Production Records)
- System Data (Notifications, Audit Logs, Email Logs, Reports, Settings)
- Engineering Documents (PDF, Excel, Images, CAD Drawings via PostgreSQL `BYTEA` with metadata)

---

# Phase 2 – Infrastructure, Development Environment & DevOps Specification

**Project Name:** Enterprise Manufacturing Indent & Costing Management System (IMCMS)  
**Phase:** 2 – Infrastructure & Development Environment  
**Version:** 1.0  
**Status:** Approved  

---

# 1. Purpose

Define the infrastructure, development environment, repository standards, deployment strategy, configuration management, and DevOps practices for the IMCMS system.

---

# 2. Infrastructure Architecture

```
                    Internet
                        │
                        ▼
                 Render Platform
              ┌─────────┴─────────┐
              │                   │
              ▼                   ▼
      Frontend Service     Backend Service
          (React)             (NestJS)
              │                   │
              └─────────┬─────────┘
                        ▼
                Neon PostgreSQL
```

---

# 3. Repository Structure

Mono-repository structure:

```
indent-application/
├── frontend/
├── backend/
├── database/
├── docs/
├── scripts/
├── README.md
└── .gitignore
```

---

# 4. Environment Variables

Separate `.env` files maintained per environment:
- **Backend:** `DATABASE_URL`, `JWT_SECRET`, `JWT_REFRESH_SECRET`, `JWT_EXPIRES_IN`, `JWT_REFRESH_EXPIRES_IN`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `PORT`, `NODE_ENV`
- **Frontend:** `VITE_API_URL`, `VITE_APP_NAME`

---

# 5. Git & CI/CD Pipeline

- Branching: `main`, `develop`, `feature/*`, `bugfix/*`, `hotfix/*`
- Conventional Commits: `feat(auth): ...`, `fix(workflow): ...`, `refactor(indents): ...`
- CI/CD: Push to GitHub → Automated Render Build → Frontend & Backend Deployment → Health Check

---

# Phase 3 – Database Architecture & Storage Design Specification

**Project Name:** Enterprise Manufacturing Indent & Costing Management System (IMCMS)  
**Phase:** 3 – Database Architecture & Storage Design  
**Version:** 1.0  
**Database:** Neon PostgreSQL  
**ORM:** Prisma ORM  
**Status:** Approved  

---

# 1. Design Principles

- **Normalization:** Third Normal Form (3NF) to eliminate redundant data while preserving ACID-compliant referential integrity.
- **Auditability:** Soft Delete (`deletedAt`) is mandatory on all business records. Every table contains `createdAt`, `updatedAt`, `deletedAt`, `createdBy`, `updatedBy`.
- **Indexing:** Primary keys (UUID), unique indexes (`email`, `employeeCode`, `productCode`, `materialCode`, `indentNumber`), search indexes (`status`, `departmentId`, `workflowStage`).

---

# 2. Database Schema Categories

1. **Master Data:** `Users`, `Roles`, `Permissions`, `Departments`, `Products`, `Materials`, `Vendors`, `ManufacturingProcesses`, `Units`
2. **Business Data:** `Indents`, `IndentItems`, `IndentProcesses`, `CostSheets`, `CostItems`, `ProcessCosts`
3. **Workflow Data:** `WorkflowHistory`, `WorkflowStages`, `ApprovalHistory`
4. **Production Data:** `ProductionReceipts`, `AdditionalMaterialRequests`, `AdditionalMaterialItems`
5. **System Data:** `Notifications`, `NotificationRecipients`, `EmailLogs`, `UserSessions`, `RefreshTokens`, `PasswordResetTokens`
6. **Audit Data:** `AuditLogs`, `ActivityLogs`
7. **Application Data:** `DashboardPreferences`, `Reports`, `ReportDownloads`, `ApplicationSettings`

---

# Phase 4 – Backend Architecture & Service Layer Design

**Project Name:** Enterprise Manufacturing Indent & Costing Management System (IMCMS)  
**Phase:** 4 – Backend Architecture & Service Layer Design  
**Version:** 1.0  
**Backend Framework:** NestJS  
**ORM:** Prisma ORM  
**Status:** Approved  

---

# 1. Request Lifecycle

```
HTTP Request
  ↓
Middleware
  ↓
Guards (JWT & RBAC Permissions)
  ↓
Interceptors (Before)
  ↓
Validation Pipe (class-validator DTOs)
  ↓
Controller (Request/Response mapping only - no business logic)
  ↓
Service (Business Logic, Workflow Rules, Transactions)
  ↓
Prisma ORM (Prepared Database Queries)
  ↓
Neon PostgreSQL
  ↓
Interceptor (Response formatting)
  ↓
HTTP Response
```

---

# 2. Key Backend Rules

- **Controllers:** Handle HTTP routes, request parameters, and response DTO formatting only. No direct database calls or business calculations in controllers.
- **Services:** Encapsulate all business logic, workflow transitions, cost calculations, and Prisma transactions.
- **Global Exception Filter:** Intercepts all unhandled errors and returns standardized JSON responses:
```json
{
  "success": false,
  "statusCode": 400,
  "message": "Validation failed",
  "errors": []
}
```
- **Transaction Safety:** Multi-step operations (`Create Indent`, `Submit Workflow`, `Approve`, `Material Receipt`) execute inside Prisma `$transaction` blocks to prevent partial state updates.
