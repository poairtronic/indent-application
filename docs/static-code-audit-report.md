# IMCMS — LEVEL 2 STATIC CODE AUDIT

**Role:** Senior TypeScript Compiler Engineer / Senior Code Auditor / Static Analysis Engineer / NestJS & React Expert
**Scope:** Every production source file in `backend/src` and `frontend/src` (spec/test files excluded from scoring, noted separately)
**Methods:** `tsc --noEmit` + `tsc -b`, ESLint, grep-based pattern analysis, and line-by-line manual review of every file (2024-line core service included in full)
**Date:** Aug 01, 2026

---

## EXECUTIVE SUMMARY

| Metric | Backend | Frontend |
|---|---|---|
| Files audited | 102 | 84 |
| TypeScript errors | **1** | 0 |
| ESLint errors | **4** | 0 |
| `any` type usages | ~140 | 21 |
| Dead modules/files | ~5 | **11** |
| Critical bugs | **7** | **5** |

**Headline findings:** (1) three workflow transitions are *provably impossible* due to a department-ownership check bug; (2) a path-traversal file-download vulnerability; (3) an unverified cross-record cost mutation; (4) a non-atomic stock decrement; (5) an in-memory fake repository in the `indent` module; (6) a frontend dead dual-stack (fetch+axios, two auth stores) with localStorage/base-URL mismatches.

---

## 1. COMPILER REPORT

### 1.1 TypeScript

**Backend** — 1 error:
```
backend/src/processes/processes.service.spec.ts:220,21
error TS2339: Property 'isDeleted' does not exist on type 'ProcessResponseDto'
```
Production code compiles clean. The error is in a test file referencing a field removed from the response DTO — test/spec drift.

**Frontend** — 0 errors. Clean `tsc -b --noEmit`.

**Notable:** `backend/tsconfig.json` has `noImplicitAny: true` but is **defeated by 140 explicit `any` annotations** (see §3.7). `strictNullChecks: true` is enabled, but the codebase bypasses it with non-null assertions and unguarded dereferences (see §3.8).

### 1.2 ESLint

**Backend** — 4 errors, all in one file:
```
backend/src/communication/queue/queue.processor.ts
  7:10  'SMTPException' is defined but never used
 68:5   'duration' is defined but never used
140:5   'durationMs' is defined but never used
141:5   'messageId' is defined but never used
```
The `durationMs`/`messageId` findings are not mere lint noise — they reveal that **email send duration and message-id are computed but never persisted** (a functional bug, see §6.9).

**Frontend** — 0 ESLint errors. (Note: frontend uses oxlint as a secondary tool; not run here.)

---

## 2. DEAD CODE REPORT

### 2.1 Dead modules / unreachable files (Frontend — 11 files)

The entire **fetch-based dual stack is unreachable dead code**:

| File | Evidence |
|---|---|
| `services/api.ts` | `apiFetch` only used by fetch-services, which are dead |
| `services/auth.service.ts` | only imported by dead `store/auth.store.ts` |
| `services/costing.service.ts` | `costingService` never imported anywhere |
| `services/indent.service.ts` | `indentService` never imported anywhere |
| `services/notification.service.ts` | `notificationService` never imported anywhere |
| `store/auth.store.ts` | `useAuth`/`authStore` never imported; only consumer of fetch services |
| `store/theme.store.ts` | never imported |
| `store/notification.store.ts` | never imported |
| `components/common/Can.tsx` | never imported |
| `components/common/RoleGuard.tsx` | never imported |
| `modules/analytics/index.ts` | barrel that re-exports; not imported by router (pages imported directly) |

### 2.2 Dead backend methods

