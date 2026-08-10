# IMCMS Forensic Findings Deep-Dive Report
**Project:** Enterprise Manufacturing Indent & Costing Management System (IMCMS)  
**Lead Auditor:** Chief Enterprise Software Architect & Senior Full-Stack Auditor  
**Date:** 2026-08-10  
**Status:** COMPLETE  

---

## 1. Executive Summary
This report presents a second read-only forensic review of the findings discovered during the previous full-system audit of the IMCMS application (Phase 1 to Phase 24D). The goal of this deep-dive is to verify each finding against the live codebase, reassess issue severities, evaluate the business and security impacts, and design a structured three-part remediation plan.

---

## 2. Previous Audit Summary
The previous system-wide audit reported the following findings:
- **P0 Critical:** 0
- **P1 High:** 0
- **P2 Medium:** 2 (Vitest runner VM timeouts, costSheet REST payload data leak)
- **P3 Low:** 2 (Missing database tables for yield/machine utilization, legacy seed permissions)
- **Loops:** 0 critical or high loops.

---

## 3. Complete Finding Inventory
1. **ISS-01:** Vitest VM parallel runner timeouts (Medium)
2. **ISS-02:** Cost sheet data visibility leak in transactional GET responses (Medium - Escalated to High)
3. **ISS-03:** Missing database tables and columns for IoT yield and machine logs (Low)
4. **ISS-04:** Legacy, unused role permissions seeded in database mappings (Low)

---

## 4. P2 Verification

