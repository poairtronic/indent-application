# INDENT APPLICATION — FINAL NEON DATABASE OPTIMIZATION AUDIT

**Audit Date:** 2026-11-26  
**Audit Scope:** Strict Read-Only Evidence-Based Verification of Neon Compute Optimization (Phases 1–5 + Deployment Fixes)  
**Target Baseline:** 8.26 CU-hours (reported November 17, 2026)  
**Repository Commits Inspected:** `2dd6c76` (`feat(neon): safe event-driven schedulers, email queue lease safety, and notification optimization (phases 1-5)`) and `f825ab9` (`fix(backend): bundle hbs templates, fix middleware wildcard, expose overdue alerts, and harden mail worker`)  

---

## 1. Executive Summary

This audit independently verified all 37 optimization items across the Indent Application's backend (NestJS + Prisma + Neon PostgreSQL) and frontend (React + Vite + TanStack React Query).

- **Source-Code Verification:** All core Neon compute optimizations (Phases 1–5 and deployment hardening) are implemented in the repository. Event-driven email queue processing (`MailQueueEventBus` + `PostgresMailWorker` with 60s lease, 15s heartbeat, `AbortController`, `FOR UPDATE SKIP LOCKED`, hourly stuck-job recovery, and safe non-releasing shutdown), twice-daily `OverdueMaterialScheduler` (`0 0 9,15 * * *` in `Asia/Kolkata`), 4-hour `RmIntegrationService` outbox fallback (`0 0 */4 * * *`), 0-SQL liveness probe + 30s TTL cached readiness probe, and 5-minute foreground-only unread notification polling (`refetchIntervalInBackground: false`) are present and verified by unit tests.
- **Notable Source Limitations Identified:**
  1. `MonitoringDashboardPage.tsx` still polls `/observability/metrics` every `30000` ms (`refetchInterval: 30000`) without `refetchIntervalInBackground: false`, though `getMetrics()` is in-memory (0 SQL queries).
  2. `ObservabilityService` readiness caching and `PostgresMailWorker` in-memory wakeup bus are single-instance in-memory mechanisms (expected for single-container Render deployment, but noted for horizontal scaling).
  3. `RmIntegrationService` cron (`@Cron('0 0 */4 * * *')`) does not specify `timeZone`, defaulting to container/UTC time rather than `Asia/Kolkata` (acceptable for a 4-hour interval, unlike wall-clock schedules).
  4. `npm --prefix frontend run lint` fails globally with 175 pre-existing errors (174 Prettier formatting errors + 1 `consistent-return` error in unrelated files), though the Phase 5 modified files (`hooks.ts`, `notification-polling.test.tsx`) pass ESLint with 0 errors and 0 warnings.
- **Runtime & Compute Verification:** Live Render HTTP health endpoints (`/api/observability/health/liveness` and `/api/observability/health/readiness`) responded `200 OK` (`UP`). However, Render deployment logs/container version, Neon Console/API CU-hour metrics, and `pg_stat_activity` / idle connection telemetry are **not accessible** from this read-only audit environment.

**ACTUAL NEON COMPUTE REDUCTION: NOT YET MEASURABLE.**

---

## 2. Application Architecture

- **Frontend:** React + TypeScript + Vite (`frontend/`), deployed as a Render Static Site (`indent-application-frontend`). Uses TanStack React Query (`QueryClient` in `frontend/src/api/hooks/query-client.ts`) and Axios (`frontend/src/api/client/index.ts`).
- **Backend:** NestJS 11 + TypeScript + Prisma ORM v6.19.3 (`backend/`), deployed as a Render Web Service (`indent-application`, Node 24, region `ohio`) with `app.enableShutdownHooks()` enabled in `backend/src/main.ts`.
- **Database:** Neon PostgreSQL (`database/schema.prisma`), accessed via `DATABASE_URL` (pooled PgBouncer connection string: `sslmode=require&connection_limit=20&pool_timeout=15&pgbouncer=true`) and `DIRECT_URL` (`sslmode=require`).
- **Async / Background Processing (PostgreSQL-backed, no Redis):**
  - **Email Queue:** `PostgresQueueService` persists `email_jobs` rows and emits in-process wakeups on `mailQueueEventBus` (`EventEmitter`), consumed by `PostgresMailWorker`.
  - **Schedulers:** `@nestjs/schedule` (`ScheduleModule.forRoot()` in `AppModule`) drives `OverdueMaterialScheduler` (09:00 & 15:00 IST) and `RmIntegrationService.handleOutboxRetry()` (every 4 hours).
  - **Observability:** `ObservabilityController` + `ObservabilityService` track in-memory metrics via `observabilityEventBus` and expose liveness/readiness probes.

---

## 3. Previously Implemented Optimizations