| Location | Dead symbol |
|---|---|
| `business-transaction.service.ts:1313-1337` | `addAttachmentToIndent()` — no controller calls it |
| `business-transaction.service.ts:1342-1380` | `removeAttachmentFromIndent()` — no controller calls it |
| `workflow-state-machine.service.ts:32-35` | `getAllowedNextStates()` — zero callers |
| `workflow-state-machine.service.ts:55-57` | `getNotificationRule()` — zero callers |
| `auth/services/session.service.ts:46-56` | `getActiveSessions()` — zero callers |
| `auth/services/session.service.ts:113-118` | `updateLastActivity()` — zero callers |
| `auth/services/session.service.ts:120-131` | `expireSessions()` — zero callers (expired sessions never cleaned) |
| `auth/services/login-history.service.ts:84-86` | `getRecentLoginHistory()` — zero callers |
| `auth/services/account-security.service.ts:151-156` | `recordPasswordChange()` — zero callers |
| `auth/services/authorization.service.ts` | entire `AuthorizationService` (authorize/authorizeAny/authorizeAll) — zero production callers, only registered in module |
| `users/users.service.ts:218-220` | `getUserProfile()` — redundant pass-through |
| `permissions/permissions.service.ts:105-110` | `findByModule()` — never called |

### 2.3 Dead DTOs / interfaces / enums / constants

- **DTOs:** `BusinessTransactionResponseDto` (`create-business-transaction.dto.ts:34-47`), `AddAttachmentDto` (`attachment.dto.ts`), `ProductionReceiptDto` (`production-update.dto.ts:3-7`), `IndentAttachmentDto`/`attachments?` (`create-indent-sheet.dto.ts:54-66` — never consumed by `createTransaction`).
- **Interfaces:** 12 of 13 in `business-transaction/interfaces/business-transaction.interface.ts` are self-referential only; `IUserSanitized`/`IUserFilterParams` (`users/interfaces/user.interface.ts`); `IManufacturingProcess`/`IProcessFilterParams` (`processes/interfaces`); `IUnit`/`IUnitFilterParams` (`units/interfaces`); `IVendor`/`IVendorFilterParams` (`vendors/interfaces`).
- **Enums:** `FileType.DRAWING` (`workflow-state.enum.ts:49`); `EmailState.PENDING/DELIVERED/CANCELLED` (`queue.constants.ts`); `QUEUED`/`FAILED` never used as enum values (strings used instead).
- **Constants:** `PROCESS_STATUSES` (`processes/constants/process.constants.ts`), `VENDOR_STATUSES`/`PINCODE_PATTERN` (`vendors/constants/vendor.constants.ts`), `APP_COLORS` (`colors.ts`), `APP_MESSAGES` (`messages.ts`), `APP_ROUTES` (`routes.ts`), `INDENT_STATUS_LABELS`/`IndentStatus` (`status.ts`), `VALIDATION_LIMITS` (`validation.ts`), `MODULE_PERMISSIONS` (`permissions.ts:65-135`), `ROLE_HIERARCHY` (`roles.ts:21-29`).
- **Message constants** `CREATED_SUCCESS/UPDATED_SUCCESS/FETCHED_SUCCESS/LIST_FETCHED_SUCCESS` unused in all of processes/units/vendors/users message constants.
- **Types:** `types/analytics.ts`, `types/costing.ts`, `types/dashboard.ts`, `types/indent.ts`, `types/notification.ts`, `AuthState` (`types/user.ts:22-27`) — never imported. Duplicate `User`/`UserRole`/`UserDepartment` defined inline in `authStore.ts:3-22`.
- **Hooks:** `usePermission`, `useRole`, `useProcess` (`useProcesses.ts:19`), `useUnit`, `useVendor`, `useUser`, `useRestoreUser`.
- **Utils:** `formatCurrency` (`utils/currency.ts`), `downloadBlob`, `isValidEmail`/`isRequired`, `truncateText` — unused.
- **Template engine dead templates:** `cost_verification`, `daily_summary`, `weekly_summary`, `monthly_summary` (`template.engine.ts:51-55`); `smtp_failure`/`queue_failure`/`template_failure` only reachable via never-emitted `SYSTEM_ALERT`.
- **Dead events (never emitted → dispatcher branches dead):** `EMAIL_VERIFICATION`, `INDENT_SUBMITTED`, `SYSTEM_ALERT` (`communication-event.bus.ts`).
- **Dead queue field:** `IJobPayload.businessEvent`, `recipient`, `transactionId`, `department` — written/never read.
- **Dead UI:** `App.tsx:10` hardcoded `<h1>Welcome to Indent Application</h1>` on every route; `providers.tsx` `AppContext`/`useApp`/`toggleTheme` never consumed; dual theming (`'dark'` in providers vs `'light'` in `theme.store`).

