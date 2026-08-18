# IMCMS Phase 2 Implementation Report
**Phase 2: Foundation Correction Phase**

---

## Executive Summary

Phase 2 of the 5-Phase Application Correction Program for the **Enterprise Manufacturing Indent & Costing Management System (IMCMS)** has been completed successfully.

In strict conformance with the Phase 2 boundary instructions, remediation was applied **exclusively** to the three foundational defects identified in `IMCMS_MASTER_ERROR_AUDIT_PHASE1.md`:
1. **`BUG-DATA-001`**: Structured database storage for customer order metadata and global cost breakdowns.
2. **`BUG-AUTH-001`**: Scoped session revocation on JWT refresh token rotation.
3. **`BUG-DEAD-003`**: Pruning legacy `ApprovalHistory` database structures under the Two-Loop Zero-Approval Architecture.

All later phase defects (`BUG-CALC-001`, `BUG-FIN-001`, `BUG-REQ-001`, `BUG-KPI-001`, `BUG-UI-001` through `BUG-UI-006`, `BUG-DEAD-001`, `BUG-DEAD-002`) remain untouched for execution in Phases 3, 4, and 5.

---

## 1. BUG-DATA-001: Structured Business Data Remediation

### 1.1 Root Cause
The database schema previously lacked dedicated columns for customer header data (`customerName`, `layoutNumber`) on `indents` and global cost structures (`designCost`, `overheadCost`, `contingencyCost`, `actualDesignCost`, `actualOverheadCost`, `actualContingencyCost`) on `cost_sheets`. As a workaround, the frontend and backend serialized these critical fields into a stringified JSON substring stored inside `indent.remarks`. When stage transitions appended unstructured notes to `remarks`, substring extraction and `JSON.parse` risked failing, causing values to default to 0.

### 1.2 Schema Before vs. After

#### Model: `Indent` (`indents` table)
- **Before:**
  ```prisma
  model Indent {
    id                   String   @id @default(uuid()) @db.Uuid
    indentNumber         String   @unique @db.VarChar(50)
    // customerName, layoutNumber NOT PRESENT
    remarks              String?  @db.Text
    // ...
  }
  ```
- **After:**
  ```prisma
  model Indent {
    id                   String   @id @default(uuid()) @db.Uuid
    indentNumber         String   @unique @db.VarChar(50)
    customerName         String?  @db.VarChar(150)
    layoutNumber         String?  @db.VarChar(100)
    remarks              String?  @db.Text
    // ...
    @@index([customerName])
    @@index([layoutNumber])
  }
  ```

#### Model: `CostSheet` (`cost_sheets` table)
- **Before:**
  ```prisma
  model CostSheet {
    id                   String   @id @default(uuid()) @db.Uuid
    predictedTotal       Decimal  @db.Decimal(18, 4)
    actualTotal          Decimal? @db.Decimal(18, 4)
    // designCost, overheadCost, contingencyCost NOT PRESENT
  }
  ```
- **After:**
  ```prisma
  model CostSheet {
    id                   String   @id @default(uuid()) @db.Uuid
    designCost           Decimal  @default(0) @db.Decimal(18, 4)
    overheadCost         Decimal  @default(0) @db.Decimal(18, 4)
    contingencyCost      Decimal  @default(0) @db.Decimal(18, 4)
    actualDesignCost     Decimal? @db.Decimal(18, 4)
    actualOverheadCost   Decimal? @db.Decimal(18, 4)
    actualContingencyCost Decimal? @db.Decimal(18, 4)
    predictedTotal       Decimal  @db.Decimal(18, 4)
    actualTotal          Decimal? @db.Decimal(18, 4)
  }
  ```

### 1.3 Migration & Legacy Data Strategy
- Created SQL migration `database/migrations/20260818000000_phase2_foundation_schema/migration.sql` adding the new columns with proper indexes.
- Created idempotent migration utility `database/migrate-legacy-remarks.ts` that safely inspects existing records, parses legacy JSON remarks, populates the new columns, and cleans up `indent.remarks` to retain only human-readable notes.

