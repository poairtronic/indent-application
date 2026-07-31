# PRODUCT REQUIREMENTS DOCUMENT (PRD)

# Phase 1 – Business Foundation

**Project Name:** Enterprise Manufacturing Indent & Costing Management System (IMCMS)  
**Version:** 2.0 (Approved 2-Loop Zero-Approval Architecture)  
**Document Owner:** Product & Solutions Architecture Team  
**Status:** Approved  

---

# 1. Executive Summary

## Overview

The Enterprise Manufacturing Indent & Costing Management System (IMCMS) is a web-based ERP application designed to digitize and manage the complete material indent, process costing, manufacturing execution, financial closure, and archival workflow within a manufacturing organization.

The application operates on a **Two-Loop Business Workflow Architecture**:
1. **Loop 1 (Manufacturing Workflow):** Raw Material Fulfillment → Manufacturing Execution → Customer Delivery.
2. **Loop 2 (Financial Workflow):** Actual Cost Verification → Cost Variance Analysis → Financial Closure → Automated Archival.

The system features a **Zero-Approval Architecture**. Senior Managers and General Managers do not perform manual approvals or rejections; instead, they receive real-time notifications at every stage transition and monitor operations via executive dashboards.

The proposed system centralizes the complete workflow into a single secure platform, enabling departments to collaborate efficiently while providing management with real-time visibility into manufacturing activities.

---

# 2. Business Background

The organization currently manages engineering indents and costing using manually maintained Excel sheets and printed forms.

Each department maintains its own records, resulting in:

- Duplicate data entry
- Lack of automated process workflow tracking
- Lack of real-time tracking
- Difficult report generation
- Poor document traceability
- Limited visibility across departments

As manufacturing operations continue to grow, the existing process becomes increasingly difficult to manage.

A centralized digital platform is required to improve operational efficiency, transparency, and decision-making.

---

# 3. Problem Statement

The current system suffers from several operational challenges:

### Manual Documentation

- Paper-based indent forms
- Excel-based costing sheets
- Manual calculations

### Process Tracking & Visibility Delays

- Documents move manually between departments
- No automated notification routing
- Difficulty in tracking real-time document status across departments

### Poor Visibility

- No live workflow tracking
- Difficult to know document status
- Limited management oversight

### Data Duplication

- Information entered multiple times
- Inconsistent records
- Increased human errors

### Limited Reporting

- Reports generated manually
- No real-time analytics
- No executive dashboard

### Lack of Auditability

- Difficult to determine who changed what
- No centralized activity history
- Limited accountability

---

# 4. Vision Statement

Develop a modern enterprise-grade Manufacturing Indent & Costing Management System that digitizes the complete engineering workflow, improves collaboration across departments, reduces manual effort, increases transparency, and provides management with real-time operational intelligence.

---

# 5. Product Vision

The application should become the central platform used by every department involved in manufacturing planning, costing, inventory coordination, production execution, financial actual cost verification, and archival.

The system should provide:

- Digital engineering documents (Indent Sheet & Process Cost Sheet)
- Automated Two-Loop Workflows
- Secure role-based access & stage permissions
- Complete audit history
- Real-time executive notifications
- Executive monitoring dashboards
- Enterprise reporting
- Scalable architecture for future ERP expansion

---

# 6. Business Objectives

## Primary Objectives

- Digitize paper-based engineering documents (Indent Sheets & Process Cost Sheets).
- Replace Excel costing sheets.
- Standardize 2-loop business workflows.
- Reduce document processing turnaround time.
- Improve collaboration between departments.
- Increase process transparency.
- Provide management dashboards and automated notification routing.
- Reduce manual errors.
- Improve cost accuracy with automated variance calculation.
- Enable future ERP expansion.

---

# 7. Success Metrics

The success of the application will be measured using the following Key Performance Indicators (KPIs):

### Operational KPIs

- Reduction in document processing turnaround time.
- Reduction in manual data entry.
- Reduction in workflow bottlenecks.
- Increase in workflow visibility.
- Reduction in document loss.

### Business KPIs

- Faster production readiness.
- Improved cost accuracy & variance control.
- Increased operational efficiency.
- Improved reporting speed.
- Improved department collaboration.

### Technical KPIs

- 99.9% application availability.
- Response time below 2 seconds for standard operations.
- Secure authentication and authorization.
- Complete audit logging.
- Scalable architecture.

---

