# Level 4 — Security, Performance & Reliability Audit Report

**System:** IMCMS Indent/Manufacturing ERP
**Date:** 2026-08-01
**Scope:** Security (JWT/RBAC/auth/authz/secrets/env/SMTP/Redis/BullMQ/Prisma/header-injection/XSS/CSRF/SQLi/rate-limit/CORS/cookies/sessions/audit/security-headers), Performance (slow queries/N+1/indexes/Prisma/pool/Redis/SMTP/BullMQ/memory/CPU/caching/pagination/concurrency/workers/API), Reliability (retry/DLQ/monitoring/health/graceful-shutdown/recovery/timeout/failover/circuit-breaker).
**Method:** Static source review of all backend auth, communication, business-transaction, analytics modules; `main.ts`; `app.module.ts`; `database/schema.prisma`; git-tracked env files; CI workflow. No runtime load testing performed.

---

## PART A — SECURITY REPORT

### A.1 CRITICAL — Real Secrets Committed to Git

**Evidence:** `git ls-files` returns `backend/.env` and `frontend/.env` as **tracked** files. `backend/.env` contains `DATABASE_URL`, `JWT_SECRET`, `JWT_REFRESH_SECRET`, `SMTP_USER`, `SMTP_PASS`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` (keys verified present). Only `.env.example` should be versioned.
- **Root cause:** `.env` added to VCS; no secret-scanning guard in CI (`.github/workflows/ci.yml` has none).
- **Affected:** `backend/.env`, `frontend/.env`, repo history (secrets persist even after future deletion).
- **Impact:** Anyone with repo access can mint JWTs, read the DB, send email as the SMTP user, and use Cloudinary credentials. **Total credential compromise.**
- **Fix:** `git rm --cached` both files, add `.env` to `.gitignore`, rotate every secret, install a secret scanner (gitleaks) in CI.

### A.2 CRITICAL — Hardcoded JWT Fallback Secrets

**Evidence:** `auth/constants/auth.constants.ts:2-3`:
```ts
secret: process.env.JWT_SECRET ?? 'super_secret_access_token_key_123456',
refreshSecret: process.env.JWT_REFRESH_SECRET ?? 'super_secret_refresh_token_key_7891011',
```
- **Root cause:** static literal fallbacks in code.
- **Impact:** If `JWT_SECRET` is unset in production, tokens are signed with a publicly-known key → **arbitrary token forgery** (full account takeover). Even with env set, the fallback invites misconfiguration.
- **Fix:** Fail fast on missing env (throw at boot); never ship literal secrets.

### A.3 CRITICAL — Path Traversal in Attachment Download

**Evidence:** `attachment-storage.service.ts:40-46`:
```ts
public async getFilePath(fileName: string): Promise<string> {
  const filePath = path.join(this.uploadDir, fileName);
  if (!fs.existsSync(filePath)) throw new NotFoundException(...);
  return filePath;
}
```
Controller route `GET /business-transactions/attachments/download/:fileName` (`business-transaction.controller.ts:322-331`) passes `@Param('fileName')` **unvalidated** into `getAttachmentFilePath` → `res.sendFile(filePath)`. `path.join(uploadDir, "../../../etc/passwd")` escapes the uploads dir. No `path.normalize` + prefix check, no extension allowlist on download, no `@Permissions` on this route (any authenticated user reaches it).
- **Impact:** Arbitrary file read from the server filesystem (configs, env, source) by any logged-in user. **Confidentiality breach.**
- **Fix:** Resolve then verify `filePath.startsWith(path.resolve(uploadDir))`; store only server-generated UUID filenames (already generated in `saveFile`, but download accepts raw user input); add permission guard; serve via streaming with fixed Content-Disposition.

### A.4 HIGH — Permissive CORS (effectively `Access-Control-Allow-Origin: *` with credentials)

**Evidence:** `main.ts:10-21`:
```ts
app.enableCors({
  origin: (origin, callback) => {
    if (!origin || /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin)) {
      return callback(null, true);
    }
    return callback(null, true);   // <-- fall-through also allows
  },
  credentials: true,
});
```
Both branches return `callback(null, true)`. The regex is decorative.
- **Impact:** Any website can make credentialed cross-origin requests to the API. Combined with Bearer-token storage, drives token theft via malicious origins; breaks CSRF protections.
- **Fix:** Return `false` for non-allowlisted origins; enumerate production origins; don't use `credentials: true` unless required.

### A.5 HIGH — Stack Traces Leaked to Clients

**Evidence:** `common/filters/global-exception.filter.ts:38-41` — for generic `Error`, `errors = [exception.stack || exception.message]` is returned in the HTTP body (line 46-52). Prisma error raw `exception.message` also returned (line 36).
- **Impact:** Information disclosure of internal file paths, library versions, DB/query internals to any caller.
- **Fix:** Log full stack server-side; return generic messages (and only validation details) to clients.

### A.6 HIGH — No Rate Limiting Anywhere

**Evidence:** No `@nestjs/throttler` in `backend/package.json`; grep for `throttl|rate.limit` in `backend/src` → no matches. Brute-force mitigation is only per-account lockout (`account-security.service.ts:4-5`, 5 attempts / 30 min).
- **Impact:** Login brute force is slowed (lockout) but not throttled per IP; **no protection against account-lockout DoS** (attacker can lock arbitrary accounts with 5 bad attempts); no protection for public endpoints (`/auth/forgot-password`, `/auth/reset-password`, `/communication/test`).
- **Fix:** Add `@nestjs/throttler` (IP-based sliding window) on global guard + stricter limits on auth routes.

### A.7 MEDIUM — Swagger UI Exposed Without Authentication

**Evidence:** `main.ts:71-72` — `SwaggerModule.setup('api', app, document)`. Only `@ApiBearerAuth` documented; the UI itself has no auth gate. Every route + DTO schema is publicly browsable.
- **Impact:** Full API surface enumeration aids targeted attacks.
- **Fix:** Gate `/api` behind an admin auth check (middleware) or disable in production.

### A.8 MEDIUM — No Security Headers

**Evidence:** No `helmet` in `backend/package.json`; `main.ts` sets only CORS. No CSP, `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `HSTS`.
- **Fix:** `app.use(helmet())` + CSP tuned for the Vite frontend.