Based on `git show --stat 2dd6c76 f825ab9` and `docs/neon-optimization/`:
1. **Phase 1 & 1.1–1.2 (Email Queue):** Replaced continuous DB polling with `MailQueueEventBus` event-driven wakeups, hourly stuck-job recovery (`3600000` ms), 60s lease (`SMTP_LOCK_DURATION`), 15s heartbeat (`SMTP_HEARTBEAT_INTERVAL_MS`), `AbortController` propagation to `GmailApiProvider`, `renewLockWithStatus()` distinguishing `LEASE_LOST` vs `DB_ERROR`, and safe non-releasing shutdown.
2. **Phase 2 (Overdue Material Scheduler):** Changed cron from every 15 minutes to `0 0 9,15 * * *` (`Asia/Kolkata`) with distributed lock in `application_settings` and batch notification lookup.
3. **Phase 3 (RM Integration Outbox):** Changed fallback retry cron from every 30 minutes to `0 0 */4 * * *` (every 4 hours) with in-flight `Set` guard and distributed lock.
4. **Phase 4 (Health Checks):** Confirmed 0-SQL liveness probe and added 30s TTL readiness cache + active DB traffic reuse (`lastSuccessfulDbQueryTime`) in `ObservabilityService`.
5. **Phase 5 (Frontend Notification Polling):** Set `useUnreadNotificationCount()` `refetchInterval` to `300_000` ms (5 min), `refetchIntervalInBackground: false`, `refetchOnWindowFocus: true`, `staleTime: 60_000` ms.
6. **Deployment Fixes (`f825ab9`):** Bundled `.hbs` templates in `nest-cli.json`, fixed Express 5 middleware wildcard (`{*path}`), exposed `MATERIAL_ISSUE_OVERDUE` notifications to Stores/Managers, added `mailQueueEventBus.emitWakeup()` to `retryFailedEmails()`, and updated `render.yaml` (`nodeVersion: 24`, `healthCheckPath: /api/observability/health/liveness`).

---

## 4. Source-Code Verification

### 4.1 Email Queue (Items 1–11)

| # | Item | File & Lines | Expected Behavior | Actual Behavior | Test Evidence | Missing Functionality | Risk | Classification |
|---|---|---|---|---|---|---|---|---|
| 1 | Event-driven email processing | `backend/src/communication/queue/mail-queue.event-bus.ts:8-23`, `postgres-queue.service.ts:33-34`, `postgres-mail.worker.ts:55,80-91`, `communication.controller.ts:152` | Enqueueing or manual retry wakes worker immediately via event bus without polling. | `PostgresQueueService.addJob()` persists to `emailJob` then calls `mailQueueEventBus.emitWakeup()`. `CommunicationController.retryFailedEmails()` also calls `emitWakeup()`. `PostgresMailWorker` subscribes in `onModuleInit()`. | `postgres-mail.worker.spec.ts` & `fixes-verification.spec.ts` pass. | In-process `EventEmitter` only; multi-instance deployments rely on hourly recovery if a different instance enqueues. | Low | **PASS — SOURCE VERIFIED, RUNTIME NOT VERIFIED** |
| 2 | Removal of unnecessary continuous polling | `backend/src/communication/queue/postgres-mail.worker.ts:115-142` | Worker drains queue until `poll()` returns 0, then sleeps with 0 SQL queries. | `runDrainLoop()` breaks when `claimedCount === 0` and `!hasPendingWakeup`, logging sleep mode. No short-interval `setInterval` polling exists. | `postgres-mail.worker.spec.ts` passes. | None. | Low | **PASS — SOURCE VERIFIED, RUNTIME NOT VERIFIED** |
| 3 | Hourly stuck-job recovery | `backend/src/communication/queue/postgres-mail.worker.ts:69-77,303-371` | Fallback recovery runs once per hour (`3600000` ms) to reclaim stale locks and orphaned due `PENDING` jobs. | `recoveryIntervalMs` defaults to `3600000` ms (1 hour); `recoverStuckJobs()` reclaims `PROCESSING` rows with `lockedAt < NOW() - 60s` and wakes worker if due `PENDING` rows exist. | `postgres-mail.worker.spec.ts` (14/14 pass). | None. | Low | **PASS — SOURCE VERIFIED, RUNTIME NOT VERIFIED** |
| 4 | Atomic email queue claiming | `backend/src/communication/queue/postgres-mail.worker.ts:402-415` | Claim jobs atomically using `FOR UPDATE SKIP LOCKED` so concurrent workers never claim the same row. | Single `UPDATE email_jobs SET status = 'PROCESSING', "lockedAt" = NOW(), "lockedBy" = $workerId WHERE id IN (SELECT id FROM email_jobs WHERE status = 'PENDING' AND "availableAt" <= NOW() ORDER BY priority ASC, "createdAt" ASC FOR UPDATE SKIP LOCKED LIMIT $slots) RETURNING ...`. | `postgres-mail.worker.spec.ts` passes (mocked Prisma). | Live PostgreSQL concurrency test not executed in unit suite. | Low | **PASS — SOURCE VERIFIED, RUNTIME NOT VERIFIED** |
| 5 | Worker ownership & lease handling | `backend/src/communication/queue/postgres-mail.worker.ts:40,205-233,465-474,543-551,614-623,641-651` | Each worker has unique `workerId`; all lock renewals, deletions, retries, and dead-letter updates filter by `lockedBy: this.workerId`. | `workerId = crypto.randomUUID()`; `renewLockWithStatus`, `deleteMany`, and `updateMany` all include `lockedBy: this.workerId`. | `postgres-mail.worker.spec.ts` passes. | None. | Low | **PASS — SOURCE VERIFIED, RUNTIME NOT VERIFIED** |
| 6 | 60-second lease configuration | `backend/src/communication/queue/postgres-mail.worker.ts:42,314` | Default lease duration is `60000` ms (`SMTP_LOCK_DURATION`). | `this.lockDurationMs = parseInt(process.env.SMTP_LOCK_DURATION || '60000', 10)`. Used in `make_interval(secs => ${this.lockDurationMs / 1000})`. | `postgres-mail.worker.spec.ts` passes. | None. | Low | **PASS — SOURCE VERIFIED, RUNTIME NOT VERIFIED** |
| 7 | 15-second heartbeat | `backend/src/communication/queue/postgres-mail.worker.ts:43,249-297` | Default heartbeat interval is `15000` ms (`SMTP_HEARTBEAT_INTERVAL_MS`), extending `lockedAt` while processing. | `this.heartbeatIntervalMs = parseInt(process.env.SMTP_HEARTBEAT_INTERVAL_MS || '15000', 10)`. `startHeartbeat()` schedules recursive `setTimeout`; `DB_ERROR` retries on next heartbeat instead of aborting. | `postgres-mail.worker.spec.ts` passes (including transient `DB_ERROR` test). | None. | Low | **PASS — SOURCE VERIFIED, RUNTIME NOT VERIFIED** |
| 8 | Graceful shutdown | `backend/src/communication/queue/postgres-mail.worker.ts:144-196`, `backend/src/main.ts:142` | Unsubscribe event bus, clear timers, wait up to `shutdownTimeoutMs` (10s) keeping heartbeats alive, then stop heartbeats without forcibly releasing active locks to `PENDING`. | `onModuleDestroy()` sets `isShuttingDown = true`, unsubscribes, clears timers, waits up to `10000` ms while heartbeats continue, then sets `isHeartbeatStopped = true` and leaves any remaining active locks intact until lease expiry. | `postgres-mail.worker.spec.ts` passes. | None. | Low | **PASS — SOURCE VERIFIED, RUNTIME NOT VERIFIED** |
| 9 | AbortController cancellation | `backend/src/communication/queue/postgres-mail.worker.ts:267,451-453,492-494,527,530-532,590-595`, `gmail-api.provider.ts:87-99` | If lease is lost, abort `AbortController` and pass `signal` to email provider so in-flight HTTP call is cancelled. | `startHeartbeat()` calls `abortController.abort()` on `LEASE_LOST`; `processJob()` passes `signal: abortController.signal` to `emailProviderFactory.sendEmail()`, which forwards `{ signal: payload.signal }` to `gmail.users.messages.send()`. | `postgres-mail.worker.spec.ts` & `fixes-verification.spec.ts` pass. | None. | Low | **PASS — SOURCE VERIFIED, RUNTIME NOT VERIFIED** |
| 10 | Prevention of duplicate email processing | `backend/src/communication/queue/postgres-mail.worker.ts:183-195,263-270,402-415,543-551,590-595` | `SKIP LOCKED` + lease heartbeat + `AbortController` + non-releasing shutdown prevent concurrent double-delivery. | All 4 layers are implemented; aborted jobs skip retry/cleanup (`if (abortController.signal.aborted) throw error`). | `postgres-mail.worker.spec.ts` passes. | Theoretical edge case if Gmail API already accepted the HTTP request before `AbortSignal` fires (inherent to at-least-once HTTP delivery). | Low | **PASS — SOURCE VERIFIED, RUNTIME NOT VERIFIED** |
| 11 | Reliable recovery of pending jobs | `backend/src/communication/queue/postgres-mail.worker.ts:57-66,303-366,674` | Startup recovery + startup drain sweep + backoff `triggerWakeup(backoffDelay)` + hourly due-`PENDING` sweep ensure no job is stranded. | Startup calls `recoverStuckJobs()` and `setTimeout(() => triggerWakeup(0), 500)`; `recoverStuckJobs()` checks due `PENDING` rows even when 0 `PROCESSING` rows are recovered; retries schedule `triggerWakeup(backoffDelay)`. | `postgres-mail.worker.spec.ts` passes. | None. | Low | **PASS — SOURCE VERIFIED, RUNTIME NOT VERIFIED** |

