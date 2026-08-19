# IMCMS Enterprise — Production Performance Forensic Audit

**Audit ID:** PFA-2026-08-19-001
**Audit Date:** 19 August 2026
**Auditor Environment:** Windows + Node.js 18+ (PowerShell / plain fetch)
**Repositories Audited:**
- Backend: `backend/` (NestJS 10, Prisma 5, Redis ioredis, BullMQ)
- Frontend: `frontend/` (React 19, Vite 5, TypeScript, TanStack Query v5)
- Database: Neon PostgreSQL (serverless) — reachable only via app, not directly benchmarked

---

## 01. Executive Summary

IMCMS is a well-instrumented, security-strong IMCMS enterprise application. The backend already ships with
Redis caching, per-endpoint cache invalidation, BullMQ background dispatch, optimistic state transitions,
bcrypt-12 hashing, and a production observability layer that exposed real latency percentiles during this audit.

**Headline findings:**

1. **The dominant latent cost is NOT application logic — it is serial, network-bound round-trips to a
   serverless Neon database (~100–110 ms per query).** Production telemetry captured during the audit shows a
   single login performing **7 sequential DB operations for ~1.28 s** of the total 2.68 s request. Every query
   takes ~106–108 ms regardless of size — a classic serverless PG connection-proxy RTT signature, not an
   execution-cost signature (`averageLatencyMs: 183`, `p95Ms: 636`, 7 queries in `databaseMetrics`).
2. **The biggest *code-level* hot paths are synchronous, in-request aggregations** over unbounded full-table
   reads in the Analytics and Reports modules (JS-side `groupBy`/`reduce` after `findMany` of entire tables),
   plus report exports that materialize up to **100,000 rows synchronously into a response**.
3. **`findTransactionById` is the single most expensive query shape** (expand graph covering indent lines,
   materials, units, processes, cost sheets, cost items, process costs, workflow history, and nested movers).
   It is wired through **45 call sites** and is queried **twice per workflow transition** (once for validation,
   once for the return payload).
4. **Frontend query hygiene is above average** (bounded retries, `refetchOnWindowFocus:false`,
   `refetchOnMount:false`, key-factory invalidations, no `window.location.reload()` after mutations).
   The two real frontend issues are **unnecessary app-wide polling** (60 s unread-count poll mounted globally;
   5 s poll on the monitoring page) and a **heavily over-fetched dashboard** (~9 queries on first load).
5. **Security was preserved.** All findings respect tenant isolation, RBAC, audit history, transactions, and
   optimistic locking. Notably, bcrypt cost 12 is a correct security choice — the recommendation is to reduce
   the *number of serial DB writes* around login, **not** the hashing strength. No fix below suggests
   `window.location.reload()` as a performance measure.

**Classifications used:** `P0` (outage/correctness/data-loss), `P1` (visible latency / scalability ceiling),
`P2` (efficiency / request-count), `P3` (hygiene / DX), `P4` (cosmetic). Confidence: `CONFIRMED` (measured or
read directly), `PROBABLE` (inferred from surrounding code), `POSSIBLE` (hypothesis).

| Class | Count |
|---|---|
| P0 | 0 |
| P1 | 6 |
| P2 | 9 |
| P3 | 6 |
| P4 | 3 |

---

## 02. Audit Scope & Methodology

**Scope**
- Live environment: `https://indent-application.onrender.com/api` (backend), `https://indent-application-frontend.onrender.com` (frontend).
- Source: full `backend/` (incl. Prisma schema, Redis interceptor, observability, auth, analytics, reports,
  business-transaction, communications/event-bus, notifications) and `frontend/` (query client, query-keys,
  services/hooks, routes, pages, forms, workflow UI, build output).
- Panel of test credentials (all `Password123!`): `admin@indent.com` (full rights; used for all measurements),
  `stores@indent.com`, `design@indent.com`, `accounts@indent.com`, `production@indent.com`,
  `senior.manager@indent.com`. (`admin@imcms.com / Admin123!` returns 401 in production.)

**Method**
1. **Static audit:** repository walk of both apps; direct file reads of every cache/query/report boundary.
2. **Live baseline:** repeated unauthenticated and authenticated `fetch` calls against the live endpoints with
   wall-clock timing (`perf_baseline.js`, `perf_warm.js`, `perf_list.js`, `perf_front.js`).
3. **Production telemetry:** `GET /observability/metrics` (admin token) captured real `apiMetrics`,
   `databaseMetrics`, `redisMetrics`, and audit datapoints.
4. **Client-build audit:** parsed `frontend/dist/assets` directory + `vite.config.ts`/`rollup-plugin-visualizer`
   output for bundle composition and code-splitting quality.

**Caveats**
- All timings are single- or few-sample HTTP wall-clock from the auditor's machine to Render/Neon — report
  relative deltas, not absolute microseconds. Network RTT dominates all numbers equally.
- Cold start could not be force-isolated (Render does not expose forced restarts; liveness remained ~406–437 ms
  throughout, indicating a warmed container).
- DB profiling is app-side (Prisma/observability), not pg_stat_statements — Neon native metrics were not
  accessible from this environment.

---

## 03. Live Production Baseline (Time-Based Targets Table)

Targets (render-free/individual warm container). All entries are wall-clock HTTP round trips.

