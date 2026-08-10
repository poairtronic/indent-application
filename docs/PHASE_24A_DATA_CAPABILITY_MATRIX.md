# Phase 24A - Analytics Data Capability Matrix

This document lists the supported KPIs, calculation sources, formulas, and database gaps identified in the IMCMS database schema.

## 1. Analytics & KPI Capability Matrix

| KPI / Metric | Database Source | Calculation / Formula | Supported | Reason |
|--------------|-----------------|-----------------------|-----------|--------|
| **Total Indents** | `Indent` | `COUNT(id) WHERE isDeleted = false` | **Yes** | Fully supported in schema. |
| **Active Indents** | `Indent` | `COUNT(id) WHERE status IN (SUBMITTED, PENDING_STORES, IN_PRODUCTION, APPROVED, PENDING_ACCOUNTS, PENDING_SENIOR_MANAGER)` | **Yes** | Fully supported in schema. |
| **Completed Transactions** | `Indent` | `COUNT(id) WHERE status = COMPLETED` | **Yes** | Represents final closed status. |
| **Production Completed** | `Indent` | `COUNT(id) WHERE status = COMPLETED` (or matching `ProductionReceipt` exists) | **Yes** | Linked to completed production receipts. |
| **Materials Issued** | `IndentItem` | `COUNT(id) WHERE status = 'ISSUED'` | **Partial / No** | `IndentItem.status` does not have a formal 'ISSUED' enum; tracks store issues through workflow transition events. |
| **Production In Progress** | `Indent` | `COUNT(id) WHERE status = IN_PRODUCTION` | **Yes** | Tracks active manufacturing. |
| **Customer Deliveries** | `Indent` | `COUNT(id) WHERE status = COMPLETED` | **Yes** | Closed indents represent completed customer deliveries. |
| **Total Planned Cost** | `CostSheet` | `SUM(predictedTotal) WHERE isDeleted = false` | **Yes** | CostSheet predicted values exist. |
| **Total Actual Cost** | `CostSheet` | `SUM(actualTotal) WHERE isDeleted = false AND actualTotal != null` | **Yes** | CostSheet actual totals exist. |
| **Total Variance** | `CostSheet` | `SUM(varianceAmount) WHERE isDeleted = false` | **Yes** | CostSheet variance values exist. |
| **Average Planned Cost** | `CostSheet` | `AVG(predictedTotal) WHERE isDeleted = false` | **Yes** | Supported via database AVG aggregation. |
| **Average Actual Cost** | `CostSheet` | `AVG(actualTotal) WHERE isDeleted = false AND actualTotal != null` | **Yes** | Supported via database AVG aggregation. |
| **Cost Variance %** | `CostSheet` | `(Total Actual Cost - Total Planned Cost) / Total Planned Cost * 100` | **Yes** | Safe math division handling zero. |
| **Total Material Cost** | `CostItem` | `SUM(predictedAmount) / SUM(actualAmount)` | **Yes** | Aggregates individual material rows. |
| **Total Process Cost** | `ProcessCost` | `SUM(predictedCost) / SUM(actualCost)` | **Yes** | Aggregates manufacturing process costs. |
| **Draft Transactions** | `Indent` | `COUNT(id) WHERE status = DRAFT` | **Yes** | Supported in schema. |
| **Design Pending** | `Indent` | `COUNT(id) WHERE status = SUBMITTED` | **Yes** | Mapped toLoop 1 workflow stages. |
| **Stores Pending** | `Indent` | `COUNT(id) WHERE status = PENDING_STORES` | **Yes** | Tracks stores queue workload. |
| **Production Pending** | `Indent` | `COUNT(id) WHERE status = IN_PRODUCTION` | **Yes** | Production stage in progress. |
| **Accounts Pending** | `Indent` | `COUNT(id) WHERE status = PENDING_ACCOUNTS` | **Yes** | Accounts queue workload. |
| **Archived Transactions** | `Indent` | `COUNT(id) WHERE status = PENDING_GENERAL_MANAGER` | **Yes** | Archived stage status. |
| **Average Production Duration** | `WorkflowHistory` | `AVG(COMPLETED.movedAt - IN_PRODUCTION.movedAt)` in hours | **Yes** | Supported by auditing workflow transition logs. |
| **Average Workflow Duration** | `WorkflowHistory` | `AVG(COMPLETED.movedAt - DRAFT.createdAt)` in hours | **Yes** | Supported by timeline audit timestamps. |
| **Average Stores Processing Time** | `WorkflowHistory` | `AVG(StoresMovedAt - StoresReceivedAt)` in hours | **Yes** | Computed from workflow stage transition timings. |
| **Average Accounts Processing Time** | `WorkflowHistory` | `AVG(AccountsMovedAt - AccountsReceivedAt)` in hours | **Yes** | Computed from workflow stage transition timings. |
| **Average Transaction Completion Time**| `WorkflowHistory` | `AVG(COMPLETED.movedAt - createdAt)` in hours | **Yes** | Cycles times for completed indents. |
| **Process Yield Rate** | `IndentProcess` | `AVG(outputQuantity / inputQuantity * 100)` | **No (GAP)** | Input/output quantities do not exist in database. |
| **Machine Utilization Rate** | `MachineLog` | `SUM(operatingHours) / SUM(operating + downtime) * 100` | **No (GAP)** | Machine tables do not exist in database. |
| **Department Budget Utilization** | `DepartmentBudget` | `SUM(allocatedAmount) / budgetLimit * 100` | **No (GAP)** | Budget limit and allocation tables do not exist in database. |

## 2. Calculation Verification Plan
All metrics will be calculated at the NestJS service level using Prisma grouping and aggregate syntax. Comparisons will compare the current selected date range against a mathematically equivalent prior date range (e.g., if a 30-day filter is applied, it will query the preceding 30 days to calculate change percentage).
