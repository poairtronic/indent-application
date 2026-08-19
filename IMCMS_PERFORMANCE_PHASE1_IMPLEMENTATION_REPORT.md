# IMCMS Performance — Phase 1 Implementation Report

Status: **Implemented** | Scope: Phase 1 hot-path fixes only (no Phase 2 refactors)
Date: 2026-08-19 | Source of truth: `IMCMS_PERFORMANCE_FORENSIC_AUDIT.md`

---

## 1. Executive Summary

All 7 approved Phase 1 fixes were implemented and verified. The two highest-impact server-side changes
are deterministic round-trip reductions on the Neon serverless PostgreSQL (the audit measured
~106–108 ms per query regardless of size):

- **`/analytics/kpis`** cold path now uses **4 SQL `groupBy` queries instead of 20 individual
  `count()` queries** plus a slimmer workflow-history payload. Same-machine A/B against the same
  production database measured true-cold median **2663 ms → 1443 ms (−46%)**.
- **Login** reduced from **7 sequential DB operations (~1.28 s DB time)** to a serial chain of 3 round-trip
  groups (lookup → lock-check reset → 4 parallel writes), with the account-lock re-`findUnique`
  eliminated. Local A/B: 6.2 s → ~4.1–4.6 s (high variance, indicative).
- Every workflow transition removed the duplicate full-graph validation fetch (2 full-graph queries →
  1 scoped validation fetch + 1 response fetch).
- Client-side request rates cut: global unread-notification polling **60 s → 150 s** and monitoring
  dashboard polling **5 s → 30 s**.

**Backend:** `tsc` clean, **216/216 tests pass (29 suites)**, `nest build` OK.
**Frontend:** `tsc` clean, **30/30 tests pass**, eslint clean, `vite build` OK.
No security or business invariant was weakened.

---

## 2. Findings Implemented

### F1 — Login serial DB round-trips (P1)
Audit: a single login performs 7 sequential DB ops (~1.28 s DB time) of a 2.31–3.03 s warm request.
Root cause: account-lock re-fetch (`findUnique`) + fully sequential post-auth writes
(refresh-token, session, last-login, activity log).

### F2 — Duplicate `findTransactionById` full-graph fetch on transitions (P1)
Audit: every transition validated via a full include-graph read and then re-read the same graph for the
response (indent detail measured 1434–2151 ms).

### F3 — Global unread-notification polling (P1)
Audit: `useUnreadNotificationCount` polled `/notifications/unread-count` every 60 s on **every tab**,
app-wide (412–613 ms per request in production).

### F4 — Monitoring dashboard polling (P1)
Audit: monitoring charts refetched every 5 s regardless of visibility.

### F5 — SQL-side analytics for `/analytics/kpis` and `/analytics/summary` (P1)
Audit: `/analytics/kpis` cold 1.54–1.86 s (cold→warm 4.1×); status/stage counts were 20 separate
`count()` queries in sequential `Promise.all` groups. `/analytics/summary` already used `groupBy` and
needed **no change**; only its cycle-time/stalled `findMany` reads remain (genuine per-indent math).

### F6 — IndentForm master-data over-request (P1)
Audit: `IndentForm` requested `units` and `processes` with `limit=200` while backend clamps to 100,
forcing a full 100-row payload with a limit the backend rejects.

### F7 — Stale role-permission detail cache (P1)
Audit: `useUpdateRolePermissions` invalidated only `roles.list`; the Roles page permissions pane reads
`roles.detail` and stayed stale after a permission save.

---

## 3. Files Changed