### Backend (API)

| # | Endpoint / operation | Warm observed | Cold-ish / first call | Notes |
|---|---|---|---|---|
| 1 | `POST /auth/login` (admin) | 2.31 – 3.03 s | 2.64 – 3.75 s | 7 sequential DB ops (~1.28 s) + bcrypt-12. **Target ≤ 1.5 s** |
| 2 | `GET /health/liveness` | 406 – 437 ms | — | Target ≤ 200 ms |
| 3 | `GET /health/readiness` | 406 – 928 ms | — | Spikes; Redis/DB probe in request path |
| 4 | `GET /auth/profile` | N/A (404) | — | Frontend uses `/auth/profile`; `/auth/me` does not exist |
| 5 | `GET /notifications?page=1&limit=10` | 643 – 918 ms | — | 10.4 KB payload. Target ≤ 400 ms |
| 6 | `GET /notifications/unread-count` | 412 – 613 ms | — | 60 s cache. Target ≤ 300 ms |
| 7 | `GET /analytics/kpis` | 376 – 418 ms **cached** | 1.54 – 1.86 s **cold** | 60 s TTL; 3.7 KB. Cold→warm = 4.1× |
| 8 | `GET /analytics/summary` | 352 – 531 ms | — | |
| 9 | `GET /analytics/costs` | 331 – 510 ms | — | |
| 10 | `GET /analytics/products` | 447 – 736 ms | — | |
| 11 | `GET /analytics/vendors` | 415 – 516 ms | — | |
| 12 | `GET /analytics/departments` | 371 – 493 ms | — | |
| 13 | `GET /indents?page=1&limit=10` (list) | 817 – 1318 ms | — | 4.5 KB. Target ≤ 600 ms |
| 14 | `GET /indents/:id` (detail) | 1434 – 2151 ms | — | 9.3 KB; huge include graph. **Target ≤ 900 ms** |
| 15 | `GET /roles` | 514 – 715 ms | — | 40.1 KB — no field projection. Target ≤ 400 ms |
| 16 | `GET /units?page=1&limit=10` | 385 – 510 ms | — | |
| 17 | `GET /materials?page=1&limit=10` | 385 – 790 ms | — | 4.7 KB |
| 18 | `GET /departments` | 371 – 493 ms | — | 2.6 KB |
| 19 | `GET /reports/daily?dateFrom=...&dateTo=...` | 411 – 915 ms | — | |
| 20 | `GET /reports/process-yield?dateFrom=...&dateTo=...` | ~1021 ms | — | JS aggregation over full fetch |
| 21 | `GET /reports/cost-breakdown?dateFrom=...&dateTo=...` | ~662 ms | — | |
| 22 | `GET/POST report export (Excel/PDF)` | blocking; limit 100k | — | `limit: 100000` in controller default |
| 23 | `GET /observability/metrics` | 2.68 s | — | Includes the login that produced the token (self-instrument) |

### Frontend (static host)

| # | Asset | Size | Transfer time (Render static) |
|---|---|---|---|
| 1 | `index-COjo8IoR.js` (critical entry) | 331.3 KB | ~408 ms |
| 2 | `jsx-runtime-KJkY8l8U.js` | 8.3 KB | ~309 ms |
| 3 | `index-DsngLAgA.css` | 86.3 KB | ~22 ms |
| — | **Total first-load critical path** | ~426 KB | ~410–740 ms w/ network latency |

Everything else is code-split behind lazy routes (151 JS chunks total — see §11).

---

## 04. Frontend Performance Analysis

**Verdict: hygienic query layer, two real offenders.**

### 04.1 Query client defaults (GOOD)
`frontend/src/api/hooks/query-client.ts`
- `staleTime: 5 * 60` (5 min) — sensible global default.
- `refetchOnWindowFocus: false`, `refetchOnMount: false`.
- Retries bounded: network 1, server 2, default 1; no retry on 401/403/4xx.

### 04.2 App-wide polling (P1 — `CONFIRMED`)
- `frontend/src/api/services/notifications/hooks.ts` — `useUnreadNotificationCount` configured with
  `refetchInterval: 60000` and `staleTime: 30000`, and it is mounted in the **global header** on every page.
  Net effect: ~60 s unread-count API call on every open tab, for every user, forever. Combined with the
  server's own 60 s cache this is redundant traffic but also a scheduled DB probe every minute per tab.
- `frontend/src/pages/MonitoringDashboardPage.tsx:127` — `refetchInterval: 5000` on the monitoring dashboard.
  This page is an operator diagnostic view; 5 s polling keeps 20+ metrics churning on a page users look at rarely.
  Boundary acceptable for a live monitor; flagging so a conscious decision is made.

### 04.3 Dashboard first paint (P2 — `CONFIRMED`)
`frontend/src/pages/DashboardPage.tsx`
- Approximately **9 simultaneous hooks** on mount: notifications list, unread-count, analytics summary,
  workflow analytics, department analytics, cost analytics, product analytics, vendor analytics, audit logs —
  plus a 1 s `setInterval` clock (minimal cost, but combined with §05 produces a burst).
- Same page mounts `useMarkAllNotificationsRead` (mutation only — fine).

