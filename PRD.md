# PRODUCT REQUIREMENTS DOCUMENT (PRD)

# Phase 1 – Business Foundation

**Project Name:** Enterprise Manufacturing Indent & Costing Management System (IMCMS)  
**Version:** 1.0  
**Document Owner:** Product Team  
**Status:** Draft  

---

# 1. Executive Summary

## Overview

The Enterprise Manufacturing Indent & Costing Management System (IMCMS) is a web-based ERP application designed to digitize and automate the complete material indent, costing, approval, and production workflow within a manufacturing organization.

The current process relies heavily on paper documents, Excel spreadsheets, manual approvals, and email communication. These manual methods increase processing time, introduce human error, reduce traceability, and make reporting difficult.

The proposed system will centralize the complete workflow into a single secure platform, enabling departments to collaborate efficiently while providing management with real-time visibility into manufacturing activities.

---

# 2. Business Background

The organization currently manages engineering indents and costing using manually maintained Excel sheets and printed forms.

Each department maintains its own records, resulting in:

- Duplicate data entry
- Manual approval processes
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

### Approval Delays

- Documents move manually between departments
- No centralized approval workflow
- Difficult to identify pending approvals

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

The application should become the central platform used by every department involved in manufacturing planning, costing, approvals, inventory coordination, and production execution.

The system should provide:

- Digital engineering documents
- Automated workflows
- Secure role-based access
- Complete audit history
- Real-time notifications
- Executive dashboards
- Enterprise reporting
- Scalable architecture for future ERP expansion

---

# 6. Business Objectives

## Primary Objectives

- Digitize paper-based engineering documents.
- Replace Excel costing sheets.
- Standardize approval workflows.
- Reduce document processing time.
- Improve collaboration between departments.
- Increase process transparency.
- Provide management dashboards.
- Reduce manual errors.
- Improve data accuracy.
- Enable future ERP expansion.

---

# 7. Success Metrics

The success of the application will be measured using the following Key Performance Indicators (KPIs):

### Operational KPIs

- Reduction in document processing time.
- Reduction in manual data entry.
- Reduction in approval delays.
- Increase in workflow visibility.
- Reduction in document loss.

### Business KPIs

- Faster production readiness.
- Improved cost accuracy.
- Increased approval efficiency.
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
- JWT Authentication

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

- Indent Management
- Cost Sheet Management
- Workflow Management
- Approval Management
- Production
- Inventory

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
| Admin | System administration |
| Design Department | Create indents and costing sheets |
| Stores Department | Verify materials and inventory |
| Accounts Department | Verify and finalize costing |
| Senior Manager | Review and approve workflows |
| General Manager | Final approval authority |
| Production Department | Receive materials and complete production |
| IT Team | Deployment, maintenance, security |

---

# 11. User Personas

## Admin

Responsibilities:

- Manage users
- Manage roles
- Configure application
- Monitor system
- View audit logs

Goals:

- Maintain application health.
- Ensure secure access.
- Configure business rules.

---

## Design Engineer

Responsibilities:

- Create Indent
- Create Cost Sheet
- Attach Engineering Drawings
- Submit Documents

Goals:

- Quickly prepare engineering documentation.
- Reduce paperwork.

---

## Stores Executive

Responsibilities:

- Verify materials.
- Check inventory.
- Confirm material availability.

Goals:

- Ensure accurate material verification.
- Reduce inventory discrepancies.

---

## Accounts Executive

Responsibilities:

- Verify costing.
- Update actual costs.
- Validate financial information.

Goals:

- Improve costing accuracy.
- Reduce costing errors.

---

## Senior Manager

Responsibilities:

- Review submitted documents.
- Monitor workflow.
- Approve or reject requests.

Goals:

- Improve approval turnaround.
- Monitor department performance.

---

## General Manager

Responsibilities:

- Final approval.
- Executive monitoring.
- Business oversight.

Goals:

- Improve operational efficiency.
- Monitor plant performance.

---

## Production Executive

Responsibilities:

- Receive materials.
- Confirm production readiness.
- Request additional materials if necessary.

Goals:

- Ensure uninterrupted production.

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

- Manual signatures
- Excel calculations
- Email communication
- Duplicate data entry
- Limited traceability
- Delayed approvals

---

# 13. Proposed Future Process

The future workflow will be fully digital.

```
Login
↓
Role-Based Work Queue
↓
Create Indent
↓
Create Cost Sheet
↓
Submit
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
Material Receipt Confirmation
↓
Workflow Completed
↓
Reports & Analytics
```

