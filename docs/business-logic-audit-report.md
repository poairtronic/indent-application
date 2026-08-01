# Level 3 — Business Logic Audit Report

**System:** IMCMS Indent/Manufacturing ERP
**Date:** 2026-08-01
**Scope:** Business correctness only — workflow/state machine, RBAC, department rules, zero-approval model, notifications, audit trail, cost calculation, transaction lifecycle, analytics, email/retry pipeline, validation, DB integrity, concurrency.
**Method:** Static source read of backend services/validators/DTOs/definitions, `database/schema.prisma`, `database/seed.ts`; cross-referenced with controller decorators and workflow definitions. No runtime execution.

---

## 1. Business Validation Report

### 1.1 RBAC DEADLOCK — Controllers Require Permission Codes That Are Never Seeded [CRITICAL]

The business-transaction controller and workflow stage definitions reference permission codes that **do not exist anywhere in the seed** (`database/seed.ts`) and are created by no other code path:

| Code required by controller/stage defs | Seed status |
|---|---|
| `stores.issue` (controller :114,120,126; stage defs :45,57) | **Missing** (seed has `inventory.issue` instead) |
| `production.update` (controller :132–182; stage defs :69,81) | **Missing** (seed has `production.receive`) |
| `production.deliver` (controller :192,202; stage def :93) | **Missing** |
| `accounts.verify` (controller :62,216–256,311,334,340,346,365; stage defs :105,117) | **Missing** |
| `accounts.close` (controller :267,277; stage def :129) | **Missing** |
| `system.archive` (controller :287; stage def :141) | **Missing** |
| `system.complete` (controller :297; stage def :153) | **Missing** |
| `users.read`, `users.status.update`, `users.restore` (users.controller :46,61,85,112) | **Missing** (seed has `users.view`) |

`PermissionsGuard` (`auth/guards/permissions.guard.ts:34-44`) uses ANY-semantics: `requiredPermissions.some(...)`. Admin gets `Object.values(permMap)` (seed.ts:199) — i.e. **only** the seeded codes. Since none of the codes above are seeded, **no role — including Admin — can ever pass** these guards.

**Business impact:** Every stores/production/accounts/archive/complete workflow endpoint returns `403 Forbidden` for every user. **The entire 2-loop manufacturing/financial workflow is unreachable through the API.** `GET /users`, `PATCH /users/:id/status`, `PATCH /users/:id/restore` are also dead. Zero-approval model cannot execute end-to-end.

> Note the design intent is also inconsistent: seed defines `inventory.issue`/`production.receive`, while controllers+stage definitions use `stores.issue`/`production.update` — two parallel vocabularies that never meet.

### 1.2 Department-Ownership Check Compares CURRENT state owner instead of TARGET [CRITICAL]

`workflow-state-transition.validator.ts:41-48` requires the actor's department to equal the **current** state's `owningDepartmentCode`. But every transition hand-off is performed by the *next* department (target owner), not the current owner. Verified against `workflow-state-machine.definition.ts` and service call sites (`business-transaction.service.ts`):

| Transition | currentDef.owner | dept passed | Validator result |
|---|---|---|---|
| MATERIALS_ISSUED → PRODUCTION_PROCESSING (`productionReceiveMaterials` :617) | STORES | PRODUCTION | **FAIL** — `STORES !== PRODUCTION` |
| CUSTOMER_DELIVERED → ACCOUNTS_COST_VERIFICATION (`startAccountsVerification` :872) | PRODUCTION | ACCOUNTS | **FAIL** — `PRODUCTION !== ACCOUNTS` |
| ACCOUNTS_FINANCIAL_CLOSURE → ARCHIVED (`archiveTransaction` :1215) | ACCOUNTS | SYSTEM | **FAIL** — `ACCOUNTS !== SYSTEM` |
| ARCHIVED → COMPLETED (`completeTransaction` :1264) | SYSTEM | SYSTEM | PASS (SYSTEM exempt) |
| STORES_PROCESSING → MATERIALS_ISSUED (`storesIssueMaterials` :537) | STORES | STORES | PASS |
| PRODUCTION_PROCESSING → PRODUCTION_COMPLETED (`productionCompleteWork` :756) | PRODUCTION | PRODUCTION | PASS |
| PRODUCTION_COMPLETED → CUSTOMER_DELIVERED (`deliverToCustomer` :806) | PRODUCTION | PRODUCTION | PASS |
| ACCOUNTS_COST_VERIFICATION → ACTUAL_COST_UPDATED (`enterActualCosts` :929) | ACCOUNTS | ACCOUNTS | PASS |
| ACTUAL_COST_UPDATED → ACCOUNTS_FINANCIAL_CLOSURE (`financialClosure` :1156) | ACCOUNTS | ACCOUNTS | PASS |
| DRAFT → DESIGN_COMPLETED (`submitDesign` :385) | DESIGN | DESIGN | PASS |