# 8. Scope

## In Scope

The application will include:

### Authentication

- Login
- Logout
- Password Management
- JWT Authentication & Refresh Token Rotation

### User Management

- Users
- Roles
- Permissions
- Departments

### Master Data

- Products
- Materials
- Vendors
- Manufacturing Processes
- Units

### Business Modules

- Indent Sheet Management (Design)
- Process Cost Sheet Management (Planned & Actual Costs)
- 2-Loop Workflow Engine
- Executive Notification Engine (SM & GM Routing)
- Production Work Center
- Inventory & Stock Issue

### System Modules

- Notifications
- Reports
- Analytics
- Audit Logs
- Activity Logs
- Dashboard
- Settings

---

# 9. Out of Scope

The following features are not included in Version 1.0:

- Payroll Management
- Human Resources
- Purchase Order Generation
- Supplier Portal
- Mobile Applications
- Offline Mode
- AI Cost Prediction
- IoT Integration
- Machine Monitoring
- ERP Financial Accounting
- CRM
- Customer Portal

These may be considered for future releases.

---

# 10. Stakeholders

| Stakeholder | Responsibility |
| --- | --- |
| Admin | System administration & master data management |
| Design Department | Create Indent Sheets and Process Cost Sheets |
| Stores Department | Verify materials stock and issue raw materials |
| Accounts Department | Verify actual costs, calculate variance, and finalize financial records |
| Senior Manager | Passive executive monitoring & notification recipient |
| General Manager | Passive executive monitoring & plant oversight recipient |
| Production Department | Receive raw materials, execute manufacturing, and deliver to customer |
| IT Team | Deployment, maintenance, security |

---

# 11. User Personas

## Admin

Responsibilities:
- Manage users & roles
- Configure application settings
- Monitor system security & session logs
- View audit logs

Goals:
- Maintain application health & security.
- Ensure proper role assignment.

---

## Design Engineer

Responsibilities:
- Create Indent Sheet (Product, Customer, Materials, Drawings)
- Create Process Cost Sheet (Manufacturing Processes, Vendor/In-House selection, Planned Costs)
- Attach Engineering Drawings / CAD files
- Submit Business Transaction

Goals:
- Quickly prepare engineering documentation.
- Eliminate paper indents & manual calculations.

---

## Stores Executive

Responsibilities:
- Review material requirements
- Verify stock availability
- Issue raw materials to production
- Update dispatch details

Goals:
- Ensure prompt material fulfillment.
- Reduce stock discrepancies.

---

## Accounts Executive

Responsibilities:
- Collect vendor bills & in-house cost statements
- Enter actual costs for every manufacturing process
- Calculate cost variance (Planned vs Actual)
- Finalize financial record

Goals:
- Ensure accurate financial closure.
- Identify process cost variances.

---

## Senior Manager (Executive)

Responsibilities:
- Monitor live business transaction progress
- Inspect cost variances & department turnaround times
- Receive real-time notification broadcasts on stage transitions
- Passive monitoring (No manual approvals or rejections)

Goals:
- High-level operational oversight without workflow bottlenecks.

---

## General Manager (Executive)

Responsibilities:
- Plant-wide performance monitoring
- Executive risk & cost variance inspection
- Receive real-time notification broadcasts on stage transitions
- Passive monitoring (No manual approvals or rejections)

Goals:
- Ensure overall plant efficiency & financial accuracy.

---

## Production Executive

Responsibilities:
- Receive raw materials from Stores
- Execute manufacturing processes
- Update work center production status
- Complete manufacturing & deliver product to customer

Goals:
- Ensure timely production & delivery to customer.

---

# 12. Current Business Process

The current workflow is manual.

```
Design
↓
Prepare Paper Indent
↓
Prepare Excel Cost Sheet
↓
Stores Verification
↓
Accounts Verification
↓
Senior Manager Review
↓
General Manager Approval
↓
Production
↓
Material Receipt
↓
Manufacturing
```

Pain Points:
- Manual signatures & approval delays
- Excel calculations & disconnected actual costs
- Email communication & lost tracking
- Duplicate data entry
- Limited traceability

---

# 13. Proposed Future Process (Two-Loop Business Workflow)

The future workflow will be fully digital and operates across two business loops with zero manual approvals.