---

# 14. Business Benefits

The proposed solution provides:

### Operational Benefits

- Faster approvals
- Reduced paperwork
- Centralized data
- Improved collaboration

### Financial Benefits

- Reduced operational costs
- Better costing accuracy
- Reduced rework
- Improved resource utilization

### Technical Benefits

- Secure authentication
- Complete audit trail
- Real-time dashboards
- Scalable architecture
- Cloud deployment

---

# 15. Risks

Potential risks include:

- User adoption challenges
- Data migration complexity
- Training requirements
- Process changes
- Integration with future ERP modules

Mitigation strategies:

- User training
- Pilot rollout
- Role-based access
- Comprehensive testing
- Documentation

---

# 16. Assumptions

- Users have access to modern web browsers.
- Departments will follow the defined workflow.
- Internet connectivity is available.
- User authentication is mandatory.
- All business documents will be managed digitally.

---

# 17. Constraints

- Web-based application.
- PostgreSQL database.
- NestJS backend.
- React frontend.
- Cloud deployment on Render.
- Free/open-source technology stack where practical.
- Enterprise security standards.

---

# 18. Phase 1 Deliverables

At the end of Phase 1, the following should be complete:

- Business requirements documented.
- Product vision approved.
- Scope defined.
- Stakeholders identified.
- User personas documented.
- Current workflow documented.
- Future workflow documented.
- Business objectives established.
- Success metrics defined.
- Risks and assumptions recorded.

---

# Phase 2 – Functional Requirements Specification (FRS)

**Project:** Enterprise Manufacturing Indent & Costing Management System (IMCMS)  
**Version:** 1.0  
**Status:** Draft  

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

- Authentication
- Authorization (RBAC)
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

- Indent Management
- Cost Sheet Management
- Workflow Management
- Approval Management
- Inventory
- Production

---

## Enterprise Modules

- Reports
- Analytics
- Notifications
- Audit Logs
- Dashboard
- Settings

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
- Refresh Token
- User Profile

### Business Rules

- Email must be unique.
- Password must be encrypted.
- Password cannot be stored in plain text.
- JWT authentication is mandatory.

### Validation

- Valid email format
- Password policy
- Account must be active

### Acceptance Criteria

- User logs in successfully.
- Invalid credentials return an error.
- JWT token generated.
- Refresh token generated.

---

# 4. Authorization Module

## Purpose

Control access to application features.

### Features

- Role Management
- Permission Management
- RBAC
- Protected APIs
- Protected Routes

### Business Rules

- Every user has one role.
- Every role contains multiple permissions.
- Permissions determine access.

### Acceptance Criteria

- Unauthorized users receive 403 Forbidden.
- Menu changes dynamically based on permissions.

---

# 5. User Management

## Purpose

Manage application users.

### Features

- Create User
- Update User
- Deactivate User
- Reset Password
- Search Users
- Filter Users

### Business Rules

- Email must be unique.
- Employee Code must be unique.
- Soft delete only.

### Acceptance Criteria

- Admin can create users.
- Duplicate emails are rejected.

---

# 6. Department Management

## Features

- Create Department
- Edit Department
- Disable Department
- Search
- Filter

### Business Rules

- Department name must be unique.
- Departments cannot be deleted if users are assigned.

---

# 7. Material Management

## Features

- Create Material
- Update Material
- Material Categories
- Unit Selection
- Search
- Import Excel

### Business Rules

- Material Code must be unique.
- Unit required.
- Category required.

---

# 8. Product Management

## Features

- Create Product
- Attach Drawing
- Revision Management
- Manufacturing Process Mapping

### Business Rules

- Product Code unique.
- Multiple manufacturing processes allowed.

---

# 9. Vendor Management

## Features

- Create Vendor
- GST Information
- Contact Details
- Vendor Status

### Validation

- GST Number
- Email
- Phone

---

# 10. Manufacturing Process Management

Examples:

- Milling
- Turning
- Grinding
- Heat Treatment
- Inspection
- Assembly

### Features

- Process Master
- Estimated Hours
- Process Order
- Cost Parameters

---

# 11. Indent Management

## Purpose

Digitize the paper-based indent form.

### Features

- Create Indent
- Edit Draft
- Save Draft
- Submit
- Clone Indent
- View History
- Attach Drawings
- Attach PDFs

### Fields

- Indent Number
- PO Number
- Concept Number
- Customer
- Product
- Priority
- Required Date

### Material Grid

- Material
- Grade
- Size
- Quantity
- Unit
- Vendor
- Remarks

