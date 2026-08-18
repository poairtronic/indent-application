# IMCMS Phase 3 Implementation Report
**Phase 3: Business Logic, Calculations & Inventory Correction**

---

## Executive Summary

Phase 3 of the 5-Phase Application Correction Program for the **Enterprise Manufacturing Indent & Costing Management System (IMCMS)** has been completed successfully.

In strict conformance with the Phase 3 boundary instructions, remediation was applied **exclusively** to the four primary defects identified in `IMCMS_MASTER_ERROR_AUDIT_PHASE1.md`:
1. **`BUG-REQ-001`**: Stores raw material stock verification and atomic decrement during material issue (`storesIssueMaterials` and item-level `issueSingleMaterialItem`).
2. **`BUG-FIN-001`**: Exact financial decimal precision (`Decimal(18, 4)`) replacing floating-point arithmetic across predicted costs, actual costs, process costs, global costs, grand totals, and variances.
3. **`BUG-CALC-001`**: Report currency localization in Excel and PDF exports dynamically utilizing configured system currency (`₹` / `$` / `€`), eliminating hardcoded `$`.
4. **`BUG-KPI-001`**: Stalled transaction metric calibration in Analytics based on duration in the **current workflow state** (`WorkflowHistory.movedAt` / `createdAt` > 7 days) rather than `indent.updatedAt`.

All later phase defects (`BUG-UI-001` through `BUG-UI-006`, `BUG-DEAD-001`, `BUG-DEAD-002`) remain untouched for execution in Phases 4 and 5.

---

## 1. BUG-REQ-001: Stores Material Issue Stock Verification & Decrement

### 1.1 Root Cause
`storesIssueMaterials()` and `issueSingleMaterialItem()` in `backend/src/business-transaction/services/business-transaction.service.ts` previously updated `IndentItem.status` to `ISSUED` and moved the workflow state machine to `MATERIALS_ISSUED`, but failed to decrement `Material.currentStock` in the database.

### 1.2 Stock Model & Atomic Verification
- Within the Prisma transaction:
  - Fetches all active `IndentItem` records with their linked `Material`.
  - For each un-issued item, checks `Number(material.currentStock) >= Number(item.quantity)`.
  - If stock is insufficient (`currentStock < requiredQty`), rejects the entire operation immediately with `BadRequestException` without updating state or marking items as issued.
  - Decrements `Material.currentStock` atomically:
    ```ts
    const updatedMaterial = await prisma.material.update({
      where: { id: material.id },
      data: {
        currentStock: { decrement: item.quantity },
        updatedBy: userId,
      },
    });
    if (Number(updatedMaterial.currentStock) < 0) {
      throw new BadRequestException(`Stock cannot be negative for material '${material.materialName}'.`);
    }
    ```
  - State machine transition is guarded by optimistic locking (`assertCurrentStateAndUpdate`), preventing duplicate issue calls from double-deducting stock.
  - Item-level issue (`issueSingleMaterialItem`) verifies single item stock, checks if the item was already issued (throws `BadRequestException` if duplicate), decrements stock, and triggers stage transition if all items become issued.

### 1.3 Concurrency & Duplicate Protection
- **Test A (Stock = 100, Issue = 30):** Stock becomes 70.
- **Test B (Stock = 30, Issue = 30):** Stock becomes 0.
- **Test C (Stock = 30, Issue = 31):** Rejected with `BadRequestException`, stock remains 30, workflow state unchanged.
- **Test D (Duplicate Issue):** Subsequent attempt against issued item rejected; no second deduction.
- **Test E (Concurrent Issue):** Simultaneous requests driven negative are aborted safely.

---

## 2. BUG-FIN-001: Financial Decimal Precision

### 2.1 Root Cause
Native JavaScript floating-point arithmetic (e.g. `actualRate * actualQuantity`, `actualTotal - predictedTotal`) was used in `createTransaction`, `updateDraftTransaction`, `enterActualCosts`, and `updateMaterialActualCosts`, causing potential IEEE-754 floating-point representation drift (e.g., `0.1 + 0.2 = 0.30000000000000004`).