### 1.4 API & Backend Service Changes
- Updated `CreateIndentSheetDto` and `UpdateIndentSheetDto` in `backend/src/business-transaction/dto/create-indent-sheet.dto.ts` with validated `customerName` and `layoutNumber`.
- Updated `BusinessTransactionService`:
  - `createTransaction`: Persists `customerName`, `layoutNumber`, `designCost`, `overheadCost`, and `contingencyCost` directly into dedicated table columns.
  - `findTransactionById`: Directly returns structured columns without parsing `remarks`.
  - `findAllTransactions`: Selects and includes `customerName` and `layoutNumber` in list responses and adds search indexing over both columns.
  - `updateDraftTransaction`: Atomically updates structured fields.
  - `enterActualCosts`: Updates `actualDesignCost`, `actualOverheadCost`, `actualContingencyCost` on `CostSheet` directly and appends stage notes to `remarks` cleanly without string splicing JSON.
  - `updateMaterialActualCosts`: Accurately computes totals including structured global actual costs.

### 1.5 Frontend Changes
- `IndentForm.tsx`: Removed `JSON.stringify` on submission. Passes structured fields in the payload. Reads structured fields on form initialization with fallback for legacy unmigrated records.
- `IndentDetails.tsx`: Displays `indent.customerName` and `indent.layoutNumber` directly.
- `IndentList.tsx`: Uses `item.customerName` and `item.layoutNumber` directly across table and grid view modes.
- `indents/service.ts`: Updated TypeScript interfaces (`IndentData`, `CostSheetData`).

---

## 2. BUG-AUTH-001: Scoped Session Revocation on Token Refresh

### 2.1 Root Cause
In `backend/src/auth/services/auth.service.ts`, `executeRefresh` previously called `await this.sessionService.revokeAllSessions(user.id)`. This caused any single token rotation (e.g. Device A refreshing its access token) to evict all other concurrent active sessions for that user on other devices or workstations.

### 2.2 Session Architecture & Remediation
- **Before:**
  ```ts
  await this.tokenService.revokeRefreshToken(refreshToken);
  await this.sessionService.revokeAllSessions(user.id); // Evicts all devices
  ```
- **After:**
  ```ts
  const hashedOldToken = this.tokenService.hashToken(refreshToken);
  await this.tokenService.revokeRefreshToken(refreshToken);
  await this.sessionService.revokeSessionByToken(hashedOldToken, user.id); // Evicts only replaced session
  ```
- Added `revokeSessionByToken(hashedToken: string, userId?: string)` to `SessionService` in `backend/src/auth/services/session.service.ts`.
- Preserved multi-tab single-flight refresh queue and BroadcastChannel synchronization on the frontend.
- Added comprehensive unit tests in `backend/src/auth/services/auth.service.spec.ts` validating that only the caller's session is rotated while other sessions remain ACTIVE.

---

## 3. BUG-DEAD-003: Legacy Approval History Schema Pruning

### 3.1 Dependency Audit & Findings
- Audited all backend controllers, services, repositories, frontend modules, and query hooks.
- Confirmed zero runtime queries or business dependencies on `ApprovalHistory` (pre-Zero-Approval relic).

### 3.2 Schema & Migration
- Removed `ApprovalHistory` model from `database/schema.prisma`.
- Removed `approvals ApprovalHistory[]` relations from `Role`, `User`, and `Indent` models.
- Added `DROP TABLE IF EXISTS "approval_history" CASCADE;` to migration SQL.
- Successfully regenerated Prisma client for root and backend.

---

## 4. Files Changed

| File Path | Type | Description |
| :--- | :---: | :--- |
| `database/schema.prisma` | Schema | Added structured fields, removed `ApprovalHistory` |
| `database/migrations/20260818000000_phase2_foundation_schema/migration.sql` | Migration | SQL schema migration for columns & table drop |
| `database/migrate-legacy-remarks.ts` | Script | Idempotent data backfill & remarks cleanup script |
| `backend/src/auth/services/session.service.ts` | Backend | Added `revokeSessionByToken` method |
| `backend/src/auth/services/auth.service.ts` | Backend | Scoped session revocation in `executeRefresh` |
| `backend/src/auth/services/auth.service.spec.ts` | Test | Added unit tests for refresh session scoping |
| `backend/src/business-transaction/dto/create-indent-sheet.dto.ts` | DTO | Added `customerName`, `layoutNumber` fields |
| `backend/src/business-transaction/services/business-transaction.service.ts` | Backend | Structured storage in transaction operations |
| `frontend/src/api/services/indents/service.ts` | Frontend Type | Updated `IndentData` & `CostSheetData` interfaces |
| `frontend/src/modules/indent/components/IndentForm.tsx` | Frontend Component | Removed JSON remarks encoding, bound structured fields |
| `frontend/src/modules/indent/components/IndentDetails.tsx` | Frontend Component | Display structured customer & layout directly |
| `frontend/src/modules/indent/components/IndentList.tsx` | Frontend Component | Display structured customer & layout in grid/table |

---

## 5. Verification & Test Results

### 5.1 Backend Tests & Builds
- **Prisma Client Generation:** `npx prisma generate --schema=database/schema.prisma` -> **PASSED** (0 errors)
- **Backend TypeScript Compilation:** `npx tsc --noEmit` in `backend/` -> **PASSED** (Exit code 0, 0 errors)
- **Backend Jest Suite:** `npm test -- --runInBand` in `backend/` -> **PASSED**
  - **Test Suites:** 24 passed, 24 total
  - **Tests:** 186 passed, 186 total
  - **Snapshots:** 0 total
  - **Execution Time:** ~10.7s
- **Backend Production Build:** `npm run build` in `backend/` (`nest build`) -> **PASSED** (0 errors)

### 5.2 Frontend Tests & Builds
- **Frontend TypeScript Compilation:** `npx tsc --noEmit` in `frontend/` -> **PASSED** (Exit code 0, 0 errors)
- **Frontend Vitest Suite:** `npm run test:run` in `frontend/` -> **PASSED**
  - **Test Files:** 10 passed, 10 total
  - **Tests:** 30 passed, 30 total
  - **Execution Time:** ~9.5s
- **Frontend Production Build:** `npm run build` in `frontend/` (`vite build`) -> **PASSED** (Built in 7.86s, 0 errors)

---

## 6. Business Regression Verification

- **Two-Loop Zero-Approval Architecture:** Unchanged. All 12 states (`DRAFT` → `DESIGN_COMPLETED` → `STORES_PROCESSING` → `MATERIALS_ISSUED` → `PRODUCTION_PROCESSING` → `PRODUCTION_COMPLETED` → `CUSTOMER_DELIVERED` → `ACCOUNTS_COST_VERIFICATION` → `ACTUAL_COST_UPDATED` → `ACCOUNTS_FINANCIAL_CLOSURE` → `ARCHIVED` → `COMPLETED`) remain strictly intact.
- **Role & Department Permissions:** Unchanged.
- **Tenant & Concurrency Controls:** Optimistic locking via `assertCurrentStateAndUpdate` remains verified and functional.

---

## 7. Remaining Issues for Subsequent Phases

The following issues identified in Phase 1 were strictly excluded from Phase 2 and remain scheduled for future phases:

### Phase 3 (Business Logic, Calculations & Inventory)
- `BUG-CALC-001`: Configurable currency symbol in Excel/PDF report exports.
- `BUG-FIN-001`: Bounded decimal precision rounding before DB writes.
- `BUG-REQ-001`: Stores raw material stock inventory decrement upon issue.
- `BUG-KPI-001`: Stalled transactions metric calculation refinement.

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