### Finding ISS-01: Vitest VM Parallel Runner Timeouts
- **ID:** ISS-01
- **Severity:** P2 (Medium)
- **Module:** Testing (Frontend)
- **File:** [package.json](file:///c:/Users/Admin/OneDrive/Desktop/indent%20application/frontend/package.json)
- **Function/component:** Test execution script
- **Line/location:** Line 12-13
- **Problem:** Running Vitest with default parallel workers causes memory and thread exhaustion timeouts on Windows VM runner environments.
- **Expected behavior:** Tests execute in parallel and complete successfully.
- **Actual behavior:** Parallel runner locks up or times out on virtualized hosts.
- **Root cause:** Windows VM instances have restricted concurrent thread counts.
- **Impact:** CI/CD builds fail unpredictably on Windows environments.
- **Reproduction steps:** Run `npm run test:run` in a Windows VM.
- **Evidence:** Executing vitest on the host crashes unless constrained serially.
- **Affected users:** QA Lead, Production Reliability Engineer.
- **Affected workflow:** Build and Testing validation.
- **Affected API:** None.
- **Affected database records:** None.
- **Recommended fix:** Constrain Vitest runner to single-thread serial execution via `--no-fileParallelism --maxWorkers=1`.
- **Verdict:** CONFIRMED (Acceptable Test Limitation on virtual hosts).

### Finding ISS-02: Cost Sheet Data Leak in Transactional GET Payload
- **ID:** ISS-02
- **Severity:** P2 (Medium - **ESCALATED TO P1 HIGH**)
- **Module:** Security / RBAC
- **File:** [business-transaction.service.ts](file:///c:/Users/Admin/OneDrive/Desktop/indent%20application/backend/src/business-transaction/services/business-transaction.service.ts)
- **Function/component:** `findTransactionById`
- **Line/location:** Lines 246-251 and Line 313
- **Problem:** The REST API endpoint `GET /api/business-transactions/:id` includes the complete `costSheet` object (containing planned costing totals, actual totals, material rates, and variance amounts) in its response payload. This endpoint is gated only by the general `indent.view` permission claim, which is assigned to all roles (including Design, Stores, and Production Executives). Consequently, unauthorized users can query costing data directly from the API.
- **Expected behavior:** The backend restricts the `costSheet` data, stripping it from the response payload if the user lacks financial clearance.
- **Actual behavior:** The full `costSheet` object is transmitted to all clients holding the `indent.view` claim.
- **Root cause:** Previous agents only hid the cost sheet components at the UI presentation layer, leaving the underlying endpoint unguarded at the REST layer.
- **Impact:** Unauthorized read access of sensitive financial data (planned rate, actual rate, variance) by non-accounts and non-management personnel, violating department isolation rules.
- **Reproduction steps:** Query the transaction detail GET route using a Design Engineer's JWT.
- **Evidence:** Source code query inclusions return `costSheet` without condition checks.
- **Affected users:** Accounts Executive, Design Engineer, Stores Executive, Production Executive.
- **Affected workflow:** DRAFT through COMPLETED workflow states.
- **Affected API:** `GET /api/business-transactions/:id`
- **Affected database records:** `cost_sheets`, `cost_items`, `process_costs`.
- **Recommended fix:** Query the user's role/department inside `findTransactionById`. If the user is not in Admin, ACCT, SMGR, or GMGR, strip or nullify the `costSheet` payload key.
- **Verdict:** CONFIRMED (Real Security Bug).

---

## 5. P3 Verification

### Finding ISS-03: Missing Database Tables for IoT Yield and Machine Logs
- **ID:** ISS-03
- **Severity:** P3 (Low)
- **Module:** Reports (Database Gap)
- **File:** [reports.controller.ts](file:///c:/Users/Admin/OneDrive/Desktop/indent%20application/backend/src/reports/controllers/reports.controller.ts)
- **Function/component:** `exportProcessYield` and `exportMachineUtilization`
- **Problem:** Yield and Machine reports return `400 Bad Request` explaining that database tables for yield inputs/outputs and machine logs are missing.
- **Expected:** The reports return compiled Excel/PDF files from active tables.
- **Actual:** Returns a 400 status error block.
- **Root cause:** Mismatch between early-stage requirements and database schema design (the required tables were never created).
- **Impact:** Operational dashboard components return 400 for these reports.
- **Recommended fix:** Define migrations to introduce yield tracking columns under `IndentItem` and IoT logs tables.
- **Verdict:** CONFIRMED (Real Database Gap).

### Finding ISS-04: Legacy Role Permissions Seeded in Database Mappings
- **ID:** ISS-04
- **Severity:** P3 (Low)
- **Module:** Master Data / Seeds
- **File:** [seed.ts](file:///c:/Users/Admin/OneDrive/Desktop/indent%20application/database/seed.ts)
- **Function/component:** `rolePermissionsMap`
- **Problem:** Seeds assign `workflow.approve` and `workflow.reject` permissions to Senior and General Managers, but these permissions are never evaluated because the workflow state machine operates under a Zero-Approval design.
- **Expected:** Seeds match actual required permissions.
- **Actual:** Legacy permissions are seeded.
- **Root cause:** Unused permissions left in seeds from earlier drafts.
- **Impact:** Clutter in the permission tables.
- **Recommended fix:** Remove `workflow.approve` and `workflow.reject` references from `seed.ts`.
- **Verdict:** CONFIRMED (Dead Code).

---

## 6. Database Schema Gap Verification
- **Process Yield Metrics:** Missing input/output tracking fields on `IndentItem`.
- **Machine logs:** Missing `Machine` and `MachineLog` tables.
- **Department limits:** Missing budget fields.
- **Verification:** Verified by checking [schema.prisma](file:///c:/Users/Admin/OneDrive/Desktop/indent%20application/database/schema.prisma) where no such tables are defined.
- **Verdict:** Gaps are real and require future migrations.

---

## 7. Testing Workaround Verification
- **Workaround:** Constraining Vitest to `--maxWorkers=1`.
- **Verified:** Yes, parallel runner VM timeouts are reproducible on Windows VMs.
- **Classification:** Acceptable Test Limitation for Windows virtual hosts.

---

## 8. Design Observation Verification
- **Zero-Approval:** State transitions are triggered by active worker actions. Managers monitor progress passively.
- **Verdict:** ZERO-APPROVAL IS PRESERVED.

---

## 9. Security Impact
- **ISS-02** allows unauthorized read access of costing totals by Design, Stores, and Production roles.
- **Escalation:** Severity escalated from P2 to P1 (High) because it violates financial confidentiality rules.

---

## 10. Data Integrity Impact
- No write-level data corruption exists. The calculations for variance amounts are correct.

---

## 11. Workflow Impact
- **ISS-02** exposes costing data at all operational states, from `DESIGN_COMPLETED` up to `COMPLETED`.

---

## 12. API Impact
- **ISS-02** affects `GET /api/business-transactions/:id`. It is a backend-only leak, as the service fetches and packs the costing sheet object into the response.

---

## 13. Phase Regression Analysis
- **ISS-02** was introduced in Phase 9/12 and should have been prevented in Phase 20B/22. However, previous validation checks only verified that the UI widgets were hidden, omitting payload-level checks.

---

## 14. False Positive Analysis
- All findings are verified and confirmed; there are no false positives.

---

## 15. Severity Reassessment
- **ISS-02** is escalated to **P1 (High)** due to financial RBAC policy violations.

---

## 16. Final Findings Matrix

| ID | Original Severity | Verified Severity | Finding | Status | Module | Business Impact | Security Impact | Data Impact |
| :--- | :---: | :---: | :--- | :---: | :--- | :--- | :--- | :--- |
| **ISS-01** | `P2` | `P2` | Vitest VM parallel runner timeouts | CONFIRMED | Testing | Test timeouts on Windows VMs | None | None |
| **ISS-02** | `P2` | `P1` | costSheet REST payload data leak | CONFIRMED | Security | Stores/Production can view costs | Unauthorized financial read | Leaks costing sheet totals |
| **ISS-03** | `P3` | `P3` | Missing yield and machine log tables | CONFIRMED | Database | Yield reports return 400 | None | Prevents IoT aggregations |
| **ISS-04** | `P3` | `P3` | Unused role permissions in seeds | CONFIRMED | Seeds | Clutters permission mappings | None | None |

---

## 17. P2 Matrix

| ID | P2 Issue | Evidence | Root Cause | Impact | Fix Required |
| :--- | :--- | :--- | :--- | :--- | :---: |
| **ISS-01** | Vitest parallel runner timeouts | `frontend/package.json` lacks workers constraint | Windows VM thread limits | Windows VM timeouts | **Yes** (CI/CD setting) |

---

## 18. P3 Matrix

| ID | P3 Issue | Evidence | Root Cause | Impact | Fix Required |
| :--- | :--- | :--- | :--- | :--- | :---: |
| **ISS-03** | Missing database tables for reports | reports controller returns 400 | Mismatch in schema requirements | Yield reports disabled | **Yes** (V2 Migration) |
| **ISS-04** | Unused role permissions in seeds | `database/seed.ts` contains approve/reject | Leftover draft rules | Clutter in permissions | **Yes** (Clean setup) |

---

## 19. Database Gap Matrix

| ID | Table | Gap | Requirement | Actual | Severity | Action |
| :--- | :--- | :--- | :--- | :--- | :---: | :--- |
| **GAP-01** | `indent_items` | Yield weight columns | Process yield waste calculations | No columns present | `P3` | Future migration |
| **GAP-02** | `machines` | MachineLog log tables | Machine efficiency reports | No tables present | `P3` | Future migration |

---

## 20. Testing Gap Matrix

| ID | Test | Current Method | Limitation | Risk | Recommended Test |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **TEST-01** | Vitest Run | Sequential execution (`--maxWorkers=1`) | No parallel test runs | Slower CI cycles | Configure Vitest config to auto-handle workers limit |

---

## 21. Production-Critical Fixes
- **ISS-02 (P1):** Restrict costSheet access in transactional GET payloads based on user roles.

---

## 22. Post-Production Fixes
- **ISS-01 (P2):** Configure Vitest configurations for serial runs.
- **ISS-03 (P3):** Add database schema updates for yield and machine tables.

---

## 23. Optional Improvements
- **ISS-04 (P3):** Remove dead approval permissions from seed files.

---

## 24. ERROR RESOLUTION PART 1 PLAN
- **Focus:** Resolve the payload data leak (`ISS-02`) and Vitest runner limits (`ISS-01`).
- **ISS-02 Remediation:**
  - Files: `backend/src/business-transaction/services/business-transaction.service.ts`
  - Changes: Update `findTransactionById` to check the requesting user's department/role. If not ACCOUNTS/ADMIN/SMGR/GMGR, strip the `costSheet` data block from the returned payload.
  - Testing: Add Jest tests verifying that Design / Stores / Production users receive `null` or omit the `costSheet` key on UUID GET.
  - Regression risk: Very low.
- **ISS-01 Remediation:**
  - Files: `frontend/package.json`
  - Changes: Add `--no-fileParallelism --maxWorkers=1` to the `"test:run"` and `"test"` script commands.
  - Regression risk: None.

---

## 25. ERROR RESOLUTION PART 2 PLAN
- **Focus:** Database gaps (`ISS-03`) and seed cleanups (`ISS-04`).
- **Actions:** Define future migration SQLs and prune `database/seed.ts` of unused manager approval mappings.

---

## 26. ERROR RESOLUTION PART 3 PLAN
- **Focus:** Run all unit tests, eslint configs, typechecks, and compile static production bundles to verify code stability.

---

## 27. Final Recommendation
Remediate the REST payload data leak (`ISS-02`) immediately by stripping costing sheet objects from transactional GET responses when queried by unauthorized roles.

---

## 28. Final Deep-Dive Answers

### 1. What are the EXACT 2 P2 bugs?
- **ISS-01:** Vitest VM parallel runner timeouts.
- **ISS-02:** Cost sheet data visibility leak in transactional GET payloads (escalated to P1).

### 2. What are the EXACT 2 P3 bugs?
- **ISS-03:** Missing database tables for yield and machine logs.
- **ISS-04:** Unused role permissions seeded in database mappings.

### 3. Are any actually P0/P1?
Yes. **ISS-02** is escalated to **P1 (High)** due to financial confidentiality and RBAC policy violations.

### 4. Which files are affected?
- `backend/src/business-transaction/services/business-transaction.service.ts`
- `frontend/package.json`
- `database/seed.ts`
- `backend/src/reports/controllers/reports.controller.ts`

### 5. Which database tables are affected?
`cost_sheets`, `cost_items`, `process_costs`.

### 6. Which APIs are affected?
`GET /api/business-transactions/:id`

### 7. Which users/departments are affected?
Design Engineer, Stores Executive, Production Executive.

### 8. Does any issue affect financial calculations?
No.

### 9. Does any issue affect RBAC?
Yes, **ISS-02** leaks cost sheet details to roles without financial permissions.

### 10. Does any issue affect workflow?
No.

### 11. Does any issue affect data integrity?
No.

### 12. Are any database schema changes actually required?
No, the database gaps (yield weight, machine logs) can wait until V2.

### 13. Are the testing workarounds acceptable?
Yes, serial Vitest execution is a standard workaround for Windows VM runners.

### 14. Which issues MUST be fixed before production?
**ISS-02** (the payload data leak) must be fixed before production.

### 15. Which issues can wait?
**ISS-03** (database schema gaps) and **ISS-04** (unused seeds) can wait.

### 16. What should ERROR RESOLUTION PART 1 contain?
Payload costing check filters (`ISS-02`) and Vitest workers config adjustments (`ISS-01`).

### 17. What should ERROR RESOLUTION PART 2 contain?
Future SQL migrations (`ISS-03`) and seed permissions cleanup (`ISS-04`).

### 18. What should ERROR RESOLUTION PART 3 contain?
Verification builds, eslint checks, and regression runs.