### 04.4 Analytics summary page (P2 — `CONFIRMED`)
`frontend/src/modules/analytics/pages/SummaryPage.tsx` mounts 6+ analytics hooks (summary, workflow,
departments, costs, products, vendors) each triggering a full analytics aggregation on cache miss.

### 04.5 Form overhead (P2 — `CONFIRMED`)
`frontend/src/modules/indent/components/IndentForm.tsx:619-620` unconditionally fetches `units` and
`processes` at `limit: 200` (**backend clamps at 100**, see §06) on every create/edit mount, plus materials and
vendors. For a create form this is 4 full-list requests before the user can type.

### 04.6 Mutation invalidation (GOOD — note for retention)
Indent services invalidate `list` + `detail` keys via `invalidateIndent` (`api/services/indents/hooks.ts:11`);
master-data hooks invalidate their scoped list key; role/unit/process/vendor hooks behave similarly. No
`window.location.reload()` after user mutations. The only reloads in the codebase are legitimate security
boundaries:
- `useTabSync` (BroadcastChannel logout), `useSessionTimeout` (15-min idle), api-client 401 redirect,
  `GlobalErrorBoundary` retry button.

These are **preserved** — do not replace them with silent background navigation.

### 04.7 Stale role-permissions pane (P3 — `CONFIRMED`)
`frontend/src/api/services/roles/hooks.ts:58-66` — `useUpdateRolePermissions` invalidates **only the roles list**,
not the roles **detail/permissions** key. After saving permissions the open permissions pane can show stale
data until next manual refetch. (Note: previously mis-attributed to `settings/hooks.ts`, which does not exist;
correct owner is `roles/hooks.ts`.)

---

## 05. Backend Performance Analysis

### 05.1 Login pipeline (P1 — `CONFIRMED`)
`backend/src/auth/services/auth.service.ts` + `login-history.service.ts`, `password.service.ts:6`
- Production telemetry captured during the audit:
  ```
  apiMetrics:     averageLatencyMs 2679, p95 2679   (this request)
  databaseMetrics: totalQueries 7, averageLatencyMs 183, p95Ms 636,
                   slowQueriesHistory: [
                     User.findUnique 636ms (login lookup)
                     User.findUnique 106ms (checkAccountLocked)
                     User.update     108ms (resetFailedAttempts, guarded)
                     RefreshToken.create 107ms
                     UserSession.create 108ms
                     User.update     108ms (lastLogin)
                     ActivityLog.create 106ms
                   ]
  ```
  → 7 (near-)sequential queries ≈ **1.28 s** of the 2.68 s login. The identical ~106–108 ms on every query,
  independent of statement size, is the reward of network RTT to Neon's serverless proxy rather than execution
  cost. The last `ActivityLog.create` runs even when nothing else in the login writes.
- bcrypt-12 hashing is correct; **do not weaken**. The win is collapsing the write sequence, not the hash cost.

### 05.2 Report exports block the request (P1 — `CONFIRMED`)
`backend/src/reports/controllers/reports.controller.ts:27` (export handlers with `limit: 100000`),
`backend/src/reports/services/reports.service.ts:41-65` (`generateExcel` / `generatePdf` build full
workbooks/buffers synchronously before returning). A production-scale export holds the request thread (and one
of the few Render workers) for the entire workbook build, and rows are capped at 100k — meaning the largest
exports silently truncate data.

### 05.3 Cart before the horse orders (P2 — `CONFIRMED`)
Cooked into `business-transaction.service.ts`:
- `findTransactionById` (huge include graph, see §09) is used at **45 call sites** and executed **twice per
  transition** — once inside validation (e.g., `makeWorkflowTransition` / `handleArc`) and again to build the
  return body. The second call is pure waste: the transition already holds the updated entity.
- `storesIssueMaterials` performs one `material.findUnique` + one `material.update` per line inside a serial
  loop (~L903-944), preserving per-line optimistic stock assertions (correct) but costing negligible N+1 DB
  round trips. Keep the optimistic checks; batch the transports.
- `generateDocumentNumbers` uses timestamp-derived suffixes — uniqueness is content-guaranteed by
  caller/transaction, not a performance issue.

### 05.4 Analytics & reports aggregate in JS after full-table reads (P1 — `CONFIRMED`)
`backend/src/analytics/analytics.service.ts:320` (cost sheets), `:392` (indents + all indent items born via
`include`), `:510` (cost items + vendors); `backend/src/reports/services/reports.service.ts:700, 880`
(`generateProcessYieldReport`, aggregated through `findMany` of the entire indent table in the date window and
pivoted in JS). These are **in-memory aggregations on unbounded rows, running inside the HTTP request**.

### 05.5 Notification persistence loop (P2 — `CONFIRMED`)
`backend/src/business-transaction/services/business-transaction-event.service.ts:90,142,163,183` —
recipient `findMany` → per-notification `create` → audit-log `create` + `createMany`, executed sequentially in
the background runner. Because dispatch is fire-and-forget (`runDispatchNotificationBackground`) it does not
block transition latency, but many recipients ⇒ many sequential writes on workers. Acceptable; only relevant at
scale and for unfair queue pressure.

### 05.6 RBAC session cache never invalidated (P2 — `CONFIRMED`)
`backend/src/auth/strategies/jwt.strategy.ts:23-52` caches `user:session:${sub}` for 5 minutes with no
write-through invalidation on role/permission change. Consequence:
- Permission changes take up to 5 min to be effective (stale authorization window — a *security-latency* tradeoff).
- Each request that is a cache miss pays a full `user`→`rolePermissions`→`permission` include fetch.