### 4.2 Scheduler Optimization (Items 12–16)

| # | Item | File & Lines | Expected Behavior | Actual Behavior | Test Evidence | Missing Functionality | Risk | Classification |
|---|---|---|---|---|---|---|---|---|
| 12 | Scheduler execution at 09:00 IST | `backend/src/notifications/overdue-material.scheduler.ts:15,22-25,92-95` | `OverdueMaterialScheduler` executes at 09:00 IST. | `DEFAULT_OVERDUE_MATERIAL_CRON = '0 0 9,15 * * *'` with `timeZone: OVERDUE_MATERIAL_TIMEZONE` (`Asia/Kolkata`). | `overdue-material.scheduler.spec.ts` passes. | Startup check also runs 10s after boot (`OVERDUE_MATERIAL_STARTUP_CHECK_ENABLED !== 'false'`), which runs once per deploy/restart. | Low | **PASS — SOURCE VERIFIED, RUNTIME NOT VERIFIED** |
| 13 | Scheduler execution at 15:00 IST | `backend/src/notifications/overdue-material.scheduler.ts:15,92-95` | `OverdueMaterialScheduler` executes at 15:00 IST. | Same 6-field cron `'0 0 9,15 * * *'` triggers at 09:00 and 15:00 in `Asia/Kolkata`. | `overdue-material.scheduler.spec.ts` passes. | None. | Low | **PASS — SOURCE VERIFIED, RUNTIME NOT VERIFIED** |
| 14 | Elimination of unnecessary frequent cron | `backend/src/notifications/overdue-material.scheduler.ts:15,92-95` | No 15-minute or 1-minute overdue cron remains. | `git grep -n "@Cron"` across `backend/src` confirms only 2 `@Cron` decorators exist in the entire backend: `overdue-material.scheduler.ts` (`0 0 9,15 * * *`) and `rm-integration.service.ts` (`0 0 */4 * * *`). | `overdue-material.scheduler.spec.ts` passes. | None. | Low | **PASS — SOURCE VERIFIED, RUNTIME NOT VERIFIED** |
| 15 | No duplicate scheduler registrations | `backend/src/app.module.ts:38`, `notifications/notifications.module.ts:10`, `internal/internal.module.ts:11` | `ScheduleModule.forRoot()` imported once; each scheduler registered in one module. | `ScheduleModule.forRoot()` appears only in `app.module.ts:38`; `OverdueMaterialScheduler` only in `NotificationsModule`; `RmIntegrationService` only in `InternalModule`. | Verified via `git grep`. | None. | Low | **PASS — SOURCE VERIFIED, RUNTIME NOT VERIFIED** |
| 16 | Timezone correctness | `backend/src/notifications/overdue-material.scheduler.ts:16,24-25,94`, `rm-integration.service.ts:486-488` | Overdue scheduler uses `Asia/Kolkata`. | `OverdueMaterialScheduler` sets `timeZone: process.env.APP_TIMEZONE || 'Asia/Kolkata'`. `RmIntegrationService` omits `timeZone` on `'0 0 */4 * * *'` (runs at 00:00, 04:00, 08:00, 12:00, 16:00, 20:00 container/UTC time). | `overdue-material.scheduler.spec.ts` passes. | `RmIntegrationService` cron lacks explicit `timeZone` (minor, since 4-hour interval is relative). | Low | **PASS — SOURCE VERIFIED, RUNTIME NOT VERIFIED** |