### Business Rules

- Draft can be edited.
- Submitted indent becomes read-only except through defined workflow actions.
- Every indent must have at least one material.

---

# 12. Cost Sheet Management

## Purpose

Digitize costing Excel sheets.

### Features

- Predicted Cost
- Actual Cost
- Material Cost
- Process Cost
- Variance Calculation

### Sections

- Material Cost
- Process Cost
- Summary

### Business Rules

- Predicted cost entered by Design.
- Actual cost updated by Accounts.
- System calculates variance automatically.

---

# 13. Workflow Management

Workflow

```
Design
↓
Stores
↓
Accounts
↓
Senior Manager
↓
General Manager
↓
Production
```

### Features

- Submit
- Forward
- Approve
- Reject
- Request Changes

### Business Rules

- Users can only act at their assigned workflow stage.
- All actions are recorded in history.

---

# 14. Approval Management

### Features

- Approval Queue
- Comments
- Digital Approval
- Timeline
- Status Tracking

### Business Rules

- Senior Manager reviews before General Manager.
- Rejected documents return to the previous stage.

---

# 15. Inventory Management

### Features

- Material Verification
- Material Issue
- Material Availability
- Stock Status

### Business Rules

- Stores verifies material availability before approval.

---

# 16. Production Management

### Features

- Receive Materials
- Production Confirmation
- Additional Material Request
- Completion Status

### Business Rules

- Materials should be received within the defined SLA.
- Additional material requests reference the original indent.

---

# 17. Notification Module

### Notification Types

- New Indent
- Approval Request
- Approval Completed
- Rejection
- Material Ready
- Production Complete
- SLA Warning

### Channels

- In-App
- Email

---

# 18. Reports

### Standard Reports

- Indent Report
- Cost Sheet Report
- Vendor Report
- Material Report
- Production Report
- Approval Report

### Export Formats

- PDF
- Excel

---

# 19. Analytics

### Dashboards

- Executive Dashboard
- Department Dashboard
- Workflow Dashboard
- Cost Dashboard
- Vendor Dashboard
- Production Dashboard

### KPIs

- Pending Indents
- Pending Approvals
- Cost Variance
- SLA Compliance
- Production Status
- Vendor Performance

---

# 20. Audit Logs

Track:

- Login
- Logout
- Create
- Update
- Delete (Soft Delete)
- Approval
- Workflow Changes
- Password Changes

---

# 21. Settings

### Features

- Company Profile
- Email Configuration
- Notification Settings
- SLA Configuration
- Workflow Configuration (future)
- Theme Settings

---

# 22. Global Functional Requirements

Every module must support:

- Search
- Filter
- Sorting
- Pagination
- Export
- Soft Delete
- Audit Trail
- Status Management
- Validation
- Responsive UI
- Accessibility

---

# 23. Business Rules Summary

- Every user belongs to one department.
- Every user has one role.
- Permissions are role-based.
- Indents must contain at least one material.
- Cost sheets are linked to indents.
- Workflow follows the defined department sequence.
- Production can request additional materials.
- All business actions are auditable.

---

# 24. Functional Acceptance Criteria

The system will be considered functionally complete when:

- Users can authenticate securely.
- Role-based permissions are enforced.
- Master data can be managed.
- Indents and cost sheets can be created and processed.
- Workflow and approvals operate correctly.
- Inventory and production processes are tracked.
- Reports and analytics are available.
- Notifications are delivered.
- Audit logs capture all significant actions.

---

# Phase 3 – Workflow & Business Process Specification (WBPS)

**Project:** Enterprise Manufacturing Indent & Costing Management System (IMCMS)  
**Version:** 1.0  
**Document Type:** Workflow & Business Process Specification  

---

# 1. Purpose

This document defines the complete business workflow executed by the Enterprise Manufacturing Indent & Costing Management System.

The objective is to replace the current manual engineering process with a secure, auditable, role-based digital workflow.

Every department must understand:

- Responsibilities
- Inputs
- Outputs
- Decision points
- Approvals
- Notifications
- SLA
- Exception handling

---

# 2. High-Level Business Workflow

```
Design Department
↓
Create Indent
↓
Create Cost Sheet
↓
Submit
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
Material Receipt Confirmation
↓
Workflow Completed
```

---

# 3. Department Responsibilities

## Design Department

### Responsibilities

- Create new indent
- Create costing sheet
- Attach engineering drawings
- Select materials
- Define manufacturing processes
- Estimate costs
- Submit document