### 2.2 Decimal Strategy & Implementation
- Created `backend/src/business-transaction/utils/financial-math.util.ts` leveraging `Prisma.Decimal` (Decimal.js engine):
  - `safeMultiply(a, b, decimals = 4)`: Exact multiplication with half-up rounding to 4 decimal places.
  - `safeAdd(values, decimals = 4)`: Exact summation of arbitrary cost arrays.
  - `safeSubtract(a, b, decimals = 4)`: Exact subtraction for variances.
  - `safeVariancePercentage(variance, predicted, decimals = 2)`: Safe percentage with zero/negative denominator guard (returns 0 instead of `NaN` or `Infinity`).
  - `roundTo4Decimals(value)`: Quantizes input to 4 decimal places.
- Updated all cost calculation paths in `BusinessTransactionService`:
  - `createTransaction`: Material predicted amounts, global costs, predicted totals.
  - `updateDraftTransaction`: Material predicted amounts, global costs, predicted totals.
  - `enterActualCosts`: Material actual amounts, process actual costs and variances, actual global costs (design, overhead, contingency), actual total, variance amount, and variance percentage.
  - `updateMaterialActualCosts`: Item actual amount, recalculated actual total, variance amount, and variance percentage.

### 2.3 Edge Case Verifications
- `0.1 * 0.2` = `0.02` (exact, 0 drift).
- `0.1 + 0.2` = `0.3` (exact, 0 drift).
- `predictedTotal = 0`: Returns `0%` variance without division by zero.
- Large and tiny numbers (`999999.9999`, `0.0001`) verified.

---

## 3. BUG-CALC-001: Report Currency Localization

### 3.1 Currency Source & Detection
- Added `getSystemCurrency()` to `backend/src/reports/services/reports.service.ts`:
  - Inspects `process.env.DEFAULT_CURRENCY || process.env.SYSTEM_CURRENCY || 'INR'`.
  - Returns `{ symbol: string, code: string, numFmt: string }`:
    - `INR`: Symbol `₹`, Code `INR`, numFmt `[$₹-439] #,##0.00`
    - `USD`: Symbol `$`, Code `USD`, numFmt `$#,##0.00`
    - `EUR`: Symbol `€`, Code `EUR`, numFmt `€#,##0.00`

### 3.2 Excel and PDF Report Remediation
- `ReportsService.generateExcel`: Applies `cell.numFmt = currency.numFmt` dynamically to all currency columns.
- `ReportsService.generatePdf`: Formats currency values as `${currency.symbol}${val.toFixed(2)}`.
- `ReportsController`: Dynamic headers in PDF export tables (`Planned (${currency.symbol})`, `Actual (${currency.symbol})`, `Variance (${currency.symbol})`, `Est. Amt (${currency.symbol})`, `Act. Amt (${currency.symbol})`).

---

## 4. BUG-KPI-001: Stalled Transaction KPI Metric

### 4.1 Root Cause & Correction
- **Original Formula:** `this.prisma.indent.count({ where: { isDeleted: false, status: { in: ACTIVE_STATUSES }, updatedAt: { lte: 7_DAYS_AGO } } })`.
- **Defect:** Unrelated edits (e.g. updating notes, attachments, user assignments) modified `updatedAt`, resetting the stalled age counter and causing under-counting of genuinely stalled transactions.
- **Corrected Formula:**
  - Active non-deleted indents are queried with their latest `WorkflowHistory` record (`orderBy: { movedAt: 'desc' }, take: 1, select: { movedAt: true }`) and `createdAt`.
  - State entry timestamp is determined by `latestWorkflowHistory.movedAt ?? indent.createdAt`.
  - Transaction is counted as stalled if `NOW - stateEntryTimestamp > 7 days` (604,800,000 ms).
  - Unrelated record updates changing `updatedAt` no longer reset the stalled age.

---

## 5. Files Changed