**Business impact:** 3 of 10 transitions are impossible even after the RBAC is fixed: Production can never confirm material receipt, Accounts can never start cost verification, and the transaction can never be archived. The validator's ownership model is inverted for hand-offs. (This mirrors Level 2 finding; here confirmed against all 10 call sites.)

### 1.3 Zero-Approval Model — No Approval Step Exists [INFO]

Consistent with "zero-approval" architecture: there is no approval/rejection step anywhere; `IndentStatus.APPROVED` is used as the persistence label for `CUSTOMER_DELIVERED` (see 1.5). `workflow.approve`/`workflow.reject` permissions are seeded but attached to no controller endpoint — dead permissions.

### 1.4 Notification Recipient Resolution Defect [HIGH]

`business-transaction-event.service.ts:36-60` resolves recipients by:
1. role `roleName in ['Senior Manager','General Manager','ADMIN','System Administrator']`
2. `rule.targetDepartmentCode`

Problems verified:
- **Role-name coupling:** seed roles are `Senior Manager`, `General Manager`, `Admin` (seed.ts:158-189). `'ADMIN'` and `'System Administrator'` do not exist → that branch matches nothing; seeded `Admin` role name is `'Admin'` (not `'ADMIN'`) so it is **not** included either. Notifications silently skip Admin.
- **Department-code mismatch:** rules use codes `STORES`, `PRODUCTION`, `ACCOUNTS`, `SYSTEM` (`notification-event.definition.ts:18,37,66,95`) but seed departments are `STOR`, `PROD`, `ACCT`, `SMGR`, `GMGR` (seed.ts:24-47). `'STORES' !== 'STOR'` → target-department branch finds **no users**; only the role branch (SM/GM) fires. Stores/Production/Accounts staff never get in-app notifications.

### 1.5 IndentStatus ↔ WorkflowState Mapping Is Lossy / Destructive [HIGH]

Verified in `workflow-state.mapper.ts`:
- `MATERIALS_ISSUED` and `STORES_PROCESSING` both persist as `PENDING_STORES` (:13-14); recovered only by string-matching `remarks.includes('[MATERIALS_ISSUED]')` (:43-50). **State is derived from free-text remarks** — editing/omitting remarks corrupts state.
- `PRODUCTION_COMPLETED` and `PRODUCTION_PROCESSING` both → `IN_PRODUCTION` (:15-16), recovered via `[PRODUCTION_COMPLETED]` remark.
- `ACTUAL_COST_UPDATED` and `ACCOUNTS_COST_VERIFICATION` both → `PENDING_ACCOUNTS` (:18-19), recovered via `[ACTUAL_COST_UPDATED]` remark.
- `CUSTOMER_DELIVERED` → `APPROVED` (:16): "delivered" and "approved" are semantically different but collapse; analytics label calls it "Customer Delivered" (`analytics.service.ts:35`).
- `ACCOUNTS_FINANCIAL_CLOSURE` → `PENDING_SENIOR_MANAGER` (:19) and `ARCHIVED` → `PENDING_GENERAL_MANAGER` (:20): archived transactions still look "pending approval" in the DB.
- `REJECTED` → `DRAFT` and `CANCELLED` → `DRAFT` (:34-35): **destructive fallback** — a rejected/cancelled transaction silently reappears as an editable DRAFT.
- `toPrisma`/`toDomain` both fall back to `DRAFT` for unknown values (:39,67) — silent data-classification loss.

### 1.6 Analytics Status Semantics [MEDIUM]

`analytics.service.ts:47-54` treats `APPROVED` (= CUSTOMER_DELIVERED) and `PENDING_SENIOR_MANAGER` (= ACCOUNTS_FINANCIAL_CLOSURE) as "active". Semantically these are closed stages (loop-1 boundary / financial closure done), so "active pipeline" counts are inflated. `PENDING_GENERAL_MANAGER` (= ARCHIVED) is correctly excluded from both active and pending.

### 1.7 Document Number Collision Risk [MEDIUM]

`business-transaction.service.ts:39-46`: `Date.now().toString().slice(-6)` + 4 random digits → `IND-xxxxxx-xxxx`. `indentNumber` is `@unique` (schema :498). Under concurrent creates within the same millisecond (or high throughput), collisions raise an unhandled Prisma `P2002` → 500. No retry/uniqueness loop. Medium probability in bursty create scenarios.