### 4.3 RM Integration (Items 17–20)

| # | Item | File & Lines | Expected Behavior | Actual Behavior | Test Evidence | Missing Functionality | Risk | Classification |
|---|---|---|---|---|---|---|---|---|
| 17 | RM retry interval is 4 hours | `backend/src/internal/rm-integration.service.ts:11,16-17,486-491` | Fallback outbox retry cron runs every 4 hours (`0 0 */4 * * *`). | `DEFAULT_RM_OUTBOX_CRON_SCHEDULE = '0 0 */4 * * *'` (configurable via `RM_OUTBOX_RETRY_CRON_SCHEDULE`). | `rm-integration.service.spec.ts` passes. | None. | Low | **PASS — SOURCE VERIFIED, RUNTIME NOT VERIFIED** |
| 18 | Inspect retry conditions | `backend/src/internal/rm-integration.service.ts:14,428-441` | Retries `FAILED` entries with `attemptCount < 5` and `PENDING` entries > 1 min old with `attemptCount < 5`, max 10 per sweep. | `where: { OR: [{ status: 'FAILED', attemptCount: { lt: 5 } }, { status: 'PENDING', createdAt: { lt: now - 60000 }, attemptCount: { lt: 5 } }] }`, `orderBy: { createdAt: 'asc' }`, `take: 10`. | `rm-integration.service.spec.ts` passes. | Entries reaching `attemptCount >= 5` stop retrying automatically; manual `/internal/...` intervention or outbox inspection required. | Low | **PASS — SOURCE VERIFIED, RUNTIME NOT VERIFIED** |
| 19 | Failed integration operations not silently lost | `backend/src/internal/rm-integration.service.ts:224-246,277-286,331-358,459-462` | Outbox row persisted before HTTP send; HTTP/network/config failures update row to `FAILED` with `lastError`, `lastAttemptAt`, `attemptCount`. | `outboxRepo.create()` persists `PENDING` before `sendOutboxEntry()`. Failures record `FAILED` + `lastError` + increment `attemptCount` and log errors. `inFlightSends` Set prevents concurrent duplicate sends. | `rm-integration.service.spec.ts` passes. | None. | Low | **PASS — SOURCE VERIFIED, RUNTIME NOT VERIFIED** |
| 20 | Retry scheduling avoids unnecessary Neon queries | `backend/src/internal/rm-integration.service.ts:395-452,500-579` | 4-hour cadence (6 runs/day vs 48/day at 30m), local `isRetrying` guard, distributed lock, early return on empty result. | Local `isRetrying` check skips DB entirely if running; distributed lock in `application_settings` prevents multi-instance overlap; `findMany` returns early if 0 rows. Note: each 4h run executes lock upsert + update + findMany + release (~4 lightweight queries, 6×/day = ~24 queries/day). | `rm-integration.service.spec.ts` passes. | None. | Low | **PASS — SOURCE VERIFIED, RUNTIME NOT VERIFIED** |

### 4.4 Health Checks (Items 21–25)