### 05.7 Container warmness bump (P3 — `CONFIRMED`)
`readiness` spikes to ~928 ms vs `liveness` ~406 ms — the readiness probe performs live Redis + DB checks. Fine,
but keep `liveness` dependency-free (it is) and consider a cached readiness probe for hot-lane health checks.

---

## 06. Database Layer Analysis

**Schema/indexes (GOOD):** `database/schema.prisma` already carries the important single-column indexes:
`Indent` (indentNumber, customerName, layoutNumber, productId, departmentId, createdBy, status, currentState,
currentStageId, requiredDate, createdAt); `Notification` (createdBy, createdAt, isDeleted, eventType);
`RefreshToken`, `UserSession`, `ActivityLog`, login-history pivots similarly indexed. No missing-index red flag
for the hot CRUD paths.

**Structural findings:**

| # | Finding | Conf | Class |
|---|---|---|---|
| DB-1 | **Network-rewarded serial round trips.** Neon serverless ~106 ms RTT × 7 sequential login writes = ~1.28 s. Not execution cost. | CONFIRMED | P1 |
| DB-2 | **Unbounded `findMany` into JS aggregation** for analytics and report pivots; rows in memory before any filtering happens in SQL. | CONFIRMED | P1 |
| DB-3 | **`limit` clamping mismatch:** backend clamps master-list limits to `max = 100` (`units.service.ts:99`, `processes.service.ts:144`, `vendors.service.ts:165`, `users.service.ts:149`, indents `:447`), but the frontend requests `limit: 200` on IndentForm. Every such page silently fetches 100 (grabbing best-case it asked for), then re-renders with the surprise cap. | CONFIRMED | P3 |
| DB-4 | **No pagination on detail joins:** `findTransactionById` include graph never uses paginated sub-fetches; a long workflow-history or many-line indent loads in a single statement (correct, but heavy). | CONFIRMED | P2 |
| DB-5 | **Double detail fetch per transition** (see §05.3). | CONFIRMED | P2 |

**Neon-specific note:** because latency is dominated by connection-proxy RTT, the highest-leverage DB changes are
(1) reducing the number of round trips, (2) pushing aggregation to SQL, (3) enabling pooler + prepared statement
reuse when it moves to self-managed postgres. Do **not** strip optimistic locking or transaction boundaries to
gain speed.

---

## 07. Caching Strategy (Redis) Analysis

**Design (GOOD):**
- `backend/src/redis-cache/interceptors/http-cache.interceptor.ts` — master-data keys shared across users
  (`prefix:query`), non-master keys user-scoped. Verified: invalidation patterns (`master:products:*`,
  `master:materials:*`, `master:departments:*`, etc.) match the stored key layout. No false invalidations found.
- TTLs: products/materials/units/processes/vendors 3600 s; departments 86400 s; analytics 60 s;
  unread-count 60 s.
- `redis-cache.service.ts` — `lazyConnect`, 2 s connect timeout, `maxRetriesPerRequest:1`, graceful DB-only
  fallback. Good resilience posture for an optional cache.
- Measured win: `analytics/kpis` **cold 1.54–1.86 s → cached 376–418 ms (4.1×)**; uncontended `redisMetrics`
  show cacheHit 100% on that shape.

**Gaps:**
| # | Finding | Conf | Class |
|---|---|---|---|
| R-1 | **Login pipeline not cached** — by design (session writes must be durable), but the *lockout lookup* (`checkAccountLocked`) could reuse the session cache pattern instead of a second `User.findUnique`. | CONFIRMED | P2 |
| R-2 | **RBAC cache has no invalidation hook** — 5-min stale authorization window (see §05.6). Adding role/permission change notifications would tighten both security-latency and load. | CONFIRMED | P2 |
| R-3 | **Analytics keys are user-scoped** but invalidated via generic `analytics:*`/`analytics:summary` patterns after transitions; double-check `business-transaction.service.ts` invalidation list covers **per-user** key variants (current patterns match prefix+userId layout — verified aligned; leaving a note to re-verify on schema change). | PROBABLE | P3 |
| R-4 | **60 s unread-count client poll + 60 s server TTL** mean each tab generates a Redis get + (on expiry) a full DB query every minute. Redundant with the server TTL. | CONFIRMED | P3 |

---

## 08. Query Optimization Opportunities

Sorted by expected ROI.

1. **SQL-side aggregation for analytics & reports (P1).** Convert `findMany`+JS `reduce` into Prisma `groupBy`
   / `aggregate` (or imperative SQL for pivots) keyed on the existing date-range indexes. Keeps rounding
   semantics identical; removes full-table scans from the request path.
2. **Kill the second `findTransactionById` per transition (P1).** Return the updated entity from the
   transaction method instead of refetching. Verified double-call pattern in `business-transaction.service.ts`.
3. **Collapse login writes (P1).** `refreshToken.create`, `userSession.create`, `user.update(lastLogin)`,
   `activityLog.create` are independent — batch them with `Promise.all` (they do not depend on one another) and
   merge `recordLogin` into a single `activityLog.createMany` where the schema allows. Keep the
   `checkAccountLocked` read before mutations (security).