---

## 3. QUALITY REPORT

### 3.1 Long functions (backend)

| Function | Location | ~Lines |
|---|---|---|
| `replaceAttachment` | `business-transaction.service.ts:1879-2023` | 145 |
| `enterActualCosts` | `business-transaction.service.ts:929-1063` | 135 |
| `uploadAttachmentToIndent` | `business-transaction.service.ts:1385-1518` | 134 |
| `deleteAttachment` | `business-transaction.service.ts:1523-1646` | 124 |
| `handleEvent` | `notification.dispatcher.ts:35-268` | 234 |
| `login` | `auth.service.ts:31-129` | 99 |
| `getProductAnalytics` | `analytics.service.ts:354-462` | 108 |
| `getVendorAnalytics` | `analytics.service.ts:472-574` | 102 |
| `updateUser` | `users.service.ts:222-308` | 87 |
| `updateVendor` | `vendors.service.ts:212-272` | 61 |

### 3.2 Long components (frontend)

`UsersPage.tsx` (524), `ProcessesPage.tsx` (446), `VendorsPage.tsx` (427), `UnitsPage.tsx` (390), `UserFormModal.tsx` (339), `VendorFormModal.tsx` (325), `ProcessFormModal.tsx` (277), `router.tsx` (258).

### 3.3 Cyclomatic complexity hotspots

- `notification.dispatcher.ts:40-261` `handleEvent` — 15-case switch with per-case async I/O.
- `lib/axios.ts:44-104` — 401+whitelist+refresh-queue+retry interceptor (highest frontend complexity).
- `workflow-state-transition.validator.ts` — branching, plus `device-info.ts:28-55` (15 decision points).
- `getProductAnalytics`/`getVendorAnalytics` — loop + multi-branch aggregation.
- All four CRUD pages render bodies — nested ternaries × permission branches.

### 3.4 Duplicate code / logic / queries

- **`createAuditLog` verbatim copy** ×3: `processes.service.ts:35-56`, `units.service.ts:30-51`, `vendors.service.ts:39-60`.
- **7 pairs of duplicate API endpoints** in `business-transaction.controller.ts` (`stores/issue` vs `stores-issue`, `production/receive` vs `production-receive`, `production-update`, `delivery` vs `deliver-customer`, `accounts-verify`, `actual-costs`, `financial-closure`).
- **Same Prisma include query** (user+department+role+rolePermissions) ×3: `auth.service.ts:35-48,146-159`, `jwt.strategy.ts:19-34`.
- **Duplicate `AuthResponse` assembly** ×2: `auth.service.ts:108-128,187-207`.
- **Uniqueness assertion pattern** ×6 and **`findFirst({id,isDeleted:false})`** ~12× across processes/units/vendors.
- **Pagination block** (`Math.max(1,...)` + `Promise.all([findMany,count])`) ×3 identical copies + DTO defaults.
- **Role-permission reassign** (deleteMany+createMany) ×3 in `roles.service.ts`.
- **Session/refresh-token revocation** duplicated between `users.service.ts` and `session.service.ts`/`token.service.ts` with **behavioral drift** (users.service omits `deletedAt`).
- **Password complexity regex** duplicated: `reset-password.dto.ts:15`, `change-password.dto.ts:12`; but `create-user.dto.ts:47-49` uses a **weaker** `MinLength(8)` rule — inconsistent policy.
- **`IS_PUBLIC_KEY` short-circuit** ×3 guards (`jwt-auth`, `roles`, `permissions`).
- **`formatCurrency`** local copies in 3 analytics pages while `utils/currency.ts` sits unused.
- **`DetailRow`** identical component in 4 detail modals.
- **Error/retry panel** duplicated across all 6 analytics pages.
- **`unwrap` helper + `ApiResponse` envelope** — 4 near-identical copies (`process/unit/user/vendor` services).
- **`NodemailerProvider` + `TemplateEngine`** registered in BOTH `communication.module.ts:18-19` and `queue.module.ts:11` → two instances, two SMTP pools.
- **`updateLogStatus`** duplicated in `communication.service.ts:99-112` and `queue.processor.ts:119-135`.
- **Redis connection config** duplicated in `queue.service.ts:29-32` and `mail.worker.ts:31-34`.