| # | Item | File & Lines | Expected Behavior | Actual Behavior | Test Evidence | Missing Functionality | Risk | Classification |
|---|---|---|---|---|---|---|---|---|
| 21 | Inspect liveness and readiness endpoints | `backend/src/observability/observability.controller.ts:21-69`, `render.yaml:8` | `/api/observability/health/liveness` and `/api/observability/health/readiness` exposed as `@Public()`. | Both routes exist with `@Public()`. `render.yaml` specifies `healthCheckPath: /api/observability/health/liveness`. | `observability.controller.spec.ts` passes; live HTTP `200 OK` observed. | Render Dashboard setting must match `render.yaml` (cannot inspect Render Dashboard directly). | Low | **PASS — IMPLEMENTED AND VERIFIED** (HTTP endpoints) / **SOURCE VERIFIED** (Render config) |
| 22 | Liveness does not query Neon | `backend/src/observability/observability.controller.ts:26-31` | Liveness returns static `{ status: 'UP', timestamp }` with 0 SQL queries. | `getLiveness()` returns `{ status: 'UP', timestamp: new Date().toISOString() }` without calling `ObservabilityService` or `PrismaService`. | `observability.controller.spec.ts` passes. | None. | Low | **PASS — SOURCE VERIFIED, RUNTIME NOT VERIFIED** |
| 23 | Readiness caching | `backend/src/observability/observability.service.ts:69-77,353-405` | Readiness caches `UP` results for 30s (`READINESS_CACHE_TTL_MS`) and reuses recent successful DB traffic (`lastSuccessfulDbQueryTime`). | `getSystemStatuses(forceLive)` returns cached `lastReadinessResult` within 30s TTL, or returns `{ database: 'UP', queue: 'UP' }` if `now - lastSuccessfulDbQueryTime < 30000` without issuing `SELECT 1`. `?force=true` bypasses cache. | `observability.controller.spec.ts` passes. | Cache is in-memory per instance (not shared across multiple containers). | Low | **PASS — SOURCE VERIFIED, RUNTIME NOT VERIFIED** |
| 24 | DB queries during unhealthy conditions | `backend/src/observability/observability.service.ts:77,358-361,392-396` | Failed readiness checks are cached briefly (5s) to avoid hammering Neon during outages. | `readinessErrorCacheTtlMs = 5000`; when `lastReadinessResult?.database === 'DOWN'`, `cacheTtl` is 5000ms, bounding `SELECT 1` probes to at most 1 per 5s. | `observability.controller.spec.ts` passes. | None. | Low | **PASS — SOURCE VERIFIED, RUNTIME NOT VERIFIED** |
| 25 | Health-check polling and caching behavior | `backend/src/observability/observability.service.ts:353-405` | Single `SELECT 1` checks both DB and Postgres-backed queue when cache misses. | Issues 1 `SELECT 1` query (instead of separate DB + queue queries) and sets both `database` and `queue` status. | `observability.controller.spec.ts` passes. | None. | Low | **PASS — SOURCE VERIFIED, RUNTIME NOT VERIFIED** |

### 4.5 Frontend Notification Polling (Items 26–31)

| # | Item | File & Lines | Expected Behavior | Actual Behavior | Test Evidence | Missing Functionality | Risk | Classification |
|---|---|---|---|---|---|---|---|---|
| 26 | Notification polling interval is 5 minutes | `frontend/src/api/services/notifications/hooks.ts:62-85` | `useUnreadNotificationCount()` polls every `300_000` ms (5 minutes). | `DEFAULT_NOTIFICATION_POLL_INTERVAL_MS = 300_000`; `refetchInterval: getNotificationPollInterval()`. | `notification-polling.test.tsx` (6/6 pass). | None. | Low | **PASS — SOURCE VERIFIED, RUNTIME NOT VERIFIED** |
| 27 | Polling occurs only while tab is visible | `frontend/src/api/services/notifications/hooks.ts:82` | `refetchIntervalInBackground: false` stops polling when tab is hidden. | `refetchIntervalInBackground: false` is set on `useUnreadNotificationCount()`. | `notification-polling.test.tsx` verifies `options?.refetchIntervalInBackground === false`. | Relies on TanStack Query v5 `focusManager` visibility listener (not tested in real headless browser here). | Low | **PASS — SOURCE VERIFIED, RUNTIME NOT VERIFIED** |
| 28 | Polling pauses when tab is hidden | `frontend/src/api/services/notifications/hooks.ts:82` | Hidden tab pauses `refetchInterval`. | Handled by TanStack Query `refetchIntervalInBackground: false`. | `notification-polling.test.tsx` passes. | Live browser `visibilitychange` integration test not run. | Low | **PASS — SOURCE VERIFIED, RUNTIME NOT VERIFIED** |
| 29 | Polling resumes correctly when visible again | `frontend/src/api/services/notifications/hooks.ts:80,83` | Returning to tab triggers immediate freshness check if stale (`> 60s`) and resumes 5m interval. | `refetchOnWindowFocus: true` + `staleTime: 60_000` overrides global `refetchOnWindowFocus: false` in `query-client.ts:58`. | `notification-polling.test.tsx` passes. | None. | Low | **PASS — SOURCE VERIFIED, RUNTIME NOT VERIFIED** |
| 30 | Check for duplicate intervals & memory leaks | `frontend/src/api/services/notifications/hooks.ts:76-86`, `Header.tsx:37`, `DashboardPage.tsx:69`, `NotificationsPage.tsx:61` | Multiple mounted components share one React Query cache key and one polling timer. | All 3 components use `useUnreadNotificationCount()` with identical `queryKey: queryKeys.notifications.detail('notifications', 'unread')` and `staleTime: 60_000`. | `notification-polling.test.tsx` tests 3 concurrent hooks -> 1 API call. | None. | Low | **PASS — SOURCE VERIFIED, RUNTIME NOT VERIFIED** |
| 31 | Identify other frontend polling & auto-refresh | `frontend/src/pages/MonitoringDashboardPage.tsx:120-127`, `frontend/src/components/layout/Header.tsx:60`, `frontend/src/api/client/index.ts:67-75` | Identify any other `refetchInterval` or `setInterval`. | 1. `MonitoringDashboardPage.tsx:126`: `refetchInterval: 30000` on `/observability/metrics` (note: UI text at line 165 inaccurately says "every 5 seconds", and `refetchIntervalInBackground` is not set to `false`; however `/observability/metrics` reads in-memory counters and executes **0 Neon SQL queries**).<br>2. `Header.tsx:60`: `setInterval(updateClock, 1000)` (UI clock only, 0 API/DB calls, cleaned up on unmount).<br>3. `api/client/index.ts:69`: `startCleanupScheduler` (`60000` ms in-memory request map cleanup). | Verified via `git grep` and file reads. | `MonitoringDashboardPage` lacks `refetchIntervalInBackground: false` and has stale UI text ("5 seconds" vs 30s). | Low | **PARTIAL — IMPLEMENTED WITH LIMITATIONS** |