```
Login
↓
Role-Based Work Queue / Executive Dashboard
↓
Create Business Transaction (Indent Sheet & Process Cost Sheet)
↓
Submit (State = DESIGN_COMPLETED) → Notify SM & GM
↓
Stores Material Verification & Stock Issue (State = STORES_PROCESSING) → Notify SM & GM
↓
Production Manufacturing & Customer Delivery (State = CUSTOMER_DELIVERED) → Loop 1 Closed → Notify SM & GM
↓
Accounts Invoice Collection, Actual Cost Entry & Cost Variance Calculation (State = ACCOUNTS_COST_VERIFICATION)
↓
Accounts Financial Closure (State = ACCOUNTS_FINANCIAL_CLOSURE) → Loop 2 Closed → Notify SM & GM
↓
System Automated Archival & Final Report Generation (State = ARCHIVED → COMPLETED) → Notify SM & GM
↓
Reports & Analytics
```

---

# 14. Business Benefits

The proposed solution provides:

### Operational Benefits

- Faster turnaround times
- Total elimination of approval bottlenecks (Zero-Approval Architecture)
- Centralized data & document repository
- Improved inter-department collaboration

### Financial Benefits

- Reduced operational costs
- Automated Cost Variance calculation per process
- Real-time actual cost tracking by Accounts
- Improved resource utilization

### Technical Benefits

- Secure JWT authentication & RBAC
- Complete audit trail for all mutations
- Real-time executive dashboards & notifications
- Scalable architecture
- Cloud deployment on Render & Neon PostgreSQL

---

# 15. Risks

Potential risks include:

- User adoption & process transition
- Data entry accuracy for actual vendor bills
- Training requirements for work center status updates
- Network connectivity dependencies

Mitigation strategies:

- User training & clear role workflows
- Field-level validation rules
- Passive notification feeds for management
- Comprehensive documentation

---

# 16. Assumptions

- Users have access to modern web browsers.
- Departments follow their designated workflow stages.
- Internet connectivity is available.
- User authentication is mandatory.
- All business documents will be managed digitally.

---

# 17. Constraints

- Web-based application.
- Neon PostgreSQL database.
- NestJS backend framework.
- React frontend framework.
- Cloud deployment on Render.
- Enterprise security standards & zero-approval notification routing.

---

# 18. Phase 1 Deliverables

At the end of Phase 1, the following are complete:

- Business requirements documented.
- Product vision approved.
- Scope defined.
- Stakeholders identified.
- User personas documented.
- Current workflow documented.
- Future two-loop zero-approval workflow documented.
- Business objectives established.
- Success metrics defined.
- Risks and assumptions recorded.

---

# Phase 2 – Functional Requirements Specification (FRS)

**Project:** Enterprise Manufacturing Indent & Costing Management System (IMCMS)  
**Version:** 2.0  
**Status:** Approved  

---

# 1. Purpose

The purpose of this document is to define the complete functional requirements for the Enterprise Manufacturing Indent & Costing Management System.

This document describes:

- System functionality
- Business modules
- User interactions
- Business rules
- Functional requirements
- Acceptance criteria

---

# 2. Functional Scope

The system consists of the following modules:

## Core Foundation

- Authentication & JWT Refresh Tokens
- Authorization (RBAC & Stage Guards)
- User Management
- Department Management
- Role Management
- Permission Management

---

## Master Data

- Materials
- Products
- Vendors
- Manufacturing Processes
- Units

---

## Business Modules

- Indent Sheet Management (Design)
- Process Cost Sheet Management (Planned & Actual Costs)
- 2-Loop Workflow Engine
- Executive Notification Engine
- Inventory & Stock Issue (Stores)
- Production Execution & Customer Delivery

---

## Enterprise Modules

- Reports & Export Engine
- Analytics & Dashboards
- Notifications (In-App & Email)
- Audit Logs & Activity Logs
- System Settings

---

# 3. Authentication Module

## Purpose

Authenticate users securely before allowing access to the application.

### Features

- Login
- Logout
- Forgot Password
- Reset Password
- Change Password
- Refresh Token Rotation
- User Profile

### Business Rules

- Email must be unique.
- Password must be encrypted (bcrypt).
- JWT authentication is mandatory.

---

# 4. Authorization Module

## Purpose

Control access to application features using granular RBAC and stage-level route guards.

### Features

- Role Management
- Permission Management
- RBAC Guards (`JwtAuthGuard`, `RolesGuard`, `PermissionsGuard`)
- Protected APIs & Routes

---

# 5. User Management