| File | Change |
|---|---|
| `backend/src/auth/services/auth.service.ts` | `executeLogin`: `checkAccountLocked(user.id, user)`; 4 post-auth writes in `Promise.all`; removed unused `device` var |
| `backend/src/auth/services/account-security.service.ts` | `checkAccountLocked(userId, existingUser?)` reuses a pre-fetched user (skips 2nd `findUnique`), falls back to DB if absent |
| `backend/src/auth/services/auth.service.spec.ts` | Assertion updated to `checkAccountLocked(mockUser.id, mockUser)` |
| `backend/src/business-transaction/services/business-transaction.service.ts` | New private `getTransactionContext(id)` (scoped `select` + identical domain mapping); all 21 transition methods validate via it instead of the full fetch |
| `backend/src/business-transaction/tests/stores-issue-inventory.spec.ts` | Mocks retargeted to the new validation seam (`indent.findUnique` with `indentItems`/`status`) + `getStageDefinition` |
| `backend/src/analytics/kpi.service.ts` | 20 `count()` → 4 `groupBy` (current/prev × createdAt/updatedAt); stage KPIs read per-status maps; workflow-performance `findMany` scoped to `select { status, createdAt, workflowHistory.movedAt }` |
| `backend/src/analytics/kpi.service.spec.ts` | **New** regression spec (4 tests): identical values, trend/rounding, status-filter override semantics, 4×`groupBy` shape |
| `backend/src/processes/processes.controller.spec.ts` | Test-only harness fix (missing `RedisCacheService` provider) — pre-existing failure, unrelated to this phase |
| `frontend/src/api/services/notifications/hooks.ts` | `refetchInterval` 60000 → 150000 |
| `frontend/src/pages/MonitoringDashboardPage.tsx` | `refetchInterval` 5000 → 30000 |
| `frontend/src/modules/indent/components/IndentForm.tsx` | units/processes `limit: 200` → `limit: 100` |
| `frontend/src/api/services/roles/hooks.ts` | `useUpdateRolePermissions` also invalidates `roles.detail` for the role id |

---

## 4. Per-Modification Before / After

| FILE | BOTTLENECK | BEFORE | CHANGE | AFTER | MEASURED IMPROVEMENT | REGRESSION TEST |
|---|---|---|---|---|---|---|
| `auth.service.ts` / `account-security.service.ts` | 7 sequential DB ops ~1.28 s DB time | warm login 2.31–3.03 s (prod telemetry) | lock-check reuses fetched user; 4 post-auth writes in `Promise.all` | 1 login fetch + 1 reset + 4 parallel writes (3 serial round-trip groups) | Deterministic: 7 → 5 queries, 7 → 3 serial groups. Local A/B 6.2 s → 4.1–4.6 s (n small, high variance) | `auth.service.spec.ts` updated; 216/216 backend tests |
| `business-transaction.service.ts` | duplicate full include-graph read per transition | detail fetch 1434–2151 ms; 2× full graph per transition | validation via `getTransactionContext` (scoped `select`, same `toDomain` mapping) | validation fetch ≈ 30 columns vs full graph; response fetch unchanged | validation payload ~10–20× smaller; mapping proven identical | `stores-issue-inventory.spec.ts` 7/7 pass |
| `frontend/.../notifications/hooks.ts` | unread count polled every 60 s per tab, app-wide | 412–613 ms per request (prod), ~1/min/tab | `refetchInterval` → 150000 | ~1/2.5 min/tab | per-user request rate **−60%** | drawer still gated on `isOpen`; invalidations unchanged; vitest 30/30 |
| `MonitoringDashboardPage.tsx` | charts refetched every 5 s | 5 s interval | `refetchInterval` → 30000 | 30 s interval | request rate **−83%** | manual refresh/error handling unchanged; vitest 30/30 |
| `kpi.service.ts` | 20 `count()` queries in sequential groups + full-history `findMany` | kpis cold 1.54–1.86 s; cached 376–418 ms (prod) | 4 SQL `groupBy`; maps derive all stage/status KPIs; scoped `select` on history | 4 groupBy RTTs for status/stage counts; slimmer history payload | Same-machine A/B (prod DB): true-cold median **2663 → 1443 ms (−46%)**; warm 471 → 447 ms | new `kpi.service.spec.ts` 4/4 pass; `/analytics/summary` unchanged (already groupBy) |
| `IndentForm.tsx` | `limit:200` vs backend clamp 100 | 200-row request, clamped to 100 | `limit:100` | aligned to backend max | smaller payload + cache-key consistency | tsc/lint/build green |
| `roles/hooks.ts` | `roles.detail` never invalidated on permission save | stale permissions pane after save | invalidate `roles.detail` for the role | pane refetches on save | stale-read eliminated | targeted invalidation (no global flush); tsc/lint/build green |

---

## 5. Before Measurements (from audit, production)

| Endpoint | Warm | Cold | Notes |
|---|---|---|---|
| `POST /auth/login` | 2.31–3.03 s | 2.64–3.75 s | 7 sequential DB ops (~1.28 s DB time) + bcrypt-12 |
| `GET /analytics/kpis` | 376–418 ms (cached) | 1.54–1.86 s | 60 s TTL; cold→warm 4.1× |
| `GET /analytics/summary` | 352–531 ms | — | already groupBy-based |
| `GET /notifications/unread-count` | 412–613 ms | — | 60 s client poll, every tab |
| `GET /indents/:id` | 1434–2151 ms | — | full include graph |