### 4.6 Database Connections (Items 32–37)

| # | Item | File & Lines | Expected Behavior | Actual Behavior | Test Evidence | Missing Functionality | Risk | Classification |
|---|---|---|---|---|---|---|---|---|
| 32 | Inspect database pool configuration | `database/schema.prisma:4-8`, `backend/.env` | Pooled `DATABASE_URL` with PgBouncer parameters and `DIRECT_URL` for migrations. | `backend/.env` `DATABASE_URL` includes `sslmode=require&connection_limit=20&pool_timeout=15&pgbouncer=true`; `DIRECT_URL` uses `sslmode=require`. `PrismaService` uses default `PrismaClient` constructor. | `prisma generate` + `nest build` succeed. | Production Render `DATABASE_URL` query params cannot be inspected directly from repo (`sync: false` in `render.yaml`). | Medium | **PASS — SOURCE VERIFIED, RUNTIME NOT VERIFIED** |
| 33 | Identify idle connections | `backend/src/prisma/prisma.service.ts:9-74` | No background keep-alive or idle polling queries hold Neon compute awake. | `PrismaService` connects on `onModuleInit` via `$connect()` and disconnects on `onModuleDestroy`. No keep-alive `setInterval` exists in `PrismaService`. | Verified via `git grep`. | Live `pg_stat_activity` idle connection count not observable without Neon DB access. | Low | **PASS — SOURCE VERIFIED, RUNTIME NOT VERIFIED** |
| 34 | Identify unnecessary repeated queries | `backend/src/communication/queue/postgres-mail.worker.ts:73`, `overdue-material.scheduler.ts:92`, `rm-integration.service.ts:486`, `observability.service.ts:353` | Eliminate frequent idle polling queries. | Email queue polling eliminated; Overdue scheduler reduced to 2×/day; RM outbox reduced to 6×/day; Readiness cached 30s; Liveness 0 SQL. Remaining periodic DB activity: hourly `recoverStuckJobs()` (24×/day), twice-daily overdue check (2×/day), 4-hourly RM retry (6×/day). | Unit tests pass. | None in source code. | Low | **PASS — SOURCE VERIFIED, RUNTIME NOT VERIFIED** |
| 35 | Check connection leaks | `backend/src/prisma/prisma.service.ts:6-74` | Single `PrismaService` singleton shared across NestJS DI; `$disconnect()` called on shutdown. | `PrismaService` is a singleton in `PrismaModule`, returns `$extends` instance with bound `onModuleInit` and `onModuleDestroy` calling `$disconnect()`. | Verified via code inspection. | None. | Low | **PASS — SOURCE VERIFIED, RUNTIME NOT VERIFIED** |
| 36 | Check startup and shutdown behavior | `backend/src/main.ts:142`, `prisma.service.ts:42-55`, `postgres-mail.worker.ts:144-196`, `overdue-material.scheduler.ts:46-70`, `rm-integration.service.ts:52-76`, `observability.service.ts:123-125` | `app.enableShutdownHooks()` triggers `OnModuleDestroy` across all workers/schedulers/Prisma. | `main.ts:142` calls `app.enableShutdownHooks()`. All timers (`startupTimer`, `recoveryTimer`, `delayedTimers`, `activeHeartbeats`) and event listeners are cleaned up in `onModuleDestroy()`. | `postgres-mail.worker.spec.ts`, `overdue-material.scheduler.spec.ts`, `rm-integration.service.spec.ts` pass. | Startup runs `recoverStuckJobs()`, `OverdueMaterialScheduler` (10s delay), and `RmIntegrationService` (15s delay), which is expected on boot. | Low | **PASS — SOURCE VERIFIED, RUNTIME NOT VERIFIED** |
| 37 | Verify Neon autosuspend compatibility | All backend & frontend sources | Zero continuous background DB queries when app is idle, allowing Neon compute to autosuspend after inactivity (typically 5 min). | With liveness probe at 0 SQL, email worker sleeping, frontend tabs closed/backgrounded, and crons at 1h / 4h / 09:00+15:00 IST, the longest idle gap is up to **60 minutes** (bounded by hourly `recoverStuckJobs()`), allowing Neon autosuspend to engage between hourly sweeps. | Source verified; runtime Neon autosuspend telemetry unavailable. | Hourly `recoverStuckJobs()` wakes Neon once per hour (~24 wakeups/day) even when no emails are queued. | Low | **PASS — SOURCE VERIFIED, RUNTIME NOT VERIFIED** |

---

## 5. Runtime Verification

Source-code verification and live runtime verification are strictly separated below:

