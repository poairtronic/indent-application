# IMCMS Neon Compute Optimization — Phase 4 Report
# Health Check and Database Readiness Optimization

**Project:** Enterprise Manufacturing Indent & Costing Management System (IMCMS)  
**Phase:** Neon Compute Optimization — Phase 4  
**Target Component:** Health Probes & Observability Service (`backend/src/observability/`)  
**Status:** COMPLETE & VERIFIED (Awaiting Owner Review)  
**Date:** 2026-11-26  

---

## 1. Executive Summary

During the initial read-only audit of Neon compute consumption, health-check endpoints were audited to determine whether frequent uptime monitoring pings wake or hold Neon PostgreSQL compute awake.

The audit and source code inspection revealed:
1. **Liveness is 100% In-Memory:** `GET /api/observability/health/liveness` returns in-memory status `{ status: 'UP', timestamp }` with **zero database queries**, zero connection initialization, and zero network calls.
2. **Readiness Executed 2 Redundant SQL Queries on Every Ping:** `GET /api/observability/health/readiness` executed two separate raw queries on every single invocation:
   - `SELECT 1` (testing database connectivity)
   - `SELECT 1 FROM "email_jobs" LIMIT 1` (testing queue connectivity)
   Because the email queue in IMCMS is PostgreSQL-backed (`email_jobs` table), executing both queries was completely redundant (querying the exact same database twice).
3. **Continuous Wakeup Hazard:** If an external monitoring service (e.g. UptimeRobot, BetterUptime, Pingdom) or Render's health check was configured to ping `/api/observability/health/readiness` every 10–30 seconds, it executed up to 720 queries per hour, permanently resetting Neon's 5-minute auto-suspend timer and keeping compute active 24/7.

In Phase 4, we optimized the health check system by:
- **Consolidating Database Probes:** Replaced the two separate queries with a single lightweight `SELECT 1` probe.
- **Short-Lived Status Caching with TTL:** Introduced a 30-second TTL cache (`READINESS_CACHE_TTL_MS`, default: 30000ms) for verified readiness states. Rapid monitoring pings within 30 seconds are answered directly from memory with **zero SQL queries**.
- **Active Traffic Awareness:** Reused recent genuine database activity timestamps (`lastSuccessfulDbQueryTime`). If real user or background transactions succeeded within the last 30 seconds, readiness reports `UP` with **zero extra SQL queries**.
- **Fast Error Recovery:** On database failure, error states are cached for only 5 seconds (`readinessErrorCacheTtlMs`), ensuring recovery is detected within 5 seconds.
- **On-Demand Live Probe:** Supported `GET /api/observability/health/readiness?force=true` to bypass the cache when an operator or automated deployment requires an immediate live probe.
- **Render Health Check Guidance:** Verified that `render.yaml` currently has no `healthCheckPath` defined, and documented that Render and external uptime checkers should point to `/api/observability/health/liveness` (0 SQL queries).

---

## 2. Actual Route Paths & Global API Prefix Verification

Inspection of `backend/src/main.ts` line 89 confirmed:
```typescript
app.setGlobalPrefix('api');
```
All routes registered in NestJS controllers are prefixed with `/api`.

### Verified Health Endpoint Inventory

| Controller Route | Full Application URL Path | Auth / Permission | Verified SQL Behavior | Target Use Case |
|---|---|---|---|---|
| `@Get('health/liveness')` in `ObservabilityController` | **`/api/observability/health/liveness`** | Public (`@Public()`) | **ZERO SQL queries** (returns in-memory status) | **Recommended for Render health checks & external uptime monitors** |
| `@Get('health/readiness')` in `ObservabilityController` | **`/api/observability/health/readiness`** | Public (`@Public()`) | 1 consolidated SQL probe (cached for 30s TTL; 0 SQL on cache hit) | Container startup gate & dependency health verification |
| `@Get('health')` in `InternalController` | **`/api/internal/health`** | M2M Secret (`InternalSecretGuard`) | **ZERO SQL queries** (returns `{ status: 'ok', service: 'merc-internal-api' }`) | M2M bridge authentication verification between RM and Indent |
| `@Get('health')` in `CommunicationController` | **`/api/communication/health`** | Authenticated (`settings.manage`) | Diagnoses email provider & Redis in-memory state | Admin communication diagnostics dashboard |

---

## 3. Liveness vs Readiness Architecture & Optimization