### Inputs

- Customer requirement
- Drawing
- Product information
- Material list

### Outputs

- Indent
- Cost Sheet

### Allowed Actions

- Create
- Edit Draft
- Save Draft
- Submit
- Cancel Draft

### Not Allowed

- Verify inventory
- Update actual costs
- Approve workflow

---

## Stores Department

### Responsibilities

- Verify material availability
- Validate inventory
- Suggest alternative materials
- Confirm stock

### Inputs

- Submitted indent

### Outputs

- Material verification

### Allowed Actions

- Verify
- Reject
- Request clarification

### Not Allowed

- Modify costing
- Approve financial data

---

## Accounts Department

### Responsibilities

- Review costing
- Enter actual costs
- Calculate variance
- Validate financial data

### Inputs

- Verified indent
- Cost sheet

### Outputs

- Final costing

---

## Senior Manager

### Responsibilities

- Review documents
- Review costing
- Review workflow
- Approve
- Reject

---

## General Manager

### Responsibilities

- Final approval
- Executive review
- Risk assessment

---

## Production

### Responsibilities

- Receive materials
- Confirm receipt
- Request additional materials
- Complete workflow

---

# 4. Workflow States

Every document must always exist in exactly one workflow state:

- `Draft`
- `Submitted`
- `Stores Verification`
- `Accounts Verification`
- `Senior Manager Review`
- `General Manager Approval`
- `Approved`
- `Production`
- `Material Received`
- `Completed`
- `Rejected`
- `Returned`
- `Cancelled`

---

# 5. Workflow State Transitions

### Draft
Possible actions: Save, Edit, Submit, Delete

### Submitted
Possible actions: Send to Stores, Cancel Submission

### Stores Verification
Possible actions: Verify, Reject, Return to Design

### Accounts Verification
Possible actions: Verify Cost, Update Actual Cost, Return to Stores

### Senior Manager Review
Possible actions: Approve, Reject, Request Changes

### General Manager
Possible actions: Final Approval, Reject, Send Back

### Production
Possible actions: Receive Materials, Confirm Receipt, Request Additional Materials

---

# 6. Business Rules

- **Rule 1:** Only Design can create an Indent.
- **Rule 2:** Only Design can prepare the initial Cost Sheet.
- **Rule 3:** Stores cannot modify costing.
- **Rule 4:** Accounts cannot modify engineering information.
- **Rule 5:** Production cannot receive materials before approval.
- **Rule 6:** General Manager approval is mandatory before Production begins.
- **Rule 7:** Rejected documents return to the previous workflow stage with comments.
- **Rule 8:** Every workflow action generates an audit record.
- **Rule 9:** Every workflow action generates notifications.
- **Rule 10:** Workflow history cannot be deleted.

---

# 7. SLA Rules

| Stage | SLA |
| --- | --- |
| Design Submission | 1 Day |
| Stores Verification | 1 Day |
| Accounts Verification | 1 Day |
| Senior Manager Review | 1 Day |
| General Manager Approval | 1 Day |
| Production Receipt | 2 Days |

If SLA exceeds: Generate Notification → Escalation

---

# 8. Notification Matrix

| Event | Notify |
| --- | --- |
| Indent Submitted | Stores |
| Stores Approved | Accounts |
| Accounts Approved | Senior Manager |
| SM Approved | General Manager |
| GM Approved | Production |
| Material Received | Accounts, SM, GM |
| Rejected | Previous Department |
| SLA Breach | Admin + Responsible Department |

---

# 9. Approval Rules

Approval Hierarchy:
`Stores` → `Accounts` → `Senior Manager` → `General Manager`

Each approval records: User, Date, Time, Comments, Decision.

---

# 10. Rejection Workflow

`Rejected` → `Previous Stage` → `Edit` → `Resubmit` → `Continue Workflow`

Every rejection must include comments.

---

# 11. Additional Material Request Workflow

`Production` → `Request Additional Material` → `Stores Verification` → `Accounts Verification` → `Approval` → `Issue Material` → `Continue Production`

The request references the original indent and is fully traceable.

---

# 12. Exception Handling

- **Material Not Available:** Return to Design.
- **Cost Mismatch:** Return to Accounts.
- **Incorrect Drawing:** Return to Design.
- **Vendor Issue:** Return to Stores.
- **Production Delay:** Escalate to Management.

---

# 13. Audit Events

Log every significant action with User, Timestamp, Department, Action, Previous State, New State, and Comments.

---

# 14. Document Lifecycle