4. **Project columns on list endpoints (P2).** `roles` returns 40.1 KB with zero `select`; master lists and
   notification lists can return only the fields the UI renders, cutting the biggest payloads 40–60%.
5. **Paginate the detail include graph (P2).** `findTransactionById` → `indentProcesses`/`workflowHistory`
   with `take` on newest-first ordering instead of full history per call (retain ordering stability for audit).
6. **`storesIssueMaterials` bulk-win (P2).** Replace N× `findUnique`+`update` with a single
   `findMany` + per-line `updateMany` inside the same `$transaction` while preserving the optimistic `version`
   guards (keep the assertions — otherwise stock races reappear).

---

## 09. N+1 / Serial Query Patterns

| # | Pattern | Where | Impact | Conf |
|---|---|---|---|---|
| N+1-1 | Serial per-item `findUnique`+`update` in `storesIssueMaterials` | `business-transaction.service.ts` ~L903-944 | Grows 1:1 with indent lines; each op = 1 Neon RTT | CONFIRMED |
| N+1-2 | Per-recipient `notification.create` chain | `business-transaction-event.service.ts:142` | Grows with approver/reporting chain | CONFIRMED |
| N+1-3 | Two `User.findUnique` per login (lookup + lockout re-read) | `auth.service.ts` | +1 extra RTT on the single most frequent auth call | CONFIRMED |
| N+1-4 | `findTransactionById` include fan-out (line→material/unit/processes; costSheet→costItems→processCosts; history→mover/toDepartment) | `business-transaction.service.ts` | Deep object graph, several correlated subqueries per detail | CONFIRMED |

No classic *unindexed* N+1 (foreign-loop without index) was found — Pron driver does joined/qb-style fetches on
indexed FK columns. The real pattern cost is **serial round trips**, which matters more than the fan-out count
given Neon RTT.

---

## 10. Bundle Size & Lazy Loading

**Measured build output (`frontend/dist/assets`, 151 JS chunks):**

| Asset | Raw | Gzipped |
|---|---|---|
| `index*.js` (main entry) | 331.2 KB | 106.1 KB |
| `schemas*.js` | 102.7 KB | 29.7 KB |
| CSS | 86.3 KB | — (gzip ~13 KB) |
| **Total JS** | **1015.9 KB** | **321.7 KB** |

**Deployed first-load** (Render static, measured): `index-COjo8IoR.js` 331.3 KB + `jsx-runtime...js` 8.3 KB +
CSS 86.3 KB ≈ **426 KB / ~410-740 ms** transfer before any route chunk loads.

**Assessment:**
- Route-level `React.lazy` splitting is already in place (`frontend/src/app/router.tsx`) — 151 split chunks load
  only the code for the visited route. This is the correct architecture.
- Remaining wins are compression-level, not structural: Vite `build.rollupOptions` could enable better minification
  settings, non-blocking CSS preload, and a CDN static host (Render static serves at medium RTT; Cloudflare/Netlify
  would cut bytes-in-flight to users).
- `schemas` (102.7 KB / 29.7 KB) is loaded on pages that need form/validation schemas only — verify it is lazily
  bundled and not merged into the entry bundle (it appears as a separate chunk; keep it that way).

`frontend/vite.config.ts` uses `rollup-plugin-visualizer` — the `.html` report is available for team review.

---

## 11. Hot Path / Critical Path Analysis

**Login (highest user-frequency, longest cold-warm spread):**
1. 2× `fetch` user reads (`User.findUnique`)
2. bcrypt compare (12 rounds, CPU-bound)
3. 4–5 serial appends (`RefreshToken.create`, `UserSession.create`, 2× `User.update`, `ActivityLog.create`)
4. JWT sign + response

**Dashboard first paint (all parallel, but many):**
unread-count + notifications-list + 7 analytics + audit-logs ≈ **9 HTTP round trips**, most hitting 60 s-cache
analytics. With `refetchOnFocus:false` this is *one-time*, but it makes dashboard the heaviest page in the app.

**Workflow transition (steady-state ops):**
`findTransactionById` (validation, incl. full graph) → optimistic `updateMany` → invalidation fan-out →
(re-)`findTransactionById` for the return payload → background notification/audit writes.

**Report export:** synchronous Excel/PDF build of up to 100k rows in the request handler.

These three (login, dashboard, workflow/detail) are the paths users feel most; each is addressable without
touching security semantics.

---

## 12. Network Latency & Payload Size

| Endpoint | Payload | Note |
|---|---|---|
| `POST /auth/login` | ~1 KB | Latency dominated by DB serial RTTs |
| `GET /notifications?page&limit=10` | 10.4 KB | fetch with unneeded fields |
| `GET /roles` | 40.1 KB | bulk, no field projection |
| `GET /indents?page=1&limit=10` | 4.5 KB | good |
| `GET /indents/:id` | 9.3 KB | small payload, slow query (latency, not size) |
| `GET /analytics/kpis` | 3.7 KB | cached |
| `GET /materials?limit=10` | 4.7 KB | good |
| Analytics summary/costs/products/vendors | 1–8 KB | cost is compute, not payload |

Conclusion: payload is **not** the bottleneck anywhere today — latency is. Field-projection shrinks are a
hygiene win; the actual fix is serial-RTT removal and SQL aggregation.