### Liveness Probe (`/api/observability/health/liveness`)
- **Purpose:** Answers *"Is the Node.js process alive and responding to HTTP traffic?"*
- **Database Dependency:** **None.** It accesses no database, initializes no connection pool, and imports no models.
- **Behavior:** Unchanged. Remains 100% database-independent and instant (< 1ms).

### Readiness Probe (`/api/observability/health/readiness`)
- **Purpose:** Answers *"Is the service ready to handle user requests including database transactions?"*
- **Previous Defect:** Ran `SELECT 1` followed by `SELECT 1 FROM email_jobs LIMIT 1` on every call.
- **Optimized Implementation:**
  1. **Cache Window:** If a verified `UP` state was recorded within the last 30 seconds, returns the cached result with **0 database queries**.
  2. **Active Traffic Window:** If any application query succeeded within the last 30 seconds (`lastSuccessfulDbQueryTime`), the database is known to be active and connected; returns `UP` with **0 database queries**.
  3. **Consolidated Live Probe:** If the cache has expired and no recent queries have run, executes a single `SELECT 1` probe.
  4. **Failure Detection & HTTP 503:** If `SELECT 1` fails (Neon suspended or network error), marks status as `DOWN` and throws `ServiceUnavailableException` (HTTP 503). Error states cache for only 5 seconds to ensure fast recovery detection.
  5. **Force Bypass:** Passing `?force=true` bypasses the cache and triggers an immediate live probe.

---

## 4. Render Configuration & External Monitoring Findings

### Render Configuration Review
- **File Inspected:** `render.yaml`
- **Findings:**
  - Neither the backend service (`name: indent-application`) nor the frontend service defines a `healthCheckPath` property in `render.yaml`.
  - When `healthCheckPath` is omitted from `render.yaml`, Render defaults to checking port responsiveness or relies on whatever path is configured in the **Render Dashboard UI Settings**.