### 1.8 Backdated Required-Date Allowed [LOW]

`indent-sheet.validator.ts:40-41` only warns when `requiredDate` is in the past — a required delivery date earlier than today is accepted. Business-rule severity: low (often intentionally backdated), but flagged.

---

## 2. Workflow Report

### 2.1 Stage Graph (from `workflow-state-machine.definition.ts`)

Verified chain: DRAFT → DESIGN_COMPLETED → STORES_PROCESSING → MATERIALS_ISSUED → PRODUCTION_PROCESSING → PRODUCTION_COMPLETED → CUSTOMER_DELIVERED → ACCOUNTS_COST_VERIFICATION → ACTUAL_COST_UPDATED → ACCOUNTS_FINANCIAL_CLOSURE → ARCHIVED → COMPLETED.

- 12 domain states; 11 Prisma `IndentStatus` values (no `ARCHIVED` equivalent; PENDING_GENERAL_MANAGER used as substitute).
- Stage defs carry `requiredPermissionCode` (:45,57,69,81,93,105,117,129,141,153) that **no endpoint enforces** — endpoints use `@Permissions` with *different* codes (see 1.1). The two RBAC sources are disconnected.

### 2.2 Workflow Blockers (net effect)

1. **RBAC deadlock (§1.1)** — every workflow mutation endpoint 403s for all users.
2. **Dept-check inversion (§1.2)** — 3 transitions structurally impossible.
3. **Remarks-string state recovery (§1.5)** — persistence of transient states relies on free-text.

Net: **the 2-loop workflow cannot complete a single end-to-end cycle.** As shipped, a user can create a draft and submit (design steps use seeded `indent.*` codes), then every subsequent step is blocked.

### 2.3 Duplicate / Conflicting Routes

`business-transaction.controller.ts` exposes parallel routes for the same action (Phase 12/13/16 drift, matches Level 2):
- `:id/stores/issue` (:119) AND `:id/stores-issue` (:125) → same handler.
- `:id/production/receive` (:131) AND `:id/production-receive` (:141) → same handler.
- Verified earlier: `:id/production/start`, `:id/production/progress`, `:id/production-update`, `:id/delivery` etc. overlap with `:id/production-update`, `:id/accounts/verify` vs `:id/accounts-verify`.

Ambiguous API surface: two routes with identical semantics, both 403 anyway.

---

## 3. Logic Report

### 3.1 Cross-Record Cost Mutation [CRITICAL]

`enterActualCosts` (`business-transaction.service.ts:929-1130`) updates `costItem`/`processCost` by `id` from the DTO with **no scoping to this transaction's cost sheet**:
- `costItem.update({ where: { id: ciDto.costItemId }, data: {...} })` (:961-970) — client-supplied `costItemId`.
- Same pattern for process costs (:995-1003) and per-line cost updates (:1097-1106).
- No verification that the `costItemId`/`processCostId` belongs to `txData.costSheet.id`.

**Impact:** any Accounts-role caller can overwrite another transaction's actual-cost lines by passing foreign IDs. Cross-record data corruption.

### 3.2 Non-Atomic Stock Decrement [HIGH]

`storesIssueMaterials` (`business-transaction.service.ts:556-580`): inside `$transaction`, it does `material.findUnique` → `currentStock.lessThan(item.quantity)` check → `currentStock: { decrement }`. The check-then-decrement is **not atomic** (no conditional update / row lock): two concurrent issues of the same material can both pass the availability check and oversell stock.

### 3.3 EmailLog Multi-Recipient PK Collision [HIGH]

`communication.service.ts:122-150` inserts **one `emailLog` row per recipient sharing the same `id = jobId`**. The second recipient's insert violates the primary key (`emailLog.id @id`, schema :994-995) → `Promise.all` rejects → whole batch caught and swallowed (:151-156). Net: for any multi-recipient email, only a partial/uncertain log survives; the queue job itself is still enqueued using the full recipient list, so **DB log diverges from actual sends**.

### 3.4 SMTP Failure → Job Marked COMPLETED (Retry Bypass) [HIGH]

`queue.processor.ts:24-60`: `processJob` never rethrows on SMTP failure; it calls `handleFailure` (:58) which re-queues via `queueService.addJob` and **returns normally**. Result: BullMQ marks the job **completed** even though the email failed. Additionally, retries reuse `payload.jobId` (:108) as the BullMQ `jobId` (queue.service.ts:93) — duplicate `jobId` on retry is rejected/overwritten, so genuine retries are unreliable. `finalizeLogStatus` increments `retryCount` on success too (:150). The retry strategy exists but is bypassed in the happy-error path.