| Target | Status | Observed Evidence |
|---|---|---|
| **Render Live Liveness Endpoint** | **VERIFIED (HTTP 200)** | `GET https://indent-application.onrender.com/api/observability/health/liveness` returned `200 OK`: `{"success":true,"message":"Operation successful","data":{"status":"UP","timestamp":"2026-11-26T12:18:09.802Z"},...}`. |
| **Render Live Readiness Endpoint** | **VERIFIED (HTTP 200)** | `GET https://indent-application.onrender.com/api/observability/health/readiness` returned `200 OK`: `{"success":true,"message":"Operation successful","data":{"status":"UP","services":{"database":"UP","queue":"UP"},"timestamp":"2026-11-26T12:18:11.197Z"},...}`. |
| **Render Deployment Version & Logs** | **BLOCKED — EVIDENCE UNAVAILABLE** | No `render` CLI or `RENDER_API_KEY` is configured in this environment; cannot inspect deployed commit SHA, Render Dashboard `healthCheckPath`, or live container logs. |
| **Scheduler Execution Logs** | **BLOCKED — EVIDENCE UNAVAILABLE** | Production logs are not accessible from this environment. |
| **Email Queue Processing Logs** | **BLOCKED — EVIDENCE UNAVAILABLE** | Production logs and live `email_jobs` table state were not queried (strict read-only audit without production DB access). |
| **RM Integration Retry Activity** | **BLOCKED — EVIDENCE UNAVAILABLE** | Production logs and live `rm_webhook_outbox` state not accessible. |
| **Frontend Notification Requests** | **BLOCKED — EVIDENCE UNAVAILABLE** | Live browser network telemetry from production users not accessible. |
| **Neon DB Connections & Idle Activity** | **BLOCKED — EVIDENCE UNAVAILABLE** | No `neonctl` CLI, `NEON_API_KEY`, or `psql` access to Neon Console/API metrics in this environment. |

---

## 6. Email Queue Analysis

- **Architecture:** `PostgresQueueService.addJob()` writes to `email_jobs` and emits `mailQueueEventBus.emitWakeup()`. `PostgresMailWorker` drains via `runDrainLoop()` using `FOR UPDATE SKIP LOCKED` (`concurrency: 2` default) until empty, then sleeps with 0 SQL queries.
- **Lease & Heartbeat Safety:** `lockDurationMs` defaults to `60000` ms and `heartbeatIntervalMs` defaults to `15000` ms (4× safety margin). `renewLockWithStatus()` uses raw SQL `NOW()` and distinguishes `RENEWED`, `LEASE_LOST`, and `DB_ERROR` (transient DB errors do not abort the job). On `LEASE_LOST`, `abortController.abort()` cancels the Gmail API HTTPS call via `{ signal: payload.signal }`.
- **Shutdown Safety:** `onModuleDestroy()` unsubscribes from `mailQueueEventBus`, clears timers, waits up to `10000` ms while keeping heartbeats alive, and leaves any unfinished `PROCESSING` locks intact until lease expiry rather than resetting them to `PENDING` (preventing concurrent double-delivery across rolling containers).
- **Neon Impact:** Eliminates continuous idle polling queries (previously every few seconds) and replaces them with event-driven wakeups plus 1 hourly `recoverStuckJobs()` sweep (2 queries/hour when idle).

---

## 7. Scheduler Analysis

- **Overdue Material Scheduler:** Configured at `'0 0 9,15 * * *'` in `Asia/Kolkata` (`09:00` and `15:00` IST). Uses a distributed lock in `application_settings` (`OVERDUE_SCHEDULER_LOCK_KEY`, 5-minute timeout), checks `MATERIAL_ISSUE_OVERDUE_ALERTS_ENABLED`, queries `STORES_PROCESSING` indents with eager relations, and batch-queries existing `MATERIAL_ISSUE_OVERDUE` notifications to avoid N+1 queries.
- **Registration Hygiene:** `ScheduleModule.forRoot()` is registered once in `AppModule`. No duplicate scheduler registrations exist.
- **Neon Impact:** Reduced from 96 executions/day (every 15 minutes) to 2 scheduled executions/day (+1 on container boot).

---

## 8. RM Integration Analysis

- **Retry Schedule:** `RmIntegrationService.handleOutboxRetry()` runs on `'0 0 */4 * * *'` (every 4 hours, 6×/day).
- **Durability & Idempotency:** `notifyStoresPending()` persists to `rmWebhookOutbox` (`PENDING`) before attempting immediate `sendOutboxEntry()`. Failures update `status = 'FAILED'`, `lastError`, `lastAttemptAt`, and increment `attemptCount`. An in-memory `inFlightSends` `Set` and a distributed lock (`RM_OUTBOX_RETRY_LOCK`) prevent duplicate concurrent sends.
- **Retry Bounds:** Retries `FAILED` entries (`attemptCount < 5`) and `PENDING` entries older than 60s (`attemptCount < 5`), capped at 10 per sweep.
- **Neon Impact:** Reduced from 48 sweeps/day (every 30 minutes) to 6 sweeps/day.

---

## 9. Frontend Polling Analysis

- **Unread Notifications:** `useUnreadNotificationCount()` in `frontend/src/api/services/notifications/hooks.ts` is configured with `refetchInterval: 300_000` (5 minutes), `refetchIntervalInBackground: false`, `refetchOnWindowFocus: true`, and `staleTime: 60_000`. All 3 UI consumers (`Header`, `DashboardPage`, `NotificationsPage`) share the same query key, deduplicating requests.
- **Other Intervals:** `MonitoringDashboardPage.tsx:126` polls `/observability/metrics` every `30000` ms (`refetchInterval: 30000`). While this hits an in-memory endpoint (0 Neon SQL queries), it does not set `refetchIntervalInBackground: false` and displays stale helper text ("every 5 seconds" at line 165).

---

## 10. Database Activity Analysis

- **Pool Configuration:** Local `backend/.env` specifies `connection_limit=20&pool_timeout=15&pgbouncer=true&sslmode=require` on `DATABASE_URL` and `sslmode=require` on `DIRECT_URL`.
- **Connection Lifecycle:** `PrismaService` extends `PrismaClient` with query observability hooks and binds `onModuleInit` (`$connect()`) and `onModuleDestroy` (`$disconnect()`). `app.enableShutdownHooks()` is active in `main.ts`.
- **Idle Behavior & Autosuspend:** No idle keep-alive loops exist. When no users are active, only the hourly `recoverStuckJobs()` sweep (every 60 min), 4-hourly RM outbox check, and twice-daily overdue check touch Neon, leaving ~59-minute idle windows compatible with Neon autosuspend.

