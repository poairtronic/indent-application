# ENTERPRISE MANUFACTURING INDENT & COSTING MANAGEMENT SYSTEM (IMCMS)
## Complete Application Flow & State Machine Specification

**Project:** Enterprise Manufacturing Indent & Costing Management System (IMCMS)  
**Document Type:** System Workflow & UI Application Flow Specification  
**Version:** 1.0  
**Status:** Approved  

---

# 1. System Entry & Authentication Flow

```
                                   START
                                     │
                                     ▼
                            User Opens Application
                                     │
                                     ▼
                           Authentication Module
                                     │
                 ┌───────────────────┴───────────────────┐
                 │                                       │
           Invalid Login                           Valid Login
                 │                                       │
         Error Message                          Generate JWT Token
                 │                                       │
                 └───────────────────┬───────────────────┘
                                     │
                                     ▼
                         Load User Profile & Permissions
                                     │
                                     ▼
                          Role-Based Dashboard Routing
                                     │
     ┌──────────┬──────────┬──────────┬──────────┬──────────┬──────────┐
     │          │          │          │          │          │          │
     ▼          ▼          ▼          ▼          ▼          ▼
  Design      Stores    Accounts   Sr.Manager  GM      Production
     │          │          │          │          │          │
     └──────────┴──────────┴──────────┴──────────┴──────────┘
                                     │
                                     ▼
                             Work Queue Dashboard
```

---

# 2. Department Workflows

## 2.1 Design Department Flow

```
Dashboard
    │
    ▼
Create New Indent
    │
    ▼
Select Product
    │
    ▼
Add Materials
    │
    ▼
Add Manufacturing Processes
    │
    ▼
Upload Drawings / PDFs / CAD
    │
    ▼
Create Cost Sheet
    │
    ▼
Estimated Material Cost
    │
    ▼
Estimated Process Cost
    │
    ▼
Estimated Total Cost
    │
    ▼
Save Draft
    │
    ├────────────► Edit Later
    │
    ▼
Submit Indent
    │
    ▼
Workflow Status = STORES_PENDING
    │
    ▼
Notification Sent to Stores
```

---

## 2.2 Stores Department Flow

```
Stores Dashboard
     │
     ▼
Pending Material Verification
     │
     ▼
Open Indent
     │
     ▼
Check Material Availability
     │
     ▼
Verify Materials
     │
     ├────────────► Reject ───► Return to Design
     │
     ▼
Approve
     │
     ▼
Workflow Status = ACCOUNTS_PENDING
     │
     ▼
Notification to Accounts
```

---

## 2.3 Accounts Department Flow

```
Accounts Dashboard
     │
     ▼
Pending Cost Verification
     │
     ▼
Open Cost Sheet
     │
     ▼
Review Material Cost
     │
     ▼
Review Process Cost
     │
     ▼
Enter Actual Cost
     │
     ▼
Calculate Variance
     │
     ▼
Approve
     │
     ├──────────► Reject ───► Return to Design
     │
     ▼
Workflow Status = SENIOR_MANAGER_PENDING
     │
     ▼
Notification Sent to Senior Manager
```

---

## 2.4 Senior Manager Flow

```
Senior Manager Dashboard
     │
     ▼
Pending Reviews
     │
     ▼
Open Indent
     │
     ▼
Review (Materials, Cost, Attachments, History, Comments)
     │
     ▼
Approve
     │
     ├────────► Reject ───► Return to Design
     │
     ▼
Workflow Status = GENERAL_MANAGER_PENDING
     │
     ▼
Notification Sent to General Manager
```

---

## 2.5 General Manager Flow

```
GM Dashboard
     │
     ▼
Pending Approvals
     │
     ▼
Review Complete Document
     │
     ▼
Approve
     │
     ├────────► Reject ───► Return to Design
     │
     ▼
Workflow Status = PRODUCTION_PENDING
     │
     ▼
Notify Production Department
```

---

## 2.6 Production Flow

```
Production Dashboard
      │
      ▼
Receive Approved Indent
      │
      ▼
Receive Materials
      │
      ▼
Confirm Receipt
      │
      ▼
Production Started
      │
      ├─────────────► Need Additional Materials?
      │                        │
      │                       Yes
      │                        │
      │                        ▼
      │            Create Additional Material Request
      │                        │
      │                        ▼
      │            Stores Verification
      │                        │
      │                        ▼
      │            Accounts Review (if costing changes)
      │                        │
      │                        ▼
      │                Material Issued
      │
      ▼
Production Completed
      │
      ▼
Workflow Closed
```

---

# 3. Auxiliary Subsystem Flows

## 3.1 Attachment Handling Flow

```
Upload File
    │
    ▼
Validation Check (Extension & MIME Type)
    │
    ▼
Store Metadata
    │
    ▼
Store Binary Data (BYTEA) in PostgreSQL
    │
    ▼
Link to Indent Record
    │
    ▼
Available for Workflow Review
```
*Supported formats:* PDF, Excel (.xlsx), CAD Drawings, Images (.png, .jpg), Word (.docx)

---

## 3.2 Audit Logging Flow

```
Action Triggered (Create / Update / Submit / Approve / Reject / Upload / Download / Login / Logout)
    │
    ▼
Capture Event Data:
• User ID
• Timestamp
• Module
• Action
• Old Value
• New Value
• IP Address
• User Agent
    │
    ▼
Write to AuditLogs Table
```

---

## 3.3 Email & In-App Notification Flow

```
Workflow Event (Submit / Approve / Reject / SLA Breach)
    │
    ▼
Notification Service
    │
    ├────────► In-App Notification Record Created
    │
    ▼
Email Queue
    │
    ▼
SMTP Relay
    │
    ▼
Deliver to Recipient → Update Email Log
```

---

## 3.4 Report Generation Flow

```
User Requests Report (Indent / Cost Sheet / Production / Vendor / Material)
    │
    ▼
Query Database with Filters
    │
    ▼
Compile Data & Generate PDF/Excel
    │
    ▼
Store Report History Record
    │
    ▼
Download File
```

---

## 3.5 Dashboard Analytics Flow

```
Database Transactions
    │
    ▼
Analytics Service Aggregations
    │
    ▼
Calculate KPIs:
• Pending Indents
• Approved Indents
• Department Workload
• Material Consumption
• Cost Variance
• Approval SLA Timers
• Production Turnaround Time
    │
    ▼
Render Charts & Dashboard Widgets
```

---

# 4. Overall Workflow State Machine

```
Draft
  │
  ▼
Submitted
  │
  ▼
Stores Verification ──────────────► Reject ───► Draft / Returned
  │
  ▼
Accounts Verification ────────────► Reject ───► Draft / Returned
  │
  ▼
Senior Manager Review ────────────► Reject ───► Draft / Returned
  │
  ▼
General Manager Approval ─────────► Reject ───► Draft / Returned
  │
  ▼
Production
  │
  ▼
Material Received
  │
  ▼
Production Completed
  │
  ▼
Closed
```

---

# 5. Complete End-to-End System Summary

```
Login ──► Auth Check ──► Role Dashboard ──► Create Indent ──► Create Cost Sheet ──► Submit
                                                                                     │
                                                                                     ▼
Reports & Analytics ◄── Closed ◄── Complete ◄── Material Receipt ◄── GM Approval ◄── SM Approval ◄── Accounts Verification ◄── Stores Verification
```

This application flow governs the frontend routing, backend API sequencing, state transition validations, notification triggers, and user acceptance scenarios for the IMCMS project.