### 3.5 Duplicate / redundant guards

- All three guards registered as global `APP_GUARD`s (app.module.ts:39-50) AND per-controller `@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)` → guards run **twice** per request on roles/processes/units/vendors controllers.
- `JwtAuthGuard`/`RolesGuard`/`PermissionsGuard` exported by AuthModule AND registered as providers AND as APP_GUARD — triple registration.

### 3.6 Magic numbers & hardcoded values

- **Hardcoded JWT fallback secrets:** `'super_secret_access_token_key_123456'` / `'super_secret_refresh_token_key_7891011'` (`auth.constants.ts:2-3`).
- **Hardcoded roles:** `['Senior Manager','General Manager']` ×3 in `business-transaction.service.ts`; `'ADMIN'` ×6 in roles/permissions controllers; `['Senior Manager','General Manager','ADMIN','System Administrator']` in `BTES:44`.
- **Hardcoded URLs:** `http://localhost:5173/reset-password`, `.../security-logs` (`auth.service.ts:231,236,298`), `http://localhost:5173/login` (`users.service.ts`), `http://localhost:5173/transactions/${indentId}` (`BTES:118`), `http://localhost:3000` ×2 in `communication.config.ts`.
- **Hardcoded IP `'127.0.0.1'`** for all audit logs (`BTES:191`).
- **Document-number generation:** `Date.now().toString().slice(-6)` + `Math.floor(1000+Math.random()*9000)` (`BTS:40-41`) — collision risk.
- **Pagination magics:** `page ?? 1`, `limit ?? 10`, `min(100)` duplicated ×3; toast 4000ms; debounce 400ms; redirects 1000/2000ms; retry delays `5*60*1000`/`15*60*1000`/`60*60*1000`.
- **Hardcoded status strings:** `'DRAFT'` (indent, costSheet), `'FINALIZED'` — bypassing `CostSheetStatus` enum.
- **`@ApiResponse({status:210})`** — invalid HTTP status in `users.controller.ts:38`.

### 3.7 `any` type usage — ~140 backend, 21 frontend

Worst offenders: `business-transaction.service.ts` (43), `business-transaction.controller.ts` (29, `req: any` on every handler), `users.controller.ts` (6), `session.controller.ts` (5), plus `any` params on public APIs (`enterActualCosts(dto:any)`, `financialClosure(dto:any)`, `searchAttachments(query:any)`). Frontend: 7 `catch(err:any)` in `securityStore.ts`, interceptor `failedQueue:any[]`.

### 3.8 Null/undefined access risks

- `auth.service.ts:117-126` — `user.department.id`/`user.role.rolePermissions` no null checks.
- `jwt.strategy.ts:42`, `permission.service.ts:28` — `user.role.rolePermissions.map()` unguarded.
- `authStore.ts:85` — `user.role.roleName.toUpperCase()` unguarded (frontend).
- `authStore.ts:49,51` — unguarded `JSON.parse` at module load — corrupt localStorage **crashes the app at boot**.
- `financialClosure` `BTS:1183` — `txData.costSheet.id` without null check (throws TypeError).
- `lib/axios.ts:47,52,63` — `originalRequest.url/headers` unguarded in interceptor.
- `roles.controller.ts:95` — `permissionIds: string[]` unvalidated; `.length` on non-array throws.

### 3.9 Deprecated APIs / code smells