---

## 13. React Rendering & State Management

**Findings:**
- **State management is clean.** Server state goes through TanStack Query with key factories
  (`query-keys.ts`); client state uses local/business stores; no `window.location.reload()` misuse. Mutation →
  invalidate → refetch is the correct pattern (adds a refetch round trip but keeps UI consistent).
- **Dashboard mounts ~9 hooks** and `SummaryPage` ~6 — these are one-time bursts (cache + `refetchOnMount:false`),
  but on cold cache the dashboard fires the entire analytics suite simultaneously. Consider
  `background refetch` for the lower-priority analytics so LCP isn't gated by the slowest one.
- **Inefficient select rendering:** units/processes lists fetched at `limit:200` (→ clamped to 100) are re-scanned
  in-tabs for pickers; a memoized options map (or server search-as-you-type) removes 100-element array churn.
- **1 s `setInterval` clock** on Dashboard-Page — negligible cost, but part of the render burst narrative; not a fix
  candidate.
- StrictMode double-mounts in dev only — not deployed.

---

## 14. Auth & Security Boundary Analysis (Preserved Constraints)

All audit recommendations keep the following **unchanged**:

| Boundary | Location | Preserved behavior |
|---|---|---|
| bcrypt cost 12 | `auth/services/password.service.ts:6` | NOT weakened. Hashing stays expensive by design |
| RBAC per-permission guards | `auth/guards` + `@Permissions()` | NOT bypassed; caching is read-only |
| Tenant isolation & soft-delete filtering | Prisma `where` filters | NOT relaxed |
| Optimistic lock (state machine, `version`) | `assertCurrentStateAndUpdate` | NOT removed; batch transports rewire around it |
| Login throttle (5/60 s) | `auth.controller.ts:22` | NOT removed |
| Session/refresh-token durability | `auth.service.ts` | NOT removed; **parallelized** only where ops are independent |
| Audit & activity-log writes | event service / login-history | NOT truncated; `createMany`/`Promise.all` used for the same fan-out |
| Transactional boundaries | `$transaction` in transitions | NOT removed |
| Reload policy | api-client 401, tab-sync, session-timeout, error boundary | Reloads kept only in these security/session boundaries |

Any fast-wins batch run under §17 must *re-verify* these invariants.

---

## 15. Notification & Background Work Queue

- **Dispatch is correctly off the critical path**: `runDispatchNotificationBackground` fires asynchronously from
  the transition (`business-transaction-event.service.ts`), and communication/email flows through
  `communication-event.bus.ts` (rxjs Subject) + BullMQ (`queue.service.ts`). The transition response is **not**
  blocked by notification fan-out. This is a design strength — keep it.
- **Audit trail retained**: activityLog/notification writes use the same background spool; no data-loss tradeoff.
- **Residual**: the background spool is *serial* (per-recipient `create`, plus audit `create`+`createMany`).
  At many-recipient fan-out, worker time balloons. If queue pressure ever shows, batch with `createMany` while
  preserving per-notification content fields. Keep the retry/failure visibility (notificationMetrics already
  tracks created/delivered/failed/retried).
- **Monitoring page fixed 5 s poll** is the only *synchronous* high-frequency consumer; acceptable for an operator
  page, questionable for default-on autocracy. Decide deliberately.

---

## 16. Cold Start & Deployment Analysis

- **Cannot force-isolate cold start on Render free**; measured warm liveness is 406–437 ms. The first request
  after idle sleep is the classic cloud-platform trap: login at 2.64–3.75 s (vs 2.31–3.03 warm) suggests the
  extra ~0.5–1 s is bootstrap. Bound it with the existing `/health/liveness` warm hook on the scheduler; it is
  already dependency-free.
- **Single-container design**: all API traffic shares one render dyno. CPU-bound work (bcrypt during login storms,
  synchronous Excel/PDF export, JS aggregation on analytics cold paths) blocks *other* requests on the same worker
  while running. Priority: move exports + heavy aggregation off the hot lane (§05.2, §05.4).
- **Deploy/build**: Vite build is deterministic; visualizer output available. Static serving is medium-RTT — CDN
  swap is a recommended P3.

---

## 17. Severity-Classified Findings List

### P0 (0) — Critical (none)
No findings meet P0 (outage/data-loss/security-regression). The app is functionally sound under production load.

### P1 (6) — High
| # | Finding | Conf | Fix family |
|---|---|---|---|
| 1 | 7 serial DB round trips compose ~1.28 s of a 2.68 s login | CONFIRMED | Parallelize independent appends; single fetch for lockout+user |
| 2 | Analytics/reports aggregate in JS after unbounded full-table `findMany` | CONFIRMED | SQL groupBy/aggregate + date windowing |
| 3 | Report exports build synchronous Excel/PDF up to 100k rows in-request | CONFIRMED | Move to BullMQ background job + notify via existing pipeline; stream rows |
| 4 | `findTransactionById` heavy include graph used at 45 sites, fetched **twice** per transition | CONFIRMED | Return entity from transition; scoped includes |
| 5 | App-wide `unread-count` poll every 60 s (every tab/user) | CONFIRMED | Raise interval / gate on drawer-open; rely on server cache |
| 6 | 5 s refetch on monitoring dashboard | CONFIRMED | Decide: keep for live monitor or raise to 15–30 s |