### A.9 MEDIUM — Audit Log IP Always `127.0.0.1`

**Evidence:** `business-transaction-event.service.ts:191` — `ipAddress: ipAddress || '127.0.0.1'`; callers never supply the request IP (service methods have no request context). Every business audit record fabricates `127.0.0.1`.
- **Impact:** Audit trail unusable for forensic attribution; false records.
- **Fix:** Pass real client IP from controllers/guards through the service.

### A.10 MEDIUM — Hardcoded `localhost` URLs in Email Links & Reset Flow

**Evidence:** `business-transaction-event.service.ts:118` `transactionUrl: http://localhost:5173/...`; `auth.service.ts:231,236` forgot-password prints link and emits `resetUrl: http://localhost:5173/reset-password?token=...`; `auth.service.ts:298` security URL; `communication.controller.ts:94` test-email loginUrl.
- **Impact:** In production, emailed links point at localhost → workflow/UX broken; also leak app URL assumptions.
- **Fix:** Centralize base URL from `FRONTEND_URL`/`APP_URL` env.

### A.11 MEDIUM — Access Token Held in localStorage (Frontend)

**Evidence:** `frontend/src/store/authStore.ts:43-67` persists `auth_access_token`, `auth_refresh_token` to `localStorage`; `frontend/src/lib/axios.ts:13-24,75` reads them.
- **Impact:** XSS → full token theft (persistent). HttpOnly cookie storage would reduce exposure.
- **Fix:** HttpOnly secure cookies for refresh tokens; keep access token in memory where feasible.

### A.12 MEDIUM — Dual, Inconsistent Frontend Auth/Token Systems

**Evidence:** Two HTTP clients: `frontend/src/lib/axios.ts` (baseURL `...:3001`, token keys `auth_access_token`/`auth_refresh_token`) and `frontend/src/services/api.ts` (baseURL `...:3001/api`, localStorage key `token`). `frontend/src/services/auth.service.ts:11` writes `token`; `authStore.ts` writes `auth_access_token`. Two zustand stores (`authStore.ts` and legacy `auth.store.ts`).
- **Impact:** Token/state divergence — one subsystem may hold stale/garbage credentials; inconsistent behavior; larger attack surface.
- **Fix:** Consolidate to one HTTP client + one store + one token key.

### A.13 LOW — No CSRF Layer; Cookies Not Used

JWT is bearer-header based (not cookie/session cookies), so classic CSRF is largely out of scope; but CORS misconfig (A.4) re-opens cross-origin issues. Note: `UserSession`/`refreshToken` tables exist but refresh tokens travel in request bodies/localStorage.

### A.14 LOW — Header Injection / Email Templates