### Manual Owner Action Required in Render Dashboard:
1. Log in to the [Render Dashboard](https://dashboard.render.com).
2. Navigate to the backend service: **`indent-application`** -> **Settings**.
3. Under **Health Check Path**, verify what URL is currently entered:
   - If set to `/api/observability/health/readiness` or `/`: **Change it to `/api/observability/health/liveness`**.
   - If empty: Set it to **`/api/observability/health/liveness`**.
4. Save changes.

> [!IMPORTANT]
> Pointing Render's health check probe to `/api/observability/health/liveness` ensures that Render's container health monitor never issues a database query, allowing Neon compute to auto-suspend cleanly whenever users are idle.

### External Monitoring Tools (UptimeRobot, Pingdom, BetterUptime)
- If the organization uses external monitoring services:
  - Configure the check URL to **`https://indent-application.onrender.com/api/observability/health/liveness`**.
  - Do NOT point 30-second ping monitors at `/api/observability/health/readiness`, as that defeats scale-to-zero.

---

## 5. Query Reduction & Neon Compute Impact

### Database Query Reductions on Readiness Checks

| Incoming Monitoring Rate | Old Implementation | New Implementation | Verified Reduction |
|---|---|---|---|
| **Every 10 seconds** (6 pings/min) | 12 queries/min (720 queries/hr) | Max 2 queries/min (120 queries/hr) | **-83.3% queries** |
| **Every 30 seconds** (2 pings/min) | 4 queries/min (240 queries/hr) | Max 2 queries/min (120 queries/hr) | **-50.0% queries** |
| **With Active User Traffic** | 4 queries/min | **0 queries/min** (traffic reuse) | **-100% queries** |
| **Using Liveness Probe** | 0 queries/min | **0 queries/min** | **Zero Neon queries** |

### Expected Neon Compute Impact
- **With Liveness Probe on Render:** Zero scheduled health-check queries. Neon compute auto-suspends after 5 minutes of idle time.
- **With Readiness Probe Cached:** Even if an external tool pings readiness during idle periods, queries are cut by up to 83.3%, and redundant queue table scans are eliminated.

---

## 6. Test Verification & Results

A dedicated test suite was implemented in [backend/src/observability/observability.controller.spec.ts](file:///c:/Users/Admin/OneDrive/Desktop/indent%20application/backend/src/observability/observability.controller.spec.ts) covering all 10 mandatory scenarios:

| # | Test Scenario | Result | Duration |
|---|---|---|---|
| 1 | Liveness when Neon is available (returns HTTP 200 with `{ status: 'UP' }`) | **PASSED** | 26 ms |
| 2 | Liveness when Neon is unavailable (still returns HTTP 200 without error) | **PASSED** | 4 ms |
| 3 | Liveness executes ZERO database queries or Prisma calls | **PASSED** | 5 ms |
| 4 | Readiness when database probe succeeds (returns 200 with 1 single query) | **PASSED** | 5 ms |
| 5 | Readiness when database fails (throws HTTP 503 `ServiceUnavailableException`) | **PASSED** | 21 ms |
| 6 | Readiness caching: repeated calls within 30s TTL execute ZERO additional SQL | **PASSED** | 3 ms |
| 7 | Readiness cache expiry: re-probes database after 30s TTL expires | **PASSED** | 8 ms |
| 8 | Readiness force bypass: `force=true` and `force=1` bypass cache | **PASSED** | 4 ms |
| 9 | Readiness active traffic reuse: returns UP with 0 SQL if recent query succeeded | **PASSED** | 4 ms |
| 10 | Frontend error telemetry sanitization and recording | **PASSED** | 3 ms |
| 11 | Metrics dashboard compilation | **PASSED** | 3 ms |

**All Optimization Test Suites Combined:**
- `observability.controller.spec.ts`: **11 passed**
- `rm-integration.service.spec.ts`: **17 passed**
- `overdue-material.scheduler.spec.ts`: **13 passed**
- **Total: 41 passed, 41 total** (`4.018s`).

### Build Verification
- **Command:** `npm --prefix backend run build`
- **Result:** **PASSED with 0 errors**.

---

## 7. Files Inspected & Modified

### Modified Files:
- `backend/src/observability/observability.controller.ts`:
  - Added `@Query('force')` parameter to `getReadiness()`.
  - Added Swagger `@ApiQuery` documentation.
- `backend/src/observability/observability.service.ts`:
  - Consolidated database and queue health check to single `SELECT 1` probe.
  - Implemented 30-second readiness cache TTL (`readinessCacheTtlMs`).
  - Added active traffic awareness (`lastSuccessfulDbQueryTime`).
  - Added 5-second fast recovery error TTL (`readinessErrorCacheTtlMs`).
  - Added `resetReadinessCache()` test helper.

### Created Files:
- `backend/src/observability/observability.controller.spec.ts` (11 unit tests).
- `docs/neon-optimization/PHASE-4-HEALTH-CHECK-REPORT.md` (This report).

### Unmodified Files (Strict Scope Boundaries Preserved):
- `backend/src/communication/queue/postgres-mail.worker.ts` (Phase 1).
- `backend/src/notifications/overdue-material.scheduler.ts` (Phase 2).
- `backend/src/internal/rm-integration.service.ts` (Phase 3).
- `frontend/` (Phase 5).
- Database Schema and Migrations (Zero schema changes).

---

## 8. Remaining Risks & Mitigations

1. **Risk: Database failure occurring within the 30-second cache window.**
   - *Analysis:* If Neon becomes unreachable 5 seconds after a successful readiness check, readiness would continue reporting `UP` for up to 25 more seconds.
   - *Mitigation:* A 30-second TTL is standard industry practice for readiness caching (Kubernetes typically polls every 10–30s). Any real incoming user request that fails immediately triggers `db.query` failure events, and passing `?force=true` bypasses the cache immediately.
2. **Risk: Render health check still configured to readiness in Render UI.**
   - *Mitigation:* The manual owner step in Section 4 instructs switching Render's health check path to `/api/observability/health/liveness`.

---

## 9. Rollback Instructions

1. **Via Environment Variable (Instant, zero code change):**
   Set `READINESS_CACHE_TTL_MS='0'` in Render environment variables. This forces readiness to execute live queries on every ping, identical to the original behavior.
2. **Via Git Restoration:**
   ```bash
   git checkout origin/main -- backend/src/observability/observability.controller.ts backend/src/observability/observability.service.ts
   rm backend/src/observability/observability.controller.spec.ts
   npm --prefix backend run build
   ```

---

## 10. Stop Condition & Next Steps

Phase 4 implementation, testing, and reporting are complete.

- **Git Status:** Uncommitted changes are preserved in the working tree. No commits, pushes, or deployments have been executed.
- **Phase 5 Awaits Approval:** Do NOT touch frontend notification polling until explicit owner review and approval are granted.
