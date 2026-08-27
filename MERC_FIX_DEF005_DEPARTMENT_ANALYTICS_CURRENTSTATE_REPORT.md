# MERC_FIX_DEF005_DEPARTMENT_ANALYTICS_CURRENTSTATE_REPORT.md

## 1. Exact root cause
The `getDepartmentAnalytics` endpoint grouped indents by `departmentId` and the legacy `status` field instead of the new Two-Loop Architecture's domain state `currentState`. This caused inaccurate grouping and analytics reporting, directly contrasting with the intended domain-driven definitions mapped in `currentState`.

## 2. Legacy status usage
The legacy `status` field was statically bound to Prisma's old enum `IndentStatus` (e.g., `DRAFT`, `SUBMITTED`, `PENDING_STORES`, etc.). Because this field does not represent the decoupled two-loop workflow stages, the analytical queueing was mismatched from the live data. 

## 3. Actual currentState model
The true, authoritative domain model uses `currentState` (a string column retaining explicit multi-stage transitions). States include: `DRAFT`, `DESIGN_COMPLETED`, `STORES_PROCESSING`, `MATERIALS_ISSUED`, `PRODUCTION_PROCESSING`, `PRODUCTION_COMPLETED`, `ACCOUNTS_COST_VERIFICATION`, `ACTUAL_COST_UPDATED`, `ACCOUNTS_FINANCIAL_CLOSURE`, `ARCHIVED`, and `COMPLETED`. 

## 4. Incorrect behavior
Because `this.prisma.indent.groupBy({ by: ['departmentId', 'status'] })` grouped by legacy statuses like `SUBMITTED`, `getDepartmentAnalytics` would incorrectly categorize pending queue numbers on the frontend when real data had technically advanced to `DESIGN_COMPLETED` or `MATERIALS_ISSUED` in the new `currentState` string field. 

## 5. Correct behavior
Grouping now accurately leverages `this.prisma.indent.groupBy({ by: ['departmentId', 'currentState'] })`. The domain classification now counts exactly what phase of the loop the indent resides in and reliably tags pending/completed loads per department.

## 6. Files changed
- `backend/src/analytics/analytics.service.ts`
- `backend/src/analytics/analytics.service.spec.ts`

## 7. State mapping
The `CURRENT_STATE_LABEL_MAP` originally fixed in DEF-002 was moved to an accessible class constant `AnalyticsService.CURRENT_STATE_LABEL_MAP` and successfully maps:
- `DRAFT` -> Draft
- `DESIGN_COMPLETED` -> Design Completed
- `STORES_PROCESSING` -> Stores Processing
- `MATERIALS_ISSUED` -> Materials Issued
- `PRODUCTION_PROCESSING` -> Production Processing
- `PRODUCTION_COMPLETED` -> Production Completed
- `ACCOUNTS_COST_VERIFICATION` -> Accounts Cost Verification
- `ACTUAL_COST_UPDATED` -> Actual Cost Updated
- `ACCOUNTS_FINANCIAL_CLOSURE` -> Accounts Financial Closure
- `ARCHIVED` -> Archived
- `COMPLETED` -> Completed

## 8. Golden dataset
Test mocks explicitly use:
```json
[
  { "departmentId": "dept-1", "currentState": "DRAFT", "_count": { "id": 1 } },
  { "departmentId": "dept-1", "currentState": "DESIGN_COMPLETED", "_count": { "id": 1 } },
  { "departmentId": "dept-1", "currentState": "COMPLETED", "_count": { "id": 1 } },
  { "departmentId": "dept-2", "currentState": "STORES_PROCESSING", "_count": { "id": 1 } }
]
```
These represent Department A ("Design") and Department B ("Stores") working through valid Two-Loop states.

## 9. Department results
With the mocked Golden dataset:
- **Design Dept:** returns Total = 3, Pending = 2 (`DRAFT`, `DESIGN_COMPLETED`), Completed = 1 (`COMPLETED`).
- **Stores Dept:** returns Total = 1, Pending = 1 (`STORES_PROCESSING`), Completed = 0.
The workload properly detects Design as the highest queue workload department.

## 10. Tenant isolation
No changes were made to `.findMany`, `_count` boundaries, `departmentId` queries, or `isDeleted` filters. Standard Prisma boundaries and user contexts natively cascade into the unmodified scopes identically to previous behavior.

## 11. RBAC
Controller `hasWorkflowAccess` decorators and roles checking logic remains 100% untouched.

## 12. Calculation verification
The `pendingQueue`, `completedCount`, and `totalTransactions` sum loops were identically maintained (`stats.total += row._count.id`). No mathematical aggregation behaviors were changed, ensuring precision retention.

## 13. API contract verification
No DTO, nested array schemas, properties, or interfaces (`IDepartmentAnalytics`, `IDepartmentWorkload`) were manipulated. Frontend consumption is unbroken. 

## 14. Frontend verification
Since the exact same `IDepartmentWorkload` output format returns `pendingQueue` and `completedCount`, the frontend natively ingests the exact corrected queue sums automatically without any required code changes on the React side. 

## 15. Regression results
- `getWorkflowAnalytics()` / `getExecutiveSummary()` are intact.
- `getDepartmentAnalytics()` passes with its `currentState` update.
- Target tests: 35 passing / 0 failing. 

## 16. Build
`npm run build` succeeds cleanly. 

## 17. Lint
`npm run lint` generates no new warnings or formatting rules for `analytics.service.ts`. 

## 18. Remaining defects
DEF-004 remains intentionally unaddressed per the task requirement.