| File Path | Type | Reason |
| :--- | :---: | :--- |
| `backend/src/business-transaction/utils/financial-math.util.ts` | **NEW** | Precise decimal arithmetic utilities using `Prisma.Decimal` |
| `backend/src/business-transaction/services/business-transaction.service.ts` | Backend | Implemented atomic stock decrement & safe decimal costing |
| `backend/src/reports/services/reports.service.ts` | Backend | Implemented `getSystemCurrency()` & dynamic currency formatting in Excel/PDF |
| `backend/src/reports/controllers/reports.controller.ts` | Backend | Replaced static `($)` headers with dynamic system currency symbol |
| `backend/src/analytics/analytics.service.ts` | Backend | Calibrated stalled transactions to current workflow state entry age |
| `backend/src/analytics/analytics.service.spec.ts` | Test | Updated unit tests for workflow state entry stalled calculation |
| `backend/src/business-transaction/tests/financial-math.spec.ts` | **NEW** | Unit tests for financial decimal precision (`BUG-FIN-001`) |
| `backend/src/business-transaction/tests/stores-issue-inventory.spec.ts` | **NEW** | Unit tests for stock decrement, units, and concurrency (`BUG-REQ-001`) |
| `backend/src/reports/tests/report-currency.spec.ts` | **NEW** | Unit tests for report currency localization (`BUG-CALC-001`) |
| `backend/package.json` | Config | Added `setupFiles: ["dotenv/config"]` to Jest configuration |

---

## 6. Database Changes

- No schema migrations required for Phase 3 (reused existing `Material.currentStock Decimal @db.Decimal(18, 4)` and `WorkflowHistory.movedAt DateTime`).

---

## 7. Verification & Test Results

### 7.1 Backend Verification
- **TypeScript Compilation:** `npx tsc --noEmit` in `backend/` -> **PASS (0 errors)**
- **Jest Test Suite:** `npm test -- --runInBand` in `backend/` -> **PASS**
  - **Test Suites:** 27 passed, 27 total (including 3 new test suites)
  - **Tests:** 207 passed, 207 total (0 failures)
  - **Snapshots:** 0 total
  - **Execution Time:** ~10.5s
- **Production Build:** `npm run build` in `backend/` (`nest build`) -> **PASS (0 errors)**

### 7.2 Frontend Verification
- **TypeScript Compilation:** `npx tsc --noEmit` in `frontend/` -> **PASS (0 errors)**
- **Vitest Test Suite:** `npm run test:run` in `frontend/` -> **PASS**
  - **Test Files:** 10 passed, 10 total
  - **Tests:** 30 passed, 30 total
  - **Execution Time:** ~9.2s
- **Production Build:** `npm run build` in `frontend/` (`vite build`) -> **PASS (Built in 11.38s, 0 errors)**

---

## 8. Business Regression Verification

- **Two-Loop Zero-Approval Workflow:** Unchanged and strictly intact.
- **Phase 2 Data Model:** Structured customer headers and global cost breakdown fields remain functional and verified.
- **Phase 2 Authentication:** Scoped session revocation on token refresh remains verified.
- **Permissions & RBAC:** Role and department guards remain untouched.
- **Tenant & Concurrency Controls:** Optimistic state locking (`assertCurrentStateAndUpdate`) and non-negative stock invariants verified under concurrent load.

---

## 9. Remaining Issues for Subsequent Phases

### Phase 4 (Frontend UI, Re-renders & Forms)
- `BUG-UI-001`: Missing JSX keys on Dashboard icons array.
- `BUG-UI-002`: Unmemoized inline array fallback in `DashboardPage` `useMemo`.
- `BUG-UI-003`: Unmemoized inline array fallback in `MaterialsPage` `useMemo`.
- `BUG-UI-004`: Missing dependency in `CommandPalette` `useEffect`.
- `BUG-UI-005`: Missing dependency in `DepartmentsPage` `useCallback`.
- `BUG-UI-006`: DatePicker range uncontrolled value warning.

### Phase 5 (Dead Code Cleanup & Final Audit)
- `BUG-DEAD-001`: Remove unused duplicate utility `frontend/src/utils/currency.ts`.
- `BUG-DEAD-002`: Prune empty placeholder backend directories containing only `.gitkeep`.
- Full end-to-end regression validation.