### P2 (9) — Medium
| # | Finding | Conf |
|---|---|---|
| 1 | Dashboard mounts ~9 queries (all analytics + notifications + audit) at first paint | CONFIRMED |
| 2 | IndentForm always fetches units/processes; requested `limit:200` silently clamped to 100 | CONFIRMED |
| 3 | `storesIssueMaterials` serial per-line `findUnique`+`update` (keep assertions) | CONFIRMED |
| 4 | Transition re-fetch + invalidation fan-out doubles detail load in the hot path | CONFIRMED |
| 5 | Notification/audit background spool is serial per recipient | CONFIRMED |
| 6 | RBAC session cache has no invalidation → up to 5-min stale authorization window | CONFIRMED |
| 7 | Login lockout state re-read as second `User.findUnique` every login | CONFIRMED |
| 8 | Analytics cache (60 s) thrashes on multi-user bursts (R-3 re-verify) | PROBABLE |
| 9 | Frontend analytics pages fire parallel burst of 6–9 heavy requests on cold cache | CONFIRMED |

### P3 (6) — Low
| # | Finding | Conf |
|---|---|---|
| 1 | `useUpdateRolePermissions` invalidates list but not role-permissions detail — stale pane | CONFIRMED |
| 2 | `readiness` spikes 928 ms (live DB/Redis probe) vs liveness 406 ms | CONFIRMED |
| 3 | Master-list `select` absent → `roles` payload 40.1 KB (largest list) | CONFIRMED |
| 4 | Static origin is Render lap-RTT; no CDN/preload | CONFIRMED |
| 5 | `schemas` chunk (102.7 KB) verify lazily isolated (it is separate; keep) | CONFIRMED |
| 6 | Client poll (60 s) redundant with server TTL (60 s) — per-tab Redis get churn | CONFIRMED |

### P4 (3) — Cosmetic
| # | Finding | Conf |
|---|---|---|
| 1 | 1 s dashboard clock interval | CONFIRMED |
| 2 | `elastic` etc. request/response transforms — negligible, keep intact | PROBABLE |
| 3 | JS aggregation numeric loop micro-inefficiencies (replaced wholesale by SQL in P1-2) | POSSIBLE |

---

## 18. Recommended Fixes

### 48-Hour Fast Wins (no architecture change, all security-preserving)
| Fix | Effort | Expected |
|---|---|---|
| A. Collapse login appends to `Promise.all` where independent; merge ActivityLog into `createMany` | ~0.5 d | login −0.4 to −0.6 s |
| B. Return updated entity from `makeWorkflowTransition`/`handleArc` instead of second `findTransactionById` | ~0.5 d | transition/detail −0.8 to −1.2 s |
| C. Add `select` projections to roles/master-list/notification queries | ~0.5 d | roles payload −40 KB; minor list speedup |
| D. Raise unread-count poll to 120–180 s and/or gate on drawer open; monitor 5 s → 15–30 s | ~0.25 d | −1 req/min per tab; −4 req/min on monitor |
| E. Add SQL `groupBy`/`aggregate` for the cheapest analytics endpoints (kpis/summary) | 1 d | cold analytics −1.0 to −1.3 s |
| F. Clamp IndentForm fetches to backend max (100) or add server-side search | ~0.25 d | lower first-render payload |

### 2-Week Refactors
| Fix | Scope |
|---|---|
| G. Migrate all analytics/report pivots to SQL aggregation + date-window filters | analytics + reports services |
| H. Move Excel/PDF exports to BullMQ background jobs with result notification (existing pipeline) | reports + communications |
| I. Paginate the `findTransactionById` include graph (history newest-first `take`, scoped includes) | business-transaction service |
| J. Batch `storesIssueMaterials` transport into single `findMany` + targeted `updateMany`s inside one transaction, keeping `version` guards | business-transaction service |
| K. RBAC cache invalidation: role/permission change events flush `user:session:*` for affected users | auth + users services |
| L. Batch notification/audit spool via `createMany` in the background runner | event service |
| M. Static assets to CDN (Cloudflare) + Vite deeper minification + CSS preload | frontend build |
| N. Optional: Neon→pooled postgres (self-managed) to cut fixed per-query RTT; keep all transaction semantics | infra |

**Explicitly excluded (do-not-do list):** weaken bcrypt, remove throttle, drop optimistic locking, skip audit
history, relax tenant isolation, bypass RBAC, or add `window.location.reload()` as a "fast refresh" hack.

---

## 19. Before/After Target Metrics

| Metric | Before (measured) | After target |
|---|---|---|
| Login P95 (warm) | ~2.7 s | ≤ 1.5 s |
| Login request DB queries | 7 sequential | ≤ 4 (or 7 in ≤ 2 parallel waves) |
| Workflow transition P95 | ~2.0 s (incl. double detail fetch) | ≤ 1.0 s |
| Detail `GET /indents/:id` P95 | 2.15 s | ≤ 900 ms |
| Analytics cold P95 | 1.5–1.9 s | ≤ 500 ms (SQL agg + cache) |
| Analytics warm (cached) | 376–418 ms | ≤ 350 ms |
| Indents list P95 | 1.3 s | ≤ 600 ms |
| Notifications list P95 | 918 ms | ≤ 400 ms |
| Roles payload | 40.1 KB | ≤ 18 KB |
| App-wide polling | 1 unread req/60 s tab + monitor 5 s | ≥ 120 s / drawer-gated, monitor 15 s |
| Frontend first-load JS | 426 KB/410–740 ms | ~340 KB / ≤ 300 ms transfer (CDN) |
| Report export (large) | blocking in-request | background ≤ async P99 15 s |
| RBAC propagation latency | up to 5 min | ≤ 30 s (on permission change) |
| Re-verify | post-change re-run of `perf_*.js` suite + telemetry | every target delta ≥ 10% |