- **Two different `FileType` enums used interchangeably** in `business-transaction.service.ts` (Prisma's vs local) — latent mismatch.
- `version: 1` set on create but **never incremented** — optimistic-locking field is a lie (`BTS:78`).
- State reconstruction via **string markers in user-editable `remarks`** (`[MATERIALS_ISSUED]` etc., `workflow-state.mapper.ts`) — a user remark containing these substrings changes resolved state.
- `WorkflowStateMapper.toPrisma` defaults unknown states to `DRAFT` — invalid `?state=` filter **silently returns DRAFT rows** (`BTS:290-293`).
- **Global `Handlebars` mutation** (`registerPartial`/`registerHelper`) in `template.engine.ts:111-115`.
- **Refresh-token rotation bug:** `refresh()` calls `revokeAllSessions()` — refreshing on one device kills all other sessions, then creates a session with hardcoded `'unknown'` device info.
- **`logout` revokes ALL sessions** — one-device logout logs out every device (`auth.service.ts:136`).
- **Lockout bypass:** any authenticated user can `POST /auth/unlock-account` on themselves (`security.controller.ts:19-25`); `adminUserId` never supplied.
- **Reset tokens stored plaintext** in DB while refresh tokens are SHA-256 hashed (`auth.service.ts:223-229`) + `console.info` logs plaintext token to stdout (`:231`).
- **No refresh-token reuse/family detection** — replay in race window passes (`token.service.ts:49-73`).
- `JwtModule.register({})` empty — secrets scattered across constants/strategies/token.service.
- `catch { void 0; }` empty catches at `BTS:1619,1761`.
- `app.enableShutdownHooks()` never called → Prisma never disconnects on SIGTERM.
- `roles.service.ts` deleteMany+createMany with **no `$transaction`** — partial state on crash.
- Swagger mounted at `/api` with **no auth** — full schema disclosure.

---

## 4. MEMORY LEAK REPORT

| Severity | Location | Issue |
|---|---|---|
| **High** | `indent.repository.ts:5,15` | `private indents: any[]` grows unboundedly on every create; never pruned, never persisted, lost on restart. |
| **High** | `mail.worker.ts:43` | Worker creates its own ioredis connection with **no `.on('error')` handler** — ioredis `error` on a listener-less EventEmitter **crashes the Node process**. |
| **High** | `nodemailer.provider.ts:20-58` | `initializeTransporter()` creates a new transporter each call without closing the previous; pooled connections orphaned. `transporter.close()` never called (no `OnModuleDestroy`). |
| **High** | `communication-event.bus.ts:29` | Backing `Subject` never `complete()`d; `getStream()` hands out live subscription; any future subscriber without a destroy hook (or hot-reload re-init) leaks subscriptions to stale handlers. (Current single subscriber unsubscribes correctly.) |
| Medium | `queue.service.ts:63` | `removeOnFail: false` + no DLQ pruning → failed jobs accumulate in Redis unbounded. |
| Medium | `business-transaction.service.ts:1658-1738` | `searchAttachments()` fetches **all** attachment rows then filters in JS — unbounded memory. Same for `getAttachmentHistory` (`:1841-1863`). |
| Medium | frontend `toast.tsx:22` | `setTimeout` never cleared; fires on unmounted component. |
| Medium | frontend `LoginPage.tsx:77-79`, `ChangePasswordPage.tsx:61-64`, `ResetPasswordPage.tsx:67-69` | redirect `setTimeout` not cleaned up. |
| Medium | `business-transaction.service.ts:460-481,557-580` | N+1 queries (`Promise.all`/sequential `findUnique` per item). |
| Medium | `main.ts` | No `enableShutdownHooks()` → Prisma connection pool never drained on shutdown. |
| Low | `queue.processor.ts:99-101` | retry delay branch `nextRetryAttempt >= 4` is **unreachable** (DLQ short-circuits at `>= maxRetries` default 4). |

---

## 5. RISK REPORT (ranked)

| # | Risk | Severity | Location |
|---|---|---|---|
| 1 | **Path traversal file download** — `path.join(uploadDir, fileName)` with no `..` normalization; `fileName` from raw URL param; no permission decorator on download route; no multer file-size limit (2GB upload fully buffered before rejection) | **Critical** | `attachment-storage.service.ts:41`, `business-transaction.controller.ts:312,322-331` |
| 2 | **Three workflow transitions provably broken** — validator checks *current* state's owner instead of *target* state's owner | **Critical** | `workflow-state-transition.validator.ts:41-48`; callers `BTS:625-629,880-884,1219-1223` |
| 3 | **Cross-record mutation** — `costItemId`/`processCostId` never verified against the transaction's costSheetId | **Critical** | `BTS:961-970,995-1003,1097-1106` |
| 4 | **Non-atomic stock decrement** — read-check-decrement race over-decrements stock | High | `BTS:566-579` |
| 5 | **Multi-recipient email silently produces no DB logs** — duplicate PK on `emailLog.create` (`id: jobId`) breaks `Promise.all`, caught and swallowed | High | `communication.service.ts:130,150-156` |
| 6 | **BullMQ retry bypass** — `processJob` never throws, so BullMQ marks jobs `completed` on SMTP failure; retries re-added with same jobId are no-ops/lost | High | `queue.processor.ts:24-60`, `queue.service.ts:93` |
| 7 | **Unhandled Redis `error` event crashes the process** | High | `mail.worker.ts:43` |
| 8 | **CORS wide open** — both branches `callback(null, true)` with `credentials:true`; any origin may make credentialed requests | High | `main.ts:15-18` |
| 9 | **Hardcoded JWT fallback secrets** ship in source | High | `auth.constants.ts:2-3` |
| 10 | **In-memory indent stub** — unvalidated `any` endpoints, no guards, data loss on restart | High | `indent/*` |
| 11 | **Fire-and-forget events/audit** — notification + audit failures swallowed silently everywhere (SOX-style audit trail degrades silently) | High | `BTES:34-164,170-203`, users/processes/units/vendors `createAuditLog` |
| 12 | **`enterActualCosts` partial-list wrong totals** | High | `BTS:954-980` |
| 13 | **`finalizeLogStatus` drops duration/messageId** (metrics lost) | Medium | `queue.processor.ts:137-157` |
| 14 | **Frontend base-URL + localStorage key mismatch** between fetch (`/api`, `token`) and axios (`no /api`, `auth_access_token`) | High | `constants/api.ts:1` vs `lib/axios.ts:4`, `services/api.ts:4` |
| 15 | **Analytics response-unwrap mismatch** — returns `response.data` while all other services unwrap `response.data.data`; analytics pages likely read `undefined` | High | `modules/analytics/services/analytics.service.ts:19-20` |
| 16 | **Stale modal form state** — `defaultValues` applied only on mount; switching edit targets keeps prior values | Medium | `ProcessFormModal.tsx:118-125`, `UserFormModal.tsx:143-150`, `VendorFormModal.tsx:133-140`, `UnitFormModal.tsx:61-68` |
| 17 | **Logout-all / refresh-kills-all-sessions** session semantics | Medium | `auth.service.ts:136,167-185` |
| 18 | **Document-number collision** (Date.now+random, no retry) | Medium | `BTS:39-46` |
| 19 | **File write/delete order** — DB failure after disk write orphans files; `replaceAttachment` can destroy both old and new | Medium | `ASS:33`, `BTS:1579-1588,1948-1969` |
| 20 | **`JSON.parse` corrupt-localStorage crash at app boot** | Medium | `authStore.ts:49,51` |

---

## 6. DETAILED CRITICAL BUG WALKTHROUGH

### 6.1 The workflow is stuck at three transitions (Critical)

`workflow-state-transition.validator.ts:41-48`:
```ts
if (currentDef.owningDepartmentCode !== 'SYSTEM' &&
    currentDef.owningDepartmentCode !== userDepartmentCode) {
  errors.push(...)
}
```
It compares the **current** state's owner against the actor. For hand-off transitions the **target** department acts:
- `MATERIALS_ISSUED(STORES) → PRODUCTION_PROCESSING` by `PRODUCTION` → **always rejected** (Production can never receive materials).
- `CUSTOMER_DELIVERED(PRODUCTION) → ACCOUNTS_COST_VERIFICATION` by `ACCOUNTS` → **always rejected** (Accounts can never start verification).
- `ACCOUNTS_FINANCIAL_CLOSURE(ACCOUNTS) → ARCHIVED` by `SYSTEM` → **always rejected** (archival never runs; the SYSTEM exemption only applies when *current* state is SYSTEM).

The check should validate against the **target** state's owner (or `allowedNextStates` transition rule). Verified directly against the state machine definition (`workflow-state-machine.definition.ts:52-146`).

### 6.2 Path traversal + upload security (Critical)

- `attachment-storage.service.ts:41`: `path.join(this.uploadDir, fileName)` — no `path.resolve`/`..` normalization.
- `business-transaction.controller.ts:322-331`: download feeds raw URL `fileName` straight to `res.sendFile`; **no `@Permissions` decorator** (any authenticated user can download any file); `fileName=..%2F..%2F.env` serves arbitrary files.
- `FileInterceptor` at `:312,347` has no `limits.fileSize` — the 10MB check happens *after* multer buffers the whole upload in memory → memory-exhaustion vector.
- No MIME sniffing — extension-only allow-list; `.pdf` can be executable payload.

### 6.3 Unverified cost-item mutation (Critical)

`BTS:961-970` (`enterActualCosts`): `tx.costItem.update({ where: { id: ciDto.costItemId } })` never verifies `costItemId` belongs to this transaction's cost sheet. Same at `:995-1003` (processCostId) and `:1097-1106`. A caller can overwrite any other transaction's cost actuals.

### 6.4 Non-atomic stock decrement (High)

`BTS:566-579`: `read currentStock → check lessThan → decrement` — two concurrent issues both pass the check and over-decrement. Needs `updateMany({ where: { id, currentStock: { gte } } })`.

### 6.5 State changes without concurrency guard (High)

State updates (`indent.update status`) have no `WHERE status = expected`; two racing transitions can both succeed (double-advance).

---

## 7. CODE SCORE

| Category | Score (/10) |
|---|---|
| TypeScript correctness (compiler clean) | 8.5 |
| Type-safety discipline (`any` usage) | 2.5 |
| Dead-code elimination | 3.0 |
| Duplication control | 3.5 |
| Function/component size (SRP) | 3.5 |
| Error handling & promises | 4.0 |
| Memory management | 4.0 |
| Security posture | 3.0 |
| Configuration/hardcoding | 2.5 |
| Frontend consistency (dual stacks, stores) | 3.0 |
| **Overall Code Score** | **3.8 / 10** |

**Maintainability Index:** Low — the 2024-line `business-transaction.service.ts`, 234-line `handleEvent`, and 524-line `UsersPage.tsx` alone push module-level maintainability below the actionable threshold. Roughly **140 backend `any`s**, ~30 duplicated code blocks, and 11 dead frontend modules compound it.

---

## 8. FINAL VERDICT

**NOT PRODUCTION-READY.** This is an ambitious, well-structured codebase (clean compiler surface, excellent module organization, a sound event-driven design) undermined by an accumulation of correctness-critical defects in the highest-value path.

The three blocking items are **provably broken workflow transitions**, **path-traversal file download**, and **cross-record cost mutation** — any of which alone prevents safe deployment. Around them sit a non-atomic stock decrement, a silently-failing multi-recipient email path, an unhandled Redis error that can crash the process, a wide-open CORS policy, and hardcoded JWT secrets.

**Actionable remediation order:**
1. Fix the department-ownership check (`workflow-state-transition.validator.ts` — validate against *target* state owner).
2. Close the file-download path traversal + add permission decorator + multer limits.
3. Verify `costItemId`/`processCostId` ownership before mutation; make stock decrement atomic.
4. Delete the dead fetch/axios dual stack & `auth.store.ts`; unify on axios + Zustand; fix base-URL + localStorage keys + analytics unwrap.
5. Fix the BullMQ retry design (use native `attempts`/`backoff`); persist `durationMs`/`messageId`; fix multi-recipient PK.
6. Add `mail.worker.ts` Redis error handler; add `enableShutdownHooks()`.
7. Remove hardcoded JWT fallbacks → ConfigModule with env validation; lock down CORS.
8. Replace in-memory `indent` stub with a Prisma-backed repository or remove the module.
9. Eliminate dead code (11 frontend files, ~15 backend methods/DTOs, unused constants/types).
10. Break the fat services into cohesive units (file/attachment, workflow, costs, analytics aggregation).