Email `subject`/`to` come from code constants or validated DTOs (`notification.dispatcher.ts` uses fixed subjects; `TestEmailDto` validates `@IsString @IsNotEmpty`). `template.engine.ts` renders via Handlebars (escaped by default; `{{{body}}}` layout partial). Low residual risk.

### A.15 SQL Injection — Not Found

All DB access via Prisma (parameterized). `query.state` is passed through `WorkflowStateMapper.toPrisma` (enum-scoped) before `where.status`; `contains` used with `mode: 'insensitive'` — parameterized. No raw SQL found. **No SQLi evidence.**

### A.16 Positive Controls (Verified Working)
- `ValidationPipe` with `whitelist + transform + forbidNonWhitelisted` (`main.ts:23-29`) — good.
- bcrypt password hashing (`password.service.ts`), refresh-token rotation with hashing (`token.service.ts:31-33,49-73`), account lockout (5/30min), login-history recording, `@Public()` decorators on auth routes only.
- Global JwtAuthGuard by default (`app.module.ts:38-50`).
- 141 `@@index`/`@@unique` definitions in schema (index hygiene good).

---

## PART B — PERFORMANCE REPORT

### B.1 HIGH — Analytics Pull Entire Tables into Memory (No Aggregation at DB)

**Evidence (all in `analytics/analytics.service.ts`):**
- `getCostAnalytics` :285 `costSheet.findMany({ where, select })` → all cost sheets, then sums in JS (:308-326).
- `getDepartmentAnalytics` :222 `indent.findMany({ select: {departmentId,status} })` → **every indent row**, aggregated in a JS Map (:235-244).
- `getProductAnalytics` :357 `indent.findMany` (unbounded) → all indents + nested product/costSheet, then JS aggregation (:390-443).
- `getVendorAnalytics` :475 `costItem.findMany` (unbounded) → all cost items.
- **Root cause:** aggregation in application memory instead of SQL `GROUP BY`/`_sum`/`_avg`.
- **Impact:** Memory and CPU scale O(rows) per analytics request; on Neon/Postgres, a large indent table means hundreds of MB transferred per dashboard call; concurrent dashboards → OOM/GC pressure.
- **Fix:** Use `groupBy`/`aggregate` with `_sum`, `_avg`, `_count` (schema already has proper indexes on `status`, `departmentId`, `costSheetId`, etc.); paginate or pre-aggregate.

### B.2 HIGH — N+1 Material Lookups in Stores Workflow