`Draft` → `Submitted` → `Verified` → `Approved` → `Production` → `Completed` → `Archived`

Soft deletion only; archived documents remain searchable.

---

# 15. Role Permissions by Workflow Stage

| Role | Create | Edit | Approve | Reject | View |
| --- | --- | --- | --- | --- | --- |
| Design | ✔ | ✔ | ✖ | ✖ | ✔ |
| Stores | ✖ | ✖ | ✔ (Verification) | ✔ | ✔ |
| Accounts | ✖ | ✔ (Actual Cost) | ✔ | ✔ | ✔ |
| Senior Manager | ✖ | ✖ | ✔ | ✔ | ✔ |
| General Manager | ✖ | ✖ | ✔ | ✔ | ✔ |
| Production | ✖ | ✖ | Material Receipt Only | ✖ | ✔ |
| Admin | ✔ | ✔ | ✔ | ✔ | ✔ |

---

# 16. Workflow Dashboard Requirements

Each role should see a personalized work queue tailored to their responsibilities.

---

# 17. Acceptance Criteria

- Workflow state transitions follow defined rules.
- Unauthorized transitions are blocked.
- All approvals and rejections are logged with comments.
- SLA timers trigger notifications appropriately.

---

# Phase 4 – Technical Solution Architecture Specification (TSAS)

**Project:** Enterprise Manufacturing Indent & Costing Management System (IMCMS)  
**Version:** 1.1  
**Document Type:** Technical Architecture Specification  

---

# 1. Purpose

Define the technical architecture of the Enterprise Manufacturing Indent & Costing Management System to ensure security, scalability, maintainability, and modularity.

---

# 2. Solution Overview

Three-tier enterprise architecture:
- Presentation Layer (React + TypeScript)
- Business Logic Layer (NestJS + TypeScript)
- Data Layer (Neon PostgreSQL + Prisma ORM)

---

# 3. Technology Stack

- **Frontend:** React, TypeScript, Vite, Tailwind CSS, React Router, React Hook Form, Zod, Zustand, TanStack Query, Axios
- **Backend:** NestJS, TypeScript, Prisma ORM, JWT, bcrypt, class-validator, class-transformer
- **Database:** Neon PostgreSQL (stores master data, transactions, workflow, files/documents via BYTEA, system data)
- **Deployment:** Render (Frontend Static Site, Backend Web Service, Neon PostgreSQL)

---

# 4. Storage Architecture

Neon PostgreSQL serves as the centralized storage for structured data and document attachments (PDF, Excel, Images, CAD drawings up to limit).

---

# 5. Security & Authentication

- HTTPS / TLS Encryption
- JWT Access & Refresh Tokens
- bcrypt Password Hashing
- RBAC Guard Controls
- DTO Input Validation
- Audit Logging for all critical endpoints

---

# 6. Performance Targets

- API Response Time: < 2 seconds
- Page Load Time: < 3 seconds
- 99.9% Uptime SLA

---

# Phase 5 – User Experience (UX), User Interface (UI) & Screen Specification

**Project:** Enterprise Manufacturing Indent & Costing Management System (IMCMS)  
**Version:** 1.0  
**Document Type:** UI/UX & Screen Specification  

---

# 1. Design Principles

- Simplicity, Consistency, Clarity, Accessibility (WCAG 2.1 AA), Efficiency, Scalability, Responsiveness.
- Clean layout inspired by Microsoft Dynamics 365, SAP Fiori, Atlassian Jira.

---

# 2. Navigation & Role-Based Layouts

- **Left Sidebar:** Dynamic module links based on permissions (Dashboard, Work Queue, Indents, Cost Sheets, Materials, Products, Vendors, Production, Reports, Analytics, Settings).
- **Top Navigation:** Global Search, Notifications, User Profile, Theme Switch, Help, Logout.

---

# 3. Key Screens

- **Work Queue:** Dedicated task list per role with Search, Filter, Sort, Pagination, and Action buttons.
- **Indent Screen:** Basic Information, Material Grid, Engineering Drawing Attachments, Save Draft / Submit actions.
- **Cost Sheet Screen:** Material Costs, Process Costs, Estimated vs. Actual Cost Summary, Automatic Variance Calculation.
- **Workflow & Approval Timeline:** Visual step-by-step state tracker with comments and timestamp audit logs.
- **Production Screen:** Material Receipt confirmation, Additional Material Request flow, Job completion.
- **Dashboards & Analytics:** Role-tailored KPI cards, workflow bottleneck metrics, cost variance trends.

---