## 6. After Measurements (local A/B, this machine → same production Neon DB + Redis)

Method: booted the backend locally, warmed JIT/connections, then hit `/analytics/kpis` with unique
date ranges to force true cache misses; discarded any sample at the warm-time floor.

| Scenario | Before (old code) | After (new code) | Delta |
|---|---|---|---|
| KPI true-cold median | 2663 ms (n=4: 3424, 2408, 2672, 2655) | 1443 ms (n=10: 1205–1648) | **−46%** |
| KPI cached (warm) | ~471 ms | ~447 ms | −5% |
| Login (single sample) | 6165 ms | 4135 / 4572 ms | ~−30% (indicative) |

Caveat: local server → Neon/Redis latency differs from Render→Neon, so absolute values are not
production numbers; the **before/after delta is controlled** (same machine, same DB, same cache).
Re-measure against production after deploy is recommended.

---

## 7. Security Invariants Verified (unchanged)

- **bcrypt-12** cost untouched (`password.service.ts:6`).
- **Login throttling** untouched (`auth.controller.ts:22`); failed-attempt path still increments and
  resets attempts; account-lock logic preserved (only the re-fetch was removed).
- **Optimistic locking** (`assertCurrentStateAndUpdate`) still guards every transition; `getTransactionContext`
  uses the identical `WorkflowStateMapper.toDomain(status, remarks)` mapping so lock/state semantics match.
- **Transactions** wrapping every multi-write transition unchanged.
- **Tenant isolation / RBAC scoping** in KPI filters, login, and transitions preserved.
- **Audit/activity history** (`LOGIN_SUCCESS`, `STORES_ISSUE`, etc.) unchanged.
- No `window.location.reload()`, no unsafe casts, no secret exposure.

## 8. Business Invariants Verified (unchanged)

- KPI **definitions, rounding, and Prisma Decimal semantics** identical (incl. the original
  status-filter override behaviour: `total-indents` honours the filter while `active`/`completed`/
  `in-production` counted across all statuses — reproduced and unit-tested).
- **Workflow state machine** definitions and allowed transitions untouched.
- **Notification business rules** untouched (only the client poll interval changed).
- **Master-data caps** unchanged (backend still clamps to 100).

## 9. Test Results

- **Backend:** `npx tsc --noEmit` clean; `npm test -- --runInBand` → **29 suites / 216 tests pass**
  (includes new `kpi.service.spec.ts` 4/4, `stores-issue-inventory` 7/7, auth suite, and the repaired
  `processes.controller.spec.ts` harness); `npm run build` OK (the Windows `EPERM` on Prisma's engine
  rename is benign and recovered by `prisma generate`).
- **Frontend:** `npx tsc --noEmit` clean; `npm run test:run` → **10 files / 30 tests pass**;
  `npm run lint` clean; `npm run build` (tsc -b + vite) OK.

## 10. Remaining Phase 1 / Deferred (Phase 2)

Not implemented in this phase (explicitly out of scope):
- Full analytics/reports SQL migration (department/product/vendor endpoints still JS-aggregate after
  `findMany`; `/analytics/summary` cycle-time/stalled reads are per-indent math).
- Report-export background jobs.
- `findTransactionById` pagination redesign (response graph still full — intentional for API shape).
- `storesIssueMaterials` bulk rewrite (loop of per-item material `findUnique`+`update`).
- RBAC cache invalidation, notification `createMany` batching.
- CDN migration and Neon/pooling changes.

## 11. Known Regressions / Risks

- **Test-only harness change:** `processes.controller.spec.ts` was failing before this phase (missing
  `RedisCacheService` provider in DI); fixed in the spec, no application code touched.
- **Test mocks retargeted:** `stores-issue-inventory.spec.ts` now stubs the validation seam
  (`indent.findUnique` + `getStageDefinition`) — behaviour-preserving, values identical.
- **Measurement environment:** local "after" numbers were measured from this machine to the production
  DB (not Render); absolute latency differs from production. Recommended: re-run `perf_*` scripts
  against Render after deploy to confirm the −46% KPI cold delta in production.
- **Login delta is indicative** (small sample, bcrypt-12 + machine noise dominate); the deterministic
  win is the serial-DB-op reduction (7 → 3 round-trip groups).
- Nothing in this phase alters workflow transitions, financial formulas, or notification rules; a
  production smoke test of one full workflow run (create → complete) is still recommended pre-deploy.