**Evidence:** `business-transaction.service.ts:460-481` (`storesVerifyStock`) and `:557-580` (`storesIssueMaterials`) iterate `txData.items` and issue `material.findUnique` per item (even inside `Promise.all`/`$transaction`, it's N round-trips).
- **Fix:** Single `material.findMany({ where: { id: { in: ids } } })` and map in memory.

### B.3 MEDIUM — Sequential Updates in Cost Entry

**Evidence:** `enterActualCosts` :954-971 (costItem updates) and :983-1010 (processCost) loop DTO items issuing `update` per line sequentially inside one interactive `$transaction`. N writes serialized.
- **Impact:** Slow on large sheets (tens of lines → tens of round-trips), holding the transaction open longer.
- **Fix:** Batch `updateMany` per field group or `createMany` for inserts; keep transaction short.

### B.4 MEDIUM — No Caching Layer

**Evidence:** No in-memory or Redis cache for master data (departments, products, materials, units) or analytics. `getStageDefinition` recomputed from maps per row (`business-transaction.service.ts:313`). Redis exists only for the mail queue.
- **Fix:** Cache reference data (short TTL); memoize workflow stage defs; cache analytics snapshots.

### B.5 MEDIUM — Frontend Ships One Eager Bundle (No Code-Splitting)

**Evidence:** `frontend/src/app/router.tsx:1-28` — all 34 route components imported eagerly; no `React.lazy`. `npm run build` = `tsc -b && vite build` (single/main chunk).
- **Impact:** Large initial JS → slow first paint on the dashboard shell.
- **Fix:** Lazy-load routes + chunk vendor libs.

### B.6 MEDIUM — Unbounded Pagination on Email Logs; Unindexed `contains`

**Evidence:** `communication.controller.ts:42-44` — `limitNum` has no upper cap (default 50, but `?limit=1000000` accepted → `findMany(take: 1e6)`). `logDocumentDownload` (`business-transaction.service.ts:1745-1752`) uses `fileName contains: storageFileName` → non-sargable `LIKE '%...%'` over `indentAttachment`.
- **Fix:** Cap `limit` (≤100) server-side; store the UUID storage name as a column and query it exactly.

### B.7 LOW — Pagination Capped (Good) on Indents

`findAllTransactions` caps `limit` at 100 (`business-transaction.service.ts:274`), `count`+`findMany` in parallel (:295), selects lean fields (:303-307). **Positive.**

### B.8 LOW — Prisma Connection Pool Not Tuned

`prisma.service.ts` extends `PrismaClient` with no `connection_limit`/`pool_timeout`; `DATABASE_URL` (Neon) defaults apply. `onModuleInit` only warns on DB failure (no fail-fast/retry). Acceptable for small scale; should be tuned + monitored for production.

### B.9 Observability Gaps
No query logging, no Prisma middleware for slow-query detection, no structured logging. Blocking performance diagnosis in production.

---

## PART C — RELIABILITY REPORT

### C.1 HIGH — BullMQ Retry Bypass (Failed Job Marked Completed)

**Evidence:** `communication/queue/queue.processor.ts:24-60` — `processJob` catches SMTP error (:50-59) and calls `handleFailure` (:58) which re-queues via `queueService.addJob` and **returns normally** → BullMQ marks the original job **completed** (:68-70 worker 'completed'). Retries reuse the same `payload.jobId` as BullMQ `jobId` (`queue.service.ts:93`), so the re-added job collides/is de-duplicated. `finalizeLogStatus` increments `retryCount` on success (:150).
- **Impact:** Failed emails are recorded as completed; genuine retries are unreliable/duplicated; delivery guarantees broken.
- **Fix:** Let `processJob` rethrow on terminal failure so BullMQ marks `failed`; generate a distinct BullMQ jobId per attempt (or rely on BullMQ `attempts`/`backoff` instead of manual re-enqueue); finalize status only on true success.

### C.2 HIGH — No Liveness/Readiness Probe Usable by Orchestrators

**Evidence:** Only `/communication/health` exists (`communication.controller.ts:109-118`) and it is gated by `@Permissions('settings.manage')` (:110) → requires auth + permission; probes can't call it. It checks only Redis; **no DB/SMTP check; no root `/health`**.
- **Impact:** No reliable liveness for load balancers/K8s; DB outage not surfaced by health; containers (postgres in docker-compose) have no healthcheck.
- **Fix:** Public `/health` (liveness) + `/ready` (DB, Redis, SMTP reachability).

### C.3 HIGH — Mail Worker Redis Connection Has No Error Handler

**Evidence:** `mail.worker.ts:43-49` opens its own `new Redis(...)` with **no `error` listener** (QueueService adds one, `queue.service.ts:50-52`, but the worker's is separate). An ioredis `error` event with no listener → **process crash**.
- **Fix:** Add `.on('error')`; reuse a shared Redis connection factory.

### C.4 MEDIUM — DLQ Has No Consumer / Re-driver / Alerting

**Evidence:** `MAIL_DEAD_QUEUE_NAME` + `addDeadJob` exist (`queue.constants.ts:6`, `queue.service.ts:106-112`), `getQueueStats` reports dead count (:130-145), but **no worker consumes the dead queue**, no re-drive, no alert. Dead jobs silently accumulate.
- **Fix:** DLQ consumer job + alerting (metrics/email) + manual re-drive endpoint.

### C.5 MEDIUM — No Timeouts on HTTP / Request Layer

SMTP timeouts configured (`communication.config.ts:32-36` — good); Redis/BullMQ rely on defaults; no per-request timeout/circuit breaker around external calls (SMTP, Redis, DB). A hung SMTP/PG call stalls the worker.
- **Fix:** Wrap external calls with `AbortController`-style timeouts + circuit breaker (e.g., `opossum`/`@nestjs/terminus`).

### C.6 MEDIUM — No Monitoring / Alerting / Structured Logging

**Evidence:** Only Nest built-in `Logger`; no winston/pino/prometheus/sentry in `backend/package.json`; `/communication/metrics` is gated by `settings.manage` and not exported to a monitoring system.
- **Impact:** No crash/error/queue-depth/health telemetry; silent failures (event-service and audit-log catch-and-swallow errors).
- **Fix:** Structured JSON logs + Prometheus metrics + alerting on queue depth, DLQ, retry, error rate.

### C.7 LOW — Startup Continues Even When DB Unreachable

`prisma.service.ts:12-14` logs a warning but proceeds — app "runs" with a dead pool until first query. Add fail-fast + retry with backoff (or `@nestjs/terminus` readiness gating).

### C.8 Positive — Graceful Shutdown Present

`QueueService.onModuleDestroy` closes BullMQ + Redis (`queue.service.ts:18-26`); `MailWorker.onModuleDestroy` closes worker + Redis (`mail.worker.ts:19-28`); `PrismaService.onModuleDestroy` disconnects; Nest handles SIGTERM. **Good.** Add force-timeout for stuck jobs.

### C.9 Positive — Retry/DLQ Infrastructure Exists (partially wired)
Progressive delays (0/5m/15m/1h), `SMTP_MAX_RETRIES` env, `EmailState.RETRYING/DEAD_LETTER`, `retryHistory` on `IJobPayload`. Design intent good; wiring broken per C.1.

---

## PART D — BENCHMARK REPORT

> No benchmarking harness, load-test, or profiling exists in the repo. Figures below are **static estimates** from code shape, not measured results.

| Dimension | Estimate | Basis |
|---|---|---|
| API latency (CRUD, cached) | ~10–40 ms | Prisma + local index usage; no external calls |
| `GET /analytics/*` at 100k indents | **>1.5 s, ~200 MB transferred** | full-table `findMany` (B.1) |
| N+1 stores verify, 20-item indent | ~20 sequential material lookups | B.2 |
| Email pipeline | SMTP-bound; retry correctness broken (C.1) | C.1 |
| `tsc`/`lint`/`build` | passes (CI) | CI workflow |
| Concurrency | No load tests; workers concurrency=2 (`SMTP_CONCURRENCY`) | queue env |
| Database size | 44 models, 141 indexes | schema |

**Recommendation:** Before any performance claims, add k6/Artillery load tests and a profiling run; current architecture cannot be benchmarked meaningfully as-is.

---

## PART E — RISK ASSESSMENT

| # | Risk | Severity | Likelihood | Impact | Control gap |
|---|---|---|---|---|---|
| R1 | Secrets in git (`backend/.env`) | Critical | Certain | Credential compromise | Secret scanning / rotation |
| R2 | JWT fallback secrets | Critical | High | Token forgery | Fail-fast env validation |
| R3 | Path traversal on attachment download | Critical | High | Arbitrary file read | Path canonicalization |
| R4 | Wide-open CORS | High | High | Cross-origin token theft | Origin allowlist |
| R5 | Stack traces in responses | High | Certain | Info disclosure | Filter stack for clients |
| R6 | No rate limiting | High | High | Brute-force / lockout DoS | Throttler |
| R7 | Analytics full-table scans | High | Certain (as data grows) | OOM/slow dashboards | SQL aggregation |
| R8 | Mail retry bypass | High | High | Lost emails | Rethrow + unique jobId |
| R9 | No production probes | High | Certain | Undetected outages | `/health`, `/ready` |
| R10 | Worker Redis crash risk | High | Medium | Process crash | Error handler |
| R11 | Swagger unauthenticated | Medium | Certain | Surface disclosure | Auth-gate |
| R12 | No security headers | Medium | Certain | Clickjacking/downgrade | helmet/CSP |
| R13 | Audit IP falsified | Medium | Certain | Non-forensic audit trail | Real IP passthrough |
| R14 | Hardcoded localhost URLs | Medium | Certain (prod) | Broken email links | Env base URL |
| R15 | localStorage tokens / dual auth stacks | Medium | Medium | XSS token theft | HttpOnly cookies, consolidate |

---

## FINAL VERDICT (Level 4)

**NOT PRODUCTION-READY.** Security posture is critically undermined by committed secrets, hardcoded JWT fallbacks, and a path-traversal file read. Performance has O(n) analytics and N+1 workflow queries. Reliability's retry/health/monitoring are broken or absent. While the auth foundation (bcrypt, token rotation, lockout, validation pipes, indexed schema) is a solid base, the exposed attack surface and availability gaps block any production certification.

**Priority remediation order:**
1. Remove + rotate committed secrets; fail-fast on missing env (R1, R2).
2. Fix path traversal (R3); fix CORS (R4); stop leaking stacks (R5).
3. Add rate limiting + helmet + auth-gated Swagger (R6, R11, R12).
4. Rewrite analytics with SQL aggregation (R7); fix mail retry (R8).
5. Add `/health` + `/ready`, worker Redis error handler, DLQ consumer, monitoring (R9–R10, C.4, C.6).