### 3.5 Audit Log IP Hardcoded [MEDIUM]

`business-transaction-event.service.ts:191`: `ipAddress: ipAddress || '127.0.0.1'`; callers pass no IP → **every audit record is `127.0.0.1`**. Audit trail is falsified.

### 3.6 Workflow-Definition Permission Codes Unused [MEDIUM]

`requiredPermissionCode` in stage definitions is never consulted by `WorkflowStateTransitionValidator` (which checks only ownership) or by the service. It is dead metadata disconnected from the real guards.

### 3.7 Redis Connection Without Error Handler in Worker [HIGH]

`mail.worker.ts:43-49` opens its **own** Redis connection with no `error` handler (QueueService adds one, queue.service.ts:50-52). An ioredis `error` event with no listener throws → worker crash. Also two separate Redis connections (queue + worker) is unnecessary.

### 3.8 Duplicate/Dead Code Confirmed (carry-over from Level 2, verified for logic relevance)

- `createAuditLog` duplicated in `processes.service.ts:35-56`, `units.service.ts:30-51`, `vendors.service.ts:39-60`.
- Dead service methods: `addAttachmentToIndent`, `removeAttachmentFromIndent`, `getAllowedNextStates`, `getNotificationRule` (workflow-state-machine.service.ts:32-35,55-57), `getActiveSessions`, `updateLastActivity`, `expireSessions`, `getRecentLoginHistory`, `recordPasswordChange`, and entire `AuthorizationService`.
- Frontend dual-stack dead code (11 files) — unreachable legacy alongside the active suite.

---

## 4. Business Score

| Dimension | Score | Rationale |
|---|---|---|
| **Business rules / validation** | 3 / 10 | Validation exists but department logic inverted; backdated dates allowed; synchronicity is only a warning. |
| **Workflow / state machine** | 2 / 10 | 3 transitions structurally impossible; 12↔11 state mapping lossy; state recovered from free-text remarks; REJECTED/CANCELLED → DRAFT destructive. |
| **Logic correctness** | 2 / 10 | Cross-record cost mutation; non-atomic stock decrement; retry bypass; email log PK collision; fake audit IP. |
| **Security / RBAC** | 1 / 10 | Permission codes never seeded → entire workflow 403 for all users incl. Admin; dual RBAC vocabularies disconnected. |
| **Concurrency / data integrity** | 2 / 10 | Non-atomic decrement; collision-prone doc numbering; silent DB-log divergence. |

**Overall Business Score: 2.0 / 10 — NOT production-usable for its core workflow.**

---

## 5. Final Verdict

**REJECT / NOT PRODUCTION-READY.** The system cannot execute its primary two-loop manufacturing/financial workflow end-to-end because:

1. **RBAC deadlock** — required permission codes (`stores.issue`, `production.update`, `production.deliver`, `accounts.verify`, `accounts.close`, `system.archive`, `system.complete`, `users.read`, …) are never seeded; every workflow mutation endpoint 403s for all users including Admin (§1.1).
2. **Inverted department-ownership check** — 3 of 10 transitions are impossible even after RBAC is repaired (§1.2).
3. **Lossy/destructive status mapping** — transient states recovered from remarks text; rejected/cancelled collapse to DRAFT (§1.5).
4. **Cross-record cost mutation** and **non-atomic stock decrement** risk silent data corruption (§3.1, §3.2).
5. **Email/notification pipeline defects** — recipients silently unresolvable (role/dept code mismatches), SMTP failures marked completed, email-log PK collisions (§1.4, §3.3, §3.4).

### Priority Fix Order
1. Align permission codes between `database/seed.ts`, controller `@Permissions`, and stage-def `requiredPermissionCode`; seed a `Workflow Operator` set of codes granted to the four operational roles. (Unblocks the whole workflow.)
2. Fix `WorkflowStateTransitionValidator` to compare against the **target** state's owning department (or pass the acting user's real department), then verify all 10 call sites.
3. Persist transient states via a dedicated column (or `WorkflowHistory` latest-record lookup) instead of `remarks` string-matching.
4. Scope `enterActualCosts` updates to `costSheetId`; make stock decrement conditional (`updateMany where currentStock >= qty`).
5. Give `mail.worker` its own error handler; generate distinct BullMQ jobIds per retry; finalize status only on true success.
6. Map notification target departments to seeded codes (`STOR`/`PROD`/`ACCT`) and include the seeded `Admin` role name.

---

*Cross-references: architecture-audit-report.md (Level 1, 6.1/10), static-code-audit-report.md (Level 2, 3.8/10, NOT production-ready). Level 3 confirms and deepens both with workflow/RBAC/cost-logic specifics.*
