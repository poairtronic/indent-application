# ENTERPRISE MANUFACTURING INDENT & COSTING MANAGEMENT SYSTEM (IMCMS)
## Complete Application Flow & Two-Loop Business State Machine Specification

**Project:** Enterprise Manufacturing Indent & Costing Management System (IMCMS)  
**Document Type:** System Workflow & UI Application Flow Specification  
**Version:** 2.0 (Approved 2-Loop Zero-Approval Architecture)  
**Status:** Approved  

---

# 1. System Architecture & Entry Flow

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
     ▼          ▼          ▼          ▼          ▼          ▼          ▼
  Design      Stores   Production  Accounts  Sr.Manager    GM       System
     │          │          │          │          │          │          │
     └──────────┴──────────┴──────────┴──────────┴──────────┴──────────┘
                                     │
                                     ▼
                       Department Task & Executive Monitoring
```

---

# 2. Two-Loop Business Workflow

## 2.1 LOOP 1: Manufacturing Workflow (Design → Stores → Production → Customer Delivery)

### Stage 1: Design Department Flow
```
Design Dashboard
    │
    ▼
Create Business Transaction
    │
    ├──────────────────────────────┬──────────────────────────────┐
    ▼                                                             ▼
Create Indent Sheet                                   Create Process Cost Sheet
 • Select Product                                      • Define Manufacturing Processes
 • Customer Details                                     (e.g., Turning → Heat Treatment →
 • Material Requirements & Quantities                    Grinding → Assembly → Inspection)
 • Upload Drawings / PDFs / CAD                        • Select Vendor / In-House per Process
                                                       • Planned Cost per Process
    │                                                  • Total Planned Cost
    └──────────────────────────────┬──────────────────────────────┘
                                   │
                                   ▼
                             Save Draft
                                   │
                                   ▼
                       Submit Business Document
                                   │
                                   ▼
                   State = DESIGN_COMPLETED
                                   │
                                   ▼
          Notifications Sent → Stores, Senior Manager, General Manager
```

### Stage 2: Stores Department Flow (Material Fulfillment)
```
Stores Dashboard (Notification Feed)
     │
     ▼
Review Material Requirement & Indent Sheet
     │
     ▼
Verify Stock Availability
     │
     ▼
Issue Raw Materials & Update Issue Details
     │
     ▼
Dispatch Materials to Production
     │
     ▼
State = STORES_PROCESSING
     │
     ▼
Notifications Sent → Production, Senior Manager, General Manager
```

### Stage 3: Production Department Flow (Manufacturing & Delivery)
```
Production Dashboard (Work Center Notification)
      │
      ▼
Receive Raw Materials from Stores
      │
      ▼
Manufacture Product (Execute Manufacturing Processes)
      │
      ▼
Update Production Status
      │
      ▼
Complete Manufacturing
      │
      ▼
Deliver Finished Product to Customer
      │
      ▼
State = CUSTOMER_DELIVERED (Loop 1 Closed)
      │
      ▼
Notifications Sent → Accounts, Senior Manager, General Manager
```

---

## 2.2 LOOP 2: Financial Workflow (Accounts Cost Verification → Financial Closure → System Archival)

### Stage 4: Accounts Department Flow (Financial Verification & Closure)
```
Accounts Dashboard (Notification Feed)
      │
      ▼
State = ACCOUNTS_COST_VERIFICATION
      │
      ▼
Collect Vendor Bills & In-House Cost Statements
      │
      ▼
Verify Planned Process Costs against Invoices
      │
      ▼
Enter Actual Cost for Every Process
      │
      ▼
Calculate Cost Variance (Planned vs Actual)
      │
      ▼
Generate Final Cost Sheet
      │
      ▼
Finalize Financial Record
      │
      ▼
State = ACCOUNTS_FINANCIAL_CLOSURE
      │
      ▼
Notifications Sent → Senior Manager, General Manager
```

### Stage 5: System Automated Archival & Transaction Completion
```
System Automated Process
      │
      ▼
Archive Indent Sheet & Process Cost Sheet
      │
      ▼
Store Audit History, Workflow Logs & Drawings/Attachments
      │
      ▼
State = ARCHIVED
      │
      ▼
Generate Final Report
      │
      ▼
State = COMPLETED (Business Transaction Closed)
      │
      ▼
Notifications Sent → Senior Manager, General Manager
```

---

# 3. Executive Monitoring & Zero-Approval Architecture

```
                       EXECUTIVE MONITORING (SM & GM)
                                     │
        ┌────────────────────────────┴────────────────────────────┐
        ▼                                                         ▼
Senior Manager (SM) Dashboard                            General Manager (GM) Dashboard
 • Real-time Notification Feed                            • Real-time Notification Feed
 • Live Process State Tracker                             • Cost Variance & Analytics Widgets
 • Department Bottleneck Alerts                           • Full Audit History Inspection
 • Read-Only View of Indent & Cost Sheets                 • Executive Performance Metrics
```

> [!IMPORTANT]
> **Zero-Approval Rule:** Senior Managers and General Managers do NOT approve or reject transactions. There are no approval engines, approval queues, return loops, or reject buttons. Senior Managers and General Managers receive notifications at every stage transition and passively monitor process execution and financial variances via executive dashboards.

---

# 4. Auxiliary Subsystem Flows

## 4.1 Attachment Handling Flow
```
Upload File (Design Stage)
    │
    ▼
Validation Check (Extension & MIME Type)
    │
    ▼
Store Metadata & Link to Business Transaction
    │
    ▼
Store Binary Data (BYTEA) / Managed Storage
    │
    ▼
Available for Read-Only Inspection across Workflows & Archival
```

## 4.2 Audit Logging Flow
```
Action Triggered (Create / Submit / Stock Issue / Status Update / Delivery / Cost Entry / Closure / Archive)
    │
    ▼
Capture Event Data (User ID, Timestamp, Department, Action, Old Value, New Value, IP Address)
    │
    ▼
Write to AuditLogs Table
```

## 4.3 Notification Flow Matrix
```
Trigger Event                        Stores  Production  Accounts   SM     GM
-----------------------------------------------------------------------------
Design Submits Business Transaction    ✅        ❌          ❌      ✅     ✅
Stores Issues Material                 ❌        ✅          ❌      ✅     ✅
Production Delivers to Customer        ❌        ❌          ✅      ✅     ✅
Accounts Finalizes Cost                ❌        ❌          ❌      ✅     ✅
System Archives Transaction            ❌        ❌          ❌      ✅     ✅
```

---

# 5. Overall Business State Machine

```
Draft
  │
  ▼
Design Completed
  │
  ▼
Stores Processing
  │
  ▼
Production Processing
  │
  ▼
Customer Delivered   (Loop 1 Closed)
  │
  ▼
Accounts Cost Verification
  │
  ▼
Accounts Financial Closure
  │
  ▼
Archived
  │
  ▼
Completed   (Loop 2 Closed & Transaction Closed)
```

---

# 6. Complete End-to-End System Summary

```
Login ──► Auth Check ──► Role Dashboard ──► Create Indent & Process Cost Sheet ──► Submit
                                                                                       │
                                                                                       ▼
Reports & Archival ◄── Completed ◄── Archived ◄── Financial Closure ◄── Cost Entry ◄── Customer Delivery ◄── Production ◄── Stores Issue
```