---

## 11. Neon Compute Analysis

- **Provided Baseline:** **8.26 CU-hours**, reported on November 17, 2026.
- **Post-Deployment Metrics Availability:** Neither Neon Console/API metrics nor `neonctl` / `NEON_API_KEY` are available in this audit environment.
- **Comparable Before/After Calculation:** Unavailable.

**ACTUAL NEON COMPUTE REDUCTION: NOT YET MEASURABLE.**

*(Per audit rules, theoretical query-count reductions are not reported as measured CU-hour reductions.)*

---

## 12. Test Results

All tests and builds below were executed during this audit against isolated unit-test mocks (no production database records were created or modified):

| Check | Exact Command | Result |
|---|---|---|
| **Backend Neon Optimization Suites (Email, Scheduler, RM, Health, Notifications)** | `npx --prefix backend jest --config backend/package.json communication/queue/postgres-mail.worker.spec.ts communication/fixes-verification.spec.ts notifications/overdue-material.scheduler.spec.ts notifications/notifications.controller.spec.ts internal/rm-integration.service.spec.ts observability/observability.controller.spec.ts` | **PASS** — Exit Code `0` (`6 passed, 6 total` suites; `66 passed, 66 total` tests; `89.601 s`) |
| **Frontend Notification Polling Tests** | `npm --prefix frontend test -- --run src/test/notification-polling.test.tsx` | **PASS** — Exit Code `0` (`1 passed` file; `6 passed` tests; `25.74 s`) |
| **Backend Production Build** | `npm --prefix backend run build` | **PASS** — Exit Code `0` (Prisma Client `v6.19.3` generated + `nest build` succeeded) |
| **Frontend Production Build** | `npm --prefix frontend run build` | **PASS** — Exit Code `0` (`tsc -b && vite build` built in `33.97 s`) |
| **Frontend Global Lint** | `npm --prefix frontend run lint` | **FAIL (Pre-existing)** — Exit Code `1` (`175 problems`: `175 errors, 0 warnings`, 174 `prettier/prettier` + 1 `consistent-return` in unrelated files) |
| **Frontend Phase 5 Files Lint** | `npx --prefix frontend eslint frontend/src/api/services/notifications/hooks.ts frontend/src/test/notification-polling.test.tsx` | **PASS** — Exit Code `0` (`0 errors, 0 warnings`) |

---

## 13. Remaining Issues

1. **Unverified Live Production Telemetry & Render Dashboard Settings (`BLOCKED`):** Cannot confirm from this environment whether Render Dashboard's `Health Check Path` is set to `/api/observability/health/liveness` (as opposed to `/readiness` or `/api`), nor which git commit is currently live on Render.
2. **Unmeasured Post-Deployment Neon CU-Hours (`BLOCKED`):** Post-deployment Neon compute metrics are unavailable to compute actual CU-hour reduction against the 8.26 CU-hours baseline.
3. **`MonitoringDashboardPage` Polling & UI Copy (`PARTIAL`):** `frontend/src/pages/MonitoringDashboardPage.tsx:126` uses `refetchInterval: 30000` without `refetchIntervalInBackground: false`, and line 165 displays "every 5 seconds". (0 DB impact, minor unnecessary HTTP traffic when tab is hidden.)
4. **Pre-existing Global Frontend Lint Errors:** `npm --prefix frontend run lint` fails with 175 pre-existing errors outside Phase 5 files.

---

## 14. Risk Assessment

- **Overall Technical Risk:** **LOW**
- **Email Delivery Risk:** **LOW** — Lease (60s), heartbeat (15s), `AbortController`, `SKIP LOCKED`, and non-releasing shutdown are verified in source and unit tests.
- **Business Workflow & RM Integration Risk:** **LOW** — Twice-daily overdue alerts and 4-hour RM outbox fallback preserve durability and idempotency.
- **Neon Compute Risk:** **LOW–MEDIUM** — Source code eliminates idle polling, but actual CU-hour savings remain unverified until Render Dashboard health-check path and Neon Console metrics are checked.

---

## 15. Recommendations

1. **Verify Render Dashboard Configuration:** Confirm **Render Dashboard → `indent-application` → Settings → Health Check Path** is `/api/observability/health/liveness` and that the deployed commit includes `f825ab9`.
2. **Collect Comparable Neon CU-Hour Metrics:** Measure Neon CU-hours over a comparable post-deployment window (matching the November 17, 2026 baseline window) and compute:
   `Reduction % = ((8.26 - After CU-hours) / 8.26) × 100`.
3. **Optional Minor Cleanup (Separate Authorization):** Add `refetchIntervalInBackground: false` to `MonitoringDashboardPage.tsx:126` and update the line 165 text from "5 seconds" to "30 seconds".

---

## 16. Final Verdict

- **Source-Code Verdict:** **PASS — SOURCE VERIFIED** (all 5 optimization phases and deployment hardening fixes are correctly implemented in the codebase, with 66/66 targeted backend tests, 6/6 frontend polling tests, and both production builds passing).
- **Runtime & Compute Verdict:** **BLOCKED — EVIDENCE UNAVAILABLE** for Render logs/version and Neon CU-hour metrics; **PASS** for live HTTP liveness and readiness probes (`200 OK`).
- **ACTUAL NEON COMPUTE REDUCTION: NOT YET MEASURABLE.**