## Purpose

Manage application users and role assignments.

### Features

- Create User
- Update User
- Deactivate / Reactivate User
- Reset Password
- Search & Filter Users

---

# 6. Department Management

## Features

- Create Department
- Edit Department
- Disable Department

---

# 7. Material Management

## Features

- Create Material
- Update Material
- Unit Selection
- Search & Pagination

---

# 8. Product Management

## Features

- Create Product
- Attach Drawing
- Revision Management
- Manufacturing Process Mapping

---

# 9. Vendor Management

## Features

- Create Vendor
- GST & Address Details
- Contact Details
- Vendor Status

---

# 10. Manufacturing Process Management

Examples: Turning, Heat Treatment, Grinding, Assembly, Inspection.

---

# 11. Indent Sheet Management

## Purpose

Digitize the engineering material requirement document.

### Features

- Create Indent Sheet
- Edit Draft
- Save Draft
- Submit Business Transaction
- Attach Drawings & CAD files (`BYTEA`)

---

# 12. Process Cost Sheet Management

## Purpose

Digitize manufacturing process costing and compute automated cost variance.

### Features

- Planned Cost Entry (Design Stage per process)
- Vendor / In-House Selection per process
- Actual Cost Entry (Accounts Stage per process)
- Automated Cost Variance Calculation (`Actual Cost - Planned Cost`)
- Financial Closure

---

# 13. Workflow Management

Operates on the Two-Loop Business Workflow Architecture (`Design` → `Stores` → `Production` → `Accounts` → `System Archival`).

---

# 14. Executive Notification & Monitoring Engine

### Features

- Real-Time Notification Broadcast Feed
- Live Business Transaction Stage Tracking
- Cost Variance Alerts
- Read-Only Audit History Inspection

### Business Rules

- Senior Managers and General Managers do NOT perform manual approvals or rejections.
- Automated notifications are broadcast to Senior Managers and General Managers at every state transition.

---

# 15. Inventory & Stores Management

### Features

- Review Material Requirements
- Verify Stock Availability
- Raw Material Issue & Dispatch to Production Work Center

---

# 16. Production Management

### Features

- Receive Raw Materials from Stores
- Update Production Work Center Status
- Complete Manufacturing
- Deliver Finished Product to Customer

---

# 17. Notification Module

### Notification Types

- Business Transaction Submitted (`DESIGN_COMPLETED`)
- Raw Materials Issued (`STORES_PROCESSING`)
- Manufacturing Completed & Customer Delivered (`CUSTOMER_DELIVERED`)
- Accounts Financial Closure (`ACCOUNTS_FINANCIAL_CLOSURE`)
- Transaction Archived (`ARCHIVED`)
- SLA Warning Alert

---

# 18. Reports & Analytics

Standard Reports: Indent Sheet Report, Process Cost Sheet Report, Cost Variance Report, Vendor Report, Production Report.

---

# 19. Analytics & Dashboards

Dashboards: Executive Dashboard (SM & GM), Department Task Work Queues, Cost Variance Dashboard, Turnaround Time Metrics.

---

# 20. Audit Logs

Track: Login, Logout, Create, Update, Soft Delete, State Transition, Cost Entry, Archival.

---

# Phase 3 – Workflow & Business Process Specification (WBPS)

**Project:** Enterprise Manufacturing Indent & Costing Management System (IMCMS)  
**Version:** 2.0  
**Document Type:** Workflow & Business Process Specification  

---

# 1. High-Level Business Workflow Architecture

```
Design Department (Create Indent Sheet & Process Cost Sheet)
↓
Submit (State = DESIGN_COMPLETED) → Notify SM & GM
↓
Stores Stock Verification & Material Issue (State = STORES_PROCESSING) → Notify SM & GM
↓
Production Manufacturing & Customer Delivery (State = CUSTOMER_DELIVERED) → Loop 1 Closed → Notify SM & GM
↓
Accounts Cost Verification & Actual Cost Entry (State = ACCOUNTS_COST_VERIFICATION)
↓
Accounts Financial Closure (State = ACCOUNTS_FINANCIAL_CLOSURE) → Loop 2 Closed → Notify SM & GM
↓
System Automated Archival & Final Report Generation (State = ARCHIVED → COMPLETED) → Notify SM & GM
```

---

# 2. Department Responsibilities & Permissions

