# MERC_FIX_DEF001_ANALYTICS_CURRENTSTATE_REPORT

## 1. Exact Root Cause
The `AnalyticsService.getExecutiveSummary` method correctly grouped data using the `currentState` database column, which returns Two-Loop zero-approval string domain state values (e.g., `'DESIGN_COMPLETED'`). However, the computation for `activeTransactions` and `pendingTransactions` used the arrays `ACTIVE_STATUSES` and `PENDING_STATUSES` which contained the legacy `IndentStatus` Prisma enums (e.g., `'SUBMITTED'`). Because `'DESIGN_COMPLETED'` does not match `'SUBMITTED'`, the reduce loop summed zero for all categories, causing the Executive Summary to return `0` active and pending transactions.

## 2. Incorrect Legacy Comparison
The code previously attempted to look up `statusMap.get(IndentStatus.SUBMITTED)` when the actual map keys were populated with strings like `'DESIGN_COMPLETED'`. 

## 3. Correct currentState Mapping
Two new local arrays were created inside `getExecutiveSummary` that use explicit Two-Loop strings matching the data in `currentState`:
- `CURRENT_STATE_ACTIVE`: `['DESIGN_COMPLETED', 'STORES_PROCESSING', 'MATERIALS_ISSUED', 'PRODUCTION_PROCESSING', 'PRODUCTION_COMPLETED', 'ACCOUNTS_COST_VERIFICATION', 'ACTUAL_COST_UPDATED', 'ACCOUNTS_FINANCIAL_CLOSURE']`
- `CURRENT_STATE_PENDING`: Includes the above active states plus `'DRAFT'`.

## 4. Files Changed
1. `backend/src/analytics/analytics.service.ts`
   - Scoped fix strictly to `getExecutiveSummary`. Replaced global legacy constants with localized `CURRENT_STATE_ACTIVE` and `CURRENT_STATE_PENDING`.
2. `backend/src/analytics/analytics.service.spec.ts`
   - Corrected the mock data in the `getExecutiveSummary` test block to return `{ currentState: '...' }` rather than the legacy `status` field, ensuring the fix is accurately tested against domain models.

## 5. Before Behavior
The endpoint correctly counted total transactions but reported `0` for active and pending transactions, effectively breaking executive dashboards.

## 6. After Behavior
The endpoint now correctly calculates active and pending transactions by looking up the Two-Loop domain strings natively returned by Prisma `groupBy` against `currentState`.

## 7. Golden Dataset Results
Tested via Jest using a deterministic test payload (Mocking Prisma response):
- `DRAFT`: 5
- `DESIGN_COMPLETED`: 3
- `STORES_PROCESSING`: 2
- `COMPLETED`: 4
- `ARCHIVED`: 1
**Result:** 15 Total, 5 Active, 4 Completed, 1 Archived, 10 Pending. All metrics correctly computed.

## 8. Tenant Isolation Result
Tenant isolation remains fully intact. The modification strictly addressed array filtering and map lookups in JS/TS. Prisma `where: { isDeleted: false }` logic and RBAC-injected tenant bounds were left untouched.

## 9. RBAC Result
Authorization remains unchanged. No changes were made to endpoints, controllers, or JWT logic. Users can still only query analytics if they have the correct dashboard permissions.

## 10. Regression Tests
- **Analytics Tests (`analytics.service.spec.ts`)**: 
  - `getExecutiveSummary` suite: **3/3 PASS** (Fix successful).
  - Unrelated methods correctly continue to fail (6 fails) as part of DEF-002, DEF-003, and DEF-005, preserving their baseline state exactly as requested.
- **Workflow State Machine / Core Logic**: Untouched. No side-effects.

## 11. Build
Build completed successfully. No compilation errors introduced.

## 12. Lint
Linting passed with minor pre-existing ES Module syntax warnings (no new warnings introduced).

## 13. Remaining Defects
- **DEF-002**: `STATUS_LABEL_MAP` uses legacy status keys but is accessed using `currentState` domain keys.
- **DEF-003**: Unsafe array access in `getWorkflowAnalytics` throws TypeErrors.
- **DEF-004**: Test suite missing `applicationSetting` mock in Prisma setup.
- **DEF-005**: `getDepartmentAnalytics` continues to incorrectly group by legacy `status`.

## FINAL STATUS
**PASS**
DEF-001 has been strictly isolated, fixed, and verified without altering business logic or polluting unrelated regressions.