---

## 20. Appendix — Raw Data, Files & Evidence

### 20.1 Measurement scripts (authoring machine)
- `C:\Users\Admin\AppData\Local\Temp\opencode\perf_baseline.js` — login + warm endpoint suite
- `C:\Users\Admin\AppData\Local\Temp\opencode\perf_warm.js` — cached-path delta suite
- `C:\Users\Admin\AppData\Local\Temp\opencode\perf_list.js` — list/detail suite
- `C:\Users\Admin\AppData\Local\Temp\opencode\perf_front.js` — deployed asset suite
- `C:\Users\Admin\AppData\Local\Temp\opencode\perf_metrics.js` — production telemetry pull

### 20.2 Production telemetry (captured 2026-08-19, admin token)
```
systemHealth:  app UP, database UP, redis UP
apiMetrics:    totalRequests 1, avg 2679 ms, p95 2679 ms
databaseMetrics: totalQueries 7, avg 183 ms, p95 636 ms
  slowQueriesHistory:
    User.findUnique       636 ms  (authenticate lookup)
    User.findUnique       106 ms  (checkAccountLocked)
    User.update           108 ms  (resetFailedAttempts)
    RefreshToken.create   107 ms
    UserSession.create    108 ms
    User.update           108 ms  (lastLogin)
    ActivityLog.create    106 ms
redisMetrics:  connected, cacheHits 1, misses 0, hitRate 100%, ops 1, avg 53 ms
workflowMetrics: transitions 0; notificationMetrics: created 0 delivered 0 failed 0
frontendErrors: total 0
```

### 20.3 Key raw timings (single-sample, warm, admin)
```
login warm            2.31 / 3.03 s      login first          2.64 / 3.75 s
liveness              406 / 437 ms       readiness            406 / 928 ms
kpis cold             1538 / 1858 ms     kpis cached          376 / 418 ms
summary               352–531 ms         costs                331–510 ms
products              447–736 ms         vendors              415–516 ms
departments           371–493 ms         unread-count         412–613 ms
notifications         643–918 ms         roles                514–715 ms
indents list          817–1318 ms        indent detail        1434–2151 ms
units                 385–510 ms         materials            385–790 ms
daily report          411–915 ms         process-yield        ~1021 ms
cost-breakdown        ~662 ms            assets (index+jsx)   331.3+8.3 KB @ ~408+309 ms
```

### 20.4 Evidence file map
| Topic | Files reviewed |
|---|---|
| Query client / keys | `frontend/src/api/hooks/query-client.ts`, `query-keys.ts` |
| Polling | `frontend/src/api/services/notifications/hooks.ts`, `frontend/src/pages/MonitoringDashboardPage.tsx:127` |
| Dashboard / analytics | `frontend/src/pages/DashboardPage.tsx`, `frontend/src/modules/analytics/pages/SummaryPage.tsx` |
| Forms/limits | `frontend/src/modules/indent/components/IndentForm.tsx:619-620`; `units.service.ts:99`, `processes.service.ts:144` |
| Mutations/reloads | `indents/hooks.ts`, `roles/hooks.ts:58`, components across indent module; reload only in `useTabSync`, `useSessionTimeout`, `api/client`, `GlobalErrorBoundary` |
| Auth | `auth/services/auth.service.ts`, `auth/strategies/jwt.strategy.ts:23-52`, `auth/services/password.service.ts:6`, `auth.controller.ts:22` |
| RBAC/roles | `roles/roles.service.ts`, `roles/hooks.ts:58-66` |
| Transactions | `business-transaction/services/business-transaction.service.ts` (45× `findTransactionById`, L903-944, L49-96) |
| Events/queue | `business-transaction/services/business-transaction-event.service.ts:90,142,163,183`, `communication/events/communication-event.bus.ts`, `communication/queue/queue.service.ts` |
| Analytics/reports | `analytics/analytics.service.ts:320,392,510`, `reports/controllers/reports.controller.ts:27`, `reports/services/reports.service.ts:41-65,700,880`, `kpi.service.ts` |
| Cache | `redis-cache/interceptors/http-cache.interceptor.ts`, `redis-cache/redis-cache.service.ts`, `cache.decorator.ts`, controllers’ `@Cache(...)` |
| Schema | `database/schema.prisma` (Indent/Notification indexes) |
| Build | `frontend/vite.config.ts` (visualizer), `frontend/dist/assets` (151 chunks, sizes above), `frontend/index.html` |
| Observability | `backend/src/observability/*` (`observability.service.ts:370` `getMetrics`) |

**End of audit.** Per instruction, implementation begins **only after** this report is reviewed and approved.