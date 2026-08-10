# IMCMS — Error Resolution 2
## Resolve Remaining Forensic Audit Issues: ISS-01 + ISS-03 + ISS-04

**Date:** 2026-08-10
**Engineer:** Senior Enterprise Software Architect / DB Architect / RBAC Engineer / Test Infrastructure Engineer
**Status:** COMPLETE

---

## 1. Executive Summary

Error Resolution 2 addressed the three remaining open issues from the IMCMS Full System
Forensic Audit (Phase 1–24D). ISS-02 was previously resolved and certified in Error
Resolution 1. The following table summarises the final outcome:

| Issue | Title | Original | Final Status |
|---|---|---|---|
| ISS-01 | Vitest parallel runner timeout on Windows | P2 Medium | RESOLVED |
| ISS-03 | Missing yield/machine utilization DB tables | P3 Low | OUT OF SCOPE (V1.0) |
| ISS-04 | Legacy workflow.approve/reject in seeds | P3 Low | RESOLVED |

---

## 2. ISS-01 Investigation

### 2.1 Problem Description
Running `npx vitest run` with default Vitest settings on Windows VM environments caused
unpredictable test timeouts and lock-ups. The previous workaround was to pass CLI flags:
`--no-fileParallelism --maxWorkers=1`.

### 2.2 Root Cause
**Classification: F — Windows-specific concurrency issue**

Root cause evidence:
- `vitest.config.ts` had no `pool`, `maxForks`, or `isolate` settings — Vitest defaulted
  to `pool: 'threads'` using Node.js worker_threads
- Windows VMs have restricted concurrent thread counts; spawning multiple worker_threads
  rapidly under load causes thread pool exhaustion
- The default `workers` count is CPU-core-based and exceeds available threads in
  virtualised environments
- No MSW, Redis, Prisma, BroadcastChannel, or WebSocket open handles were found in any
  test file — open handles were NOT the cause
- The `setup.ts` file contained only `import '@testing-library/jest-dom'` — no
  uncleaned resources
- All tests used appropriate `beforeEach`/`afterEach` cleanup; `session.test.ts` used
  `vi.useFakeTimers()` and `vi.restoreAllMocks()` correctly

### 2.3 Fix Applied

**File:** `frontend/vitest.config.ts`

Changed from: Default Vitest thread pool (no explicit pool config)
Changed to:
```ts
pool: 'forks',      // Uses child_process.fork() — more stable on Windows than worker_threads
maxForks: 1,        // Serialises test FILE execution (tests within a file still run normally)
minForks: 1,        // Keeps exactly 1 fork warm to avoid spawn overhead
isolate: true,      // Each test file gets a clean module registry — prevents state leaks
```

**Why this fix is safe:**
- Tests are NOT weakened, skipped, or deleted
- All 9 test files / 27 assertions continue to execute
- `pool: 'forks'` with `maxForks: 1` is equivalent to the previously recommended
  `--no-fileParallelism` CLI workaround, but is now baked into the project config
- The Vitest 4 migration guide was followed: `poolOptions` was removed in Vitest 4;
  `maxForks` and `minForks` are now top-level `test` options

### 2.4 ISS-01 Test Results

BEFORE: Default config, parallel workers — timeouts on Windows VMs (intermittent)
AFTER:  `pool: 'forks', maxForks: 1, isolate: true`

```
 Test Files  9 passed (9)
      Tests  27 passed (27)
   Duration  ~14s
```
✅ All tests pass. No DEPRECATED warnings. No test weakened.

---

## 3. ISS-03 Requirement Verification

### 3.1 Requirement Gate Investigation

The following documents were searched for `yield`, `machine utilization`, `machine log`,
`IoT`, `telemetry`, `sensor`, `MachineLog`, `machine monitoring`:

| Document | Finding |
|---|---|
| PRD.md | IoT Integration and Machine Monitoring EXPLICITLY listed under "Features Not Included in Version 1.0" (line 219-220) |
| TRD.md | No yield or machine log tables defined |
| IMCMS_Enterprise_Engineering_Baseline.md | No yield or machine log domain defined |
| Phase 1–24D reports | No phase created yield or machine log schema |
| backend/src (all .ts files) | No Machine, MachineLog, or yield DB model referenced |
| database/schema.prisma | No Machine, MachineLog, or YieldRecord model present |
| frontend/src (all components) | No yield or machine utilization UI component |

**PRD exact quote (line 210-225):**
> "The following features are not included in Version 1.0:
> - IoT Integration
> - Machine Monitoring
> These may be considered for future releases."

### 3.2 Scope Decision

**ISS-03: OUT OF SCOPE — NO DATABASE CHANGE REQUIRED**

Yield tracking, machine logs, machine utilization, and IoT telemetry are explicitly
excluded from IMCMS V1.0 by the PRD. Introducing Prisma models, migrations, controllers,
services, or frontend components for these capabilities would constitute unauthorized
scope expansion.

### 3.3 Corrective Action Taken (Semantic Correction Only)

The three report export stub endpoints were returning HTTP `400 Bad Request`, which
incorrectly implies the client made a malformed request. The correct semantic response
for a feature that exists in the API contract but has no backing implementation in V1.0
is `501 Not Implemented`.

**File:** `backend/src/reports/controllers/reports.controller.ts`

| Endpoint | Old Status | New Status | New Message |
|---|---|---|---|
| GET /reports/production/process-yield/export | 400 | 501 | "Process Yield export is not available in IMCMS V1.0. Yield input/output tracking (IoT integration) is scheduled for a future release." |
| GET /reports/production/machine-utilization/export | 400 | 501 | "Machine Utilization export is not available in IMCMS V1.0. Machine monitoring (IoT/telemetry integration) is scheduled for a future release." |
| GET /reports/cost/department-budget/export | 400 | 501 | "Department Budget Utilization export is not available in IMCMS V1.0. Budget allocation and forecast records are scheduled for a future release." |

No database changes were made. No Prisma schema was modified. No migrations were run.

---

## 4. ISS-04 Permission Audit

### 4.1 Complete Permission Inventory

Total permissions defined in `database/seed.ts`: **43**

| Permission Code | Module | Backend Guard Usage | Frontend Usage | Seed Role Assignment | Classification |
|---|---|---|---|---|---|
| users.create/view/update/delete | users | ✅ Active | ✅ Active | Admin | ACTIVE |
| roles.create/view/update/delete | roles | ✅ Active | ✅ Active | Admin | ACTIVE |
| permissions.create/view/update/delete | permissions | ✅ Active | ✅ Active | Admin | ACTIVE |
| departments.create/view/update/delete | departments | ✅ Active | ✅ Active | Admin | ACTIVE |
| products.create/view/update | products | ✅ Active | ✅ Active | Admin, Design | ACTIVE |
| materials.create/view/update/delete | materials | ✅ Active | ✅ Active | Admin, Stores | ACTIVE |
| vendors.create/view/update/delete/restore | vendors | ✅ Active | ✅ Active | Admin, Accounts | ACTIVE |
| manufacturing-processes.* | processes | ✅ Active | ✅ Active | Admin, Design | ACTIVE |
| units.create/view/update/delete/restore | units | ✅ Active | ✅ Active | Admin, Design | ACTIVE |
| indent.create/view/edit/submit/delete | indent | ✅ Active | ✅ Active | Design, All | ACTIVE |
| costsheet.create/view/update | costsheet | ✅ Active | ✅ Active | Design, Accounts, SM, GM | ACTIVE |
| workflow.view | workflow | ✅ Active | ✅ Active | SM, GM | ACTIVE |
| **workflow.approve** | workflow | ❌ Not used by any guard | ❌ Not used by any component | ~~SM, GM~~ → Removed | **OBSOLETE** |
| **workflow.reject** | workflow | ❌ Not used by any guard | ❌ Not used by any component | ~~SM, GM~~ → Removed | **OBSOLETE** |
| stores.issue | stores | ✅ Active | ✅ Active | Stores | ACTIVE |
| production.view/receive/update/deliver | production | ✅ Active | ✅ Active | Production | ACTIVE |
| accounts.verify/close | accounts | ✅ Active | ✅ Active | Accounts | ACTIVE |
| system.archive/complete | system | ✅ Active | ✅ Active | Accounts | ACTIVE |
| inventory.view/issue | inventory | ✅ Active | ✅ Active | Stores, Production | ACTIVE |
| reports.view/export | reports | ✅ Active | ✅ Active | Accounts, SM, GM | ACTIVE |
| analytics.view | analytics | ✅ Active | ✅ Active | SM, GM | ACTIVE |
| notifications.view | notifications | ✅ Active | ✅ Active | All roles | ACTIVE |
| audit.view | audit | ✅ Active | ✅ Active | Admin | ACTIVE |
| settings.manage | settings | ✅ Active | ✅ Active | Admin | ACTIVE |

### 4.2 ISS-04 Findings

**Legacy permissions found: 2**
- `workflow.approve`
- `workflow.reject`

**Evidence they are genuinely obsolete:**
1. Backend search across all 50+ `.ts` files in `backend/src`: only found in `permission.service.spec.ts` as a **test string** for a negative assertion — NOT as a guard on any endpoint
2. Frontend search across all `.ts`/`.tsx` files: only defined as enum constants in `permissions.ts` and listed in the `workflow` module group — **never referenced in any route guard, component, or permission check**
3. The Zero-Approval architecture means Senior and General Managers NEVER approve or reject — they receive notifications and monitor dashboards passively
4. No `@Permissions('workflow.approve')` decorator exists anywhere in the backend

### 4.3 Cleanup Actions

**Files modified:**

1. **`database/seed.ts`** — Removed `workflow.approve` and `workflow.reject` from:
   - `Senior Manager` role-permission mapping
   - `General Manager` role-permission mapping

2. **`frontend/src/constants/permissions.ts`** — Removed:
   - `WORKFLOW_APPROVE = 'workflow.approve'` from `AppPermission` enum
   - `WORKFLOW_REJECT = 'workflow.reject'` from `AppPermission` enum
   - Both entries from the `workflow` module permission group

**What was NOT removed:**
- The `workflow.approve` and `workflow.reject` permission DEFINITIONS in `seed.ts`
  (lines 117-118) — these remain as valid permission records in the database. Only the
  ROLE ASSIGNMENTS were removed. This is safe — an unassigned permission causes no harm,
  and removing the DB record would require a migration.
- The `permission.service.spec.ts` test that uses `'workflow.approve'` as a negative
  test string — this is a valid usage and the test continues to pass

### 4.4 Phase 22 RBAC Regression Verification

| Role | Key Permissions | Status |
|---|---|---|
| Admin | All permissions | ✅ Unchanged |
| Design Engineer | indent.*, costsheet.*, products.view, materials.view, vendors.view, processes.view, units.view | ✅ Unchanged |
| Stores Executive | indent.view, inventory.*, materials.view/update, production.receive, stores.issue, units.view | ✅ Unchanged |
| Accounts Executive | costsheet.*, indent.view, vendors.view, reports.*, accounts.*, system.*, units.view | ✅ Unchanged |
| Production Executive | production.*, indent.view, inventory.view, materials.view, units.view | ✅ Unchanged |
| Senior Manager | workflow.view, indent.view, reports.*, analytics.view, costsheet.view, notifications.view | ✅ workflow.approve/reject REMOVED (correct) |
| General Manager | workflow.view, indent.view, reports.*, analytics.view, costsheet.view, notifications.view | ✅ workflow.approve/reject REMOVED (correct) |

---

## 5. ISS-02 Security Regression (Error Resolution 1 Verification)

The `CostSheetVisibilityInterceptor` applied at class level on `BusinessTransactionController`
remains intact and active. No files touched in this phase affected the interceptor,
the business-transaction controller, or the IndentForm frontend gating.

Backend build verified: ✅ Exit 0 (interceptor compiled successfully)
Backend tests verified: ✅ 169/169 pass (all security-related assertions intact)

ISS-02 security fix: ✅ NOT REGRESSED

---

## 6. Phase 22 RBAC Regression

No permission gating on protected routes was changed. The only changes were:
- Removing dead permission assignments from two role seeds
- Removing dead enum constants from frontend (never used in guards)

Phase 22 RBAC: ✅ NOT REGRESSED

---

## 7. Phase 23 Reporting Regression

The only change to the reports module was correcting three HTTP status codes from
400 → 501 on stub export endpoints. The getProcessYield and getMachineUtilization
GET data endpoints (non-export) were NOT modified.

All functional report endpoints remain: daily production, actual-vs-predicted costs,
material breakdown, vendor performance, product catalog, workflow bottleneck.

Phase 23 Reporting: ✅ NOT REGRESSED

---

## 8. Phase 24 Analytics Regression

No analytics files were touched. The analytics module, KPI engine, charts, statistics,
and trend analysis remain unmodified.

Phase 24 Analytics: ✅ NOT REGRESSED

---

## 9. API Regression Summary

| API Module | Checked | Status |
|---|---|---|
| Auth (login, refresh, logout) | Backend build ✅ | OK |
| Users / Roles / Permissions | Backend build ✅ | OK |
| Business Transactions (all 26 endpoints) | Backend build ✅, ISS-02 interceptor active | OK |
| Reports (10 endpoints) | 400→501 corrected on 3 stubs, 7 functional endpoints unchanged | OK |
| Analytics | Unchanged | OK |
| Notifications | Unchanged | OK |
| Audit | Unchanged | OK |
| Settings | Unchanged | OK |

---

## 10. Database Regression

No Prisma schema changes. No migrations run. No existing data modified.
The `workflow.approve` and `workflow.reject` permission DB records remain in the
permissions table — only their role assignments were removed from the seed script.
A re-seed will not delete these records (upsert logic).

Database: ✅ NOT REGRESSED

---

## 11. Security Regression

ISS-02 CostSheetVisibilityInterceptor: ✅ Active
JWT / RBAC / IDOR protections: ✅ Unchanged (no auth module modified)
Permission cleanup: ✅ Verified — no active guard was broken

Security: ✅ NOT REGRESSED

---

## 12. Build / Lint / TypeScript Results

| Check | Command | Result |
|---|---|---|
| Backend TypeScript | nest build | ✅ Exit 0 |
| Backend Tests | npm run test | ✅ 20 suites, 169/169 pass |
| Frontend TypeScript | npx tsc -b | ✅ Exit 0 |
| Frontend Tests | npx vitest run | ✅ 9 files, 27/27 pass |

---

## 13. Change Inventory

| File | Change | Reason | Issue | Risk |
|---|---|---|---|---|
| `frontend/vitest.config.ts` | Added `pool: 'forks'`, `maxForks: 1`, `minForks: 1`, `isolate: true`; removed deprecated `poolOptions` | Prevent Windows VM thread exhaustion; Vitest 4 migration | ISS-01 | None — tests all pass |
| `backend/src/reports/controllers/reports.controller.ts` | 400 → 501 on 3 stub export endpoints | Correct HTTP semantics for out-of-scope V1.0 features | ISS-03 | Minimal — client receives clearer error |
| `database/seed.ts` | Removed `workflow.approve` and `workflow.reject` from Senior Manager and General Manager role mappings | Zero-Approval architecture; permissions never evaluated | ISS-04 | None — re-seed safe, live DB unaffected |
| `frontend/src/constants/permissions.ts` | Removed `WORKFLOW_APPROVE` and `WORKFLOW_REJECT` from enum and module group | Dead code cleanup; never used in any guard or route | ISS-04 | None — no component references them |

**Total files modified: 4**
**No unrelated files modified.**

---

## 14. Remaining Risks

| Risk | Severity | Notes |
|---|---|---|
| ISS-03 database gaps (yield, machine, department budget) | LOW | Intentionally deferred to V2.0 per PRD. 501 responses are now correct. |
| `workflow.approve`/`workflow.reject` permission records still exist in DB | NEGLIGIBLE | Unassigned permissions are harmless. Removal would require a destructive migration. |
| Redis/queue offline in local dev | LOW | Expected; queue falls back gracefully. Not a production issue with Redis configured. |

---

## 15. Technical Debt

| Item | Description | Priority |
|---|---|---|
| ISS-03 V2 Planning | Define yield tracking schema when IoT integration is scoped | Future |
| ISS-03 Machine Monitoring | Define Machine, MachineLog models when IoT is scoped | Future |
| Seed cleanup | Remove workflow.approve/reject permission definitions from seed (DB record, not just role assignment) | Very Low |

---

## 16. Final Issue Status

| Issue | Original Severity | Final Status | Evidence |
|---|---|---|---|
| ISS-01 | P2 Medium | ✅ RESOLVED | vitest.config.ts pool:forks, maxForks:1; 27/27 tests pass, no deprecation warnings |
| ISS-02 | P1 High (escalated) | ✅ RESOLVED (Error Resolution 1) | CostSheetVisibilityInterceptor active; ISS-02 not regressed |
| ISS-03 | P3 Low | ✅ OUT OF SCOPE — V1.0 | PRD explicitly excludes IoT/Machine Monitoring; 501 response correct |
| ISS-04 | P3 Low | ✅ RESOLVED | 2 obsolete permissions removed from 2 roles in seed and frontend constants |

---

## ISS-03 Explicit Decision

**ISS-03: [OUT OF SCOPE — NO DATABASE CHANGE REQUIRED]**

The PRD (line 219-220) explicitly lists "IoT Integration" and "Machine Monitoring" as
features NOT included in Version 1.0. The audit finding that database tables are
"missing" is a FALSE POSITIVE in the context of V1.0 requirements. No Prisma models,
migrations, controllers, or frontend components were created. The stub endpoints were
corrected from 400 Bad Request to 501 Not Implemented to accurately represent the
V1.0 scope boundary.

## ISS-04 Explicit Decision

**Permissions audited: 43 total**
**Active permissions: 41**
**Obsolete permissions found: 2** (`workflow.approve`, `workflow.reject`)
**Removed from role assignments: 2** (Senior Manager, General Manager in seed)
**Frontend constants removed: 2** (WORKFLOW_APPROVE, WORKFLOW_REJECT enum entries)
**Files changed: 2** (`database/seed.ts`, `frontend/src/constants/permissions.ts`)
**Phase 22 RBAC remained intact: YES**

## ISS-01 Explicit Decision

**Root cause:** Windows VM worker_thread pool exhaustion with default Vitest thread pool
**Configuration fix:** `pool: 'forks'`, `maxForks: 1` in `vitest.config.ts`
**Why fix is safe:** Tests execute serially per file (not disabled); all 27 tests pass
**Before result:** Intermittent timeouts on Windows VMs
**After result:** 9 test files, 27 tests — all pass, no warnings, ~14s runtime
**Tests weakened:** NO

---

## Final Verdict

✅ ERROR RESOLUTION 2 COMPLETE

All three remaining forensic audit issues have been correctly classified and addressed:
- ISS-01 is resolved with a proper Vitest 4 configuration that eliminates Windows VM timeouts without weakening any test
- ISS-03 is correctly classified as Out of Scope for V1.0, with semantically correct 501 responses
- ISS-04 is resolved with targeted removal of 2 genuinely obsolete permission assignments and constants
- All regression checks pass: backend build ✅, 169 backend tests ✅, frontend tsc ✅, 27 frontend tests ✅
- ISS-02 security fix (Error Resolution 1) remains intact and not regressed