## Design Department
- **Responsibilities:** Create Indent Sheet, Create Process Cost Sheet (Planned Costs for Manufacturing Processes e.g. Turning, Heat Treatment, Grinding, Assembly, Inspection), attach drawings, submit document.
- **Allowed Actions:** Create, Edit Draft, Save Draft, Submit.
- **Not Allowed:** Issue raw materials, enter actual vendor costs.

## Stores Department
- **Responsibilities:** Review material requirements, verify stock availability, issue raw materials, dispatch to production.
- **Allowed Actions:** Stock verification, Material issue, Dispatch confirmation.

## Production Department
- **Responsibilities:** Receive raw materials, execute manufacturing processes, update status, complete manufacturing, deliver product to customer.
- **Allowed Actions:** Receive materials, Update production status, Customer delivery confirmation.

## Accounts Department
- **Responsibilities:** Collect vendor bills and in-house cost statements, verify planned costs, enter actual cost for every process, calculate cost variance, finalize financial record.
- **Allowed Actions:** Enter actual costs, Calculate variance, Finalize financial record.

## Senior Manager & General Manager (Executive Roles)
- **Responsibilities:** Passive executive monitoring, review live state tracker, inspect cost variances.
- **Rule:** Do NOT approve or reject documents. Notified automatically at every stage transition.

---

# 3. Workflow States & Transitions

### 9 Sequential Business States:

1. `Draft`
2. `Design Completed`
3. `Stores Processing`
4. `Production Processing`
5. `Customer Delivered` *(Loop 1 Closed)*
6. `Accounts Cost Verification`
7. `Accounts Financial Closure` *(Loop 2 Financial Closure)*
8. `Archived`
9. `Completed` *(Transaction Closed)*

---

# 4. Executive Notification Matrix

| Event Trigger | Direct Action Target | Executive Notifications |
| --- | --- | --- |
| Indent & Process Cost Sheet Submitted | Stores Department | Senior Manager, General Manager |
| Stores Issues Raw Materials | Production Department | Senior Manager, General Manager |
| Production Delivers to Customer | Accounts Department | Senior Manager, General Manager |
| Accounts Finalizes Costs | System Archival | Senior Manager, General Manager |
| System Archives Transaction | Transaction Closed | Senior Manager, General Manager |

---

# Phase 4 – Technical Solution Architecture Specification (TSAS)

**Project:** Enterprise Manufacturing Indent & Costing Management System (IMCMS)  
**Version:** 2.0  
**Document Type:** Technical Architecture Specification  

---

# 1. Architecture Overview

Three-tier enterprise modular architecture:
- Presentation Layer (React 19 + TypeScript + Tailwind CSS)
- Business Logic Layer (NestJS + TypeScript)
- Data Layer (Neon PostgreSQL + Prisma ORM)

---

# 2. Business Logic Execution

- **Loop 1 Execution:** Design → Stores → Production → Customer Delivery.
- **Loop 2 Execution:** Accounts actual cost verification → Cost variance calculation → System automated archival (`BYTEA` attachments, audit history, workflow logs locked).
- **Notification Engine:** Event emission on state transitions routing notifications to SM & GM.

---

# Phase 5 – User Experience (UX), User Interface (UI) & Screen Specification

**Project:** Enterprise Manufacturing Indent & Costing Management System (IMCMS)  
**Version:** 2.0  
**Document Type:** UI/UX & Screen Specification  

---

# 1. Navigation & Role-Based Layouts

- **Left Sidebar:** Module links based on role (Dashboard, Work Queue, Indents, Cost Sheets, Materials, Products, Vendors, Production, Reports, Analytics, Settings).
- **Top Navigation:** Global Search, Real-Time Executive Notification Badge, User Profile Menu.

---

# 2. Key Screens

- **Design Screen:** Indent Sheet basic info, Material Grid, Engineering Drawing Uploader (`BYTEA`), Process Cost Sheet Planned Costs, Submit action.
- **Stores Work Center:** Material requirement review, stock availability status, raw material issue action.
- **Production Work Center:** Raw material receipt acknowledgment, manufacturing process status tracker, customer delivery action.
- **Accounts Costing Screen:** Process actual cost entry form, automated cost variance breakdown table, financial closure action.
- **Executive Dashboard (SM & GM):** Real-time notification feed, live workflow state progress bar, cost variance widgets, turnaround metrics.
- **Workflow & Audit Timeline:** Step-by-step state tracker with timestamp audit logs.
