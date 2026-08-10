# Phase 26B Certification Report: Enterprise Observability, Logging & Monitoring

## 1. Executive Summary
This report certifies the successful implementation of the **Enterprise Observability, Logging & Monitoring** infrastructure (Phase 26B) within the Enterprise Manufacturing Indent & Costing Management System (IMCMS). 

The system now offers unified request tracing, end-to-end telemetry event tracking across key business boundaries, dynamic application health probes, security-guarded diagnostic reporting, and a live web dashboard rendering operational parameters in real time.

---

## 2. System Architecture & Component Mapping

### A. Core Observability Mechanics
```
  Client (Axios / Browser)
         │  (Headers: x-correlation-id)
         ▼
  CorrelationIdMiddleware (ALSContext initialization)
         │
         ├──► AppLogger (Context-aware Console Stream Prepend)
         │
  ApiMonitoringMiddleware (Latency & StatusCode track)
         │
         ├──► Local ObservabilityEventBus (decoupled local EventEmitter)
         │          │
         │          ├──► Db Telemetry (PrismaClient query duration & status events)
         │          ├──► Cache Telemetry (Redis connection hit/miss duration events)
         │          ├──► Workflow Telemetry (Transition validations, validation state events)
         │          ├──► Auth Telemetry (Login attempts, session revocations)
         │          ├──► Notification Telemetry (Mail worker DLQ and retry loops)
         │          │
         │          ▼
         └──► ObservabilityService (Aggregated statistics, roll-ups, rolling percentiles)
```

### B. File List & Key Responsibilities
1. **[`backend/src/observability/observability-event-bus.ts`](file:///c:/Users/Admin/OneDrive/Desktop/indent%20application/backend/src/observability/observability-event-bus.ts)**
   - Exports the decoupled local `observabilityEventBus` instance using Node's `EventEmitter` to decouple service execution loops from the metrics aggregator.
2. **[`backend/src/observability/app-logger.service.ts`](file:///c:/Users/Admin/OneDrive/Desktop/indent%20application/backend/src/observability/app-logger.service.ts)**
   - Implements a singleton `AppLogger` extending NestJS `ConsoleLogger`. It reads context-aware correlation IDs from `AsyncLocalStorage` and prepends them to stdout/stderr.
3. **[`backend/src/observability/correlation-id.middleware.ts`](file:///c:/Users/Admin/OneDrive/Desktop/indent%20application/backend/src/observability/correlation-id.middleware.ts)**
   - Initial middleware in the pipeline that extracts or generates a UUID correlation token and runs requests inside the `AsyncLocalStorage` context.
4. **[`backend/src/observability/api-monitoring.middleware.ts`](file:///c:/Users/Admin/OneDrive/Desktop/indent%20application/backend/src/observability/api-monitoring.middleware.ts)**
   - Measures response latencies and emits `'api.request'` events on the observability event bus.
5. **[`backend/src/observability/observability.service.ts`](file:///c:/Users/Admin/OneDrive/Desktop/indent%20application/backend/src/observability/observability.service.ts)**
   - Core metrics repository calculating request averages, rolling P95/P99 latency calculations, caching hit-rates, and keeping a capped history of recent errors.
6. **[`backend/src/observability/observability.controller.ts`](file:///c:/Users/Admin/OneDrive/Desktop/indent%20application/backend/src/observability/observability.controller.ts)**
   - Exposes public health checks and a secured admin metrics endpoint.
7. **[`backend/src/observability/observability.module.ts`](file:///c:/Users/Admin/OneDrive/Desktop/indent%20application/backend/src/observability/observability.module.ts)**
   - Global NestJS module configuring dependencies and exporting providers.

---

## 3. Integration & Instrumentation Summary

The following modules were successfully instrumented to emit telemetry events on the bus:

| Module / Class | File Link | Telemetry Event | Data Captured |
| :--- | :--- | :--- | :--- |
| **PrismaService** | [prisma.service.ts](file:///c:/Users/Admin/OneDrive/Desktop/indent%20application/backend/src/prisma/prisma.service.ts) | `db.query`, `db.connection` | SQL execution duration, target model, query actions, success state, connection state. |
| **RedisCacheService** | [redis-cache.service.ts](file:///c:/Users/Admin/OneDrive/Desktop/indent%20application/backend/src/redis-cache/redis-cache.service.ts) | `redis.op`, `redis.connection` | Cache hit/miss states, operations latency, connection states. |
| **WorkflowStateMachineService** | [workflow-state-machine.service.ts](file:///c:/Users/Admin/OneDrive/Desktop/indent%20application/backend/src/business-transaction/services/workflow-state-machine.service.ts) | `workflow.transition` | Transition states, validation successes, validation failures. |
| **AuthService** | [auth.service.ts](file:///c:/Users/Admin/OneDrive/Desktop/indent%20application/backend/src/auth/services/auth.service.ts) | `auth.event` | Login status, refresh token states, logout calls. |
| **SessionService** | [session.service.ts](file:///c:/Users/Admin/OneDrive/Desktop/indent%20application/backend/src/auth/services/session.service.ts) | `auth.event` | Manual session revocations by users. |
| **CommunicationService** | [communication.service.ts](file:///c:/Users/Admin/OneDrive/Desktop/indent%20application/backend/src/communication/communication.service.ts) | `notification.event` | Notification jobs created, queueing status. |
| **QueueProcessor** | [queue.processor.ts](file:///c:/Users/Admin/OneDrive/Desktop/indent%20application/backend/src/communication/queue/queue.processor.ts) | `notification.event` | Deliveries, retry counts, final DLQ failures. |
| **MailWorker** | [mail.worker.ts](file:///c:/Users/Admin/OneDrive/Desktop/indent%20application/backend/src/communication/queue/mail.worker.ts) | `notification.event` | Critical worker thread loop failures. |

---

## 4. Frontend Observability & UI Dashboard

### A. Frontend Integration & Client Telemetry
1. **[`frontend/src/api/utils/errorTelemetry.ts`](file:///c:/Users/Admin/OneDrive/Desktop/indent%20application/frontend/src/api/utils/errorTelemetry.ts)**
   - Lightweight utility using `window.fetch` to submit script errors to the backend with passive fail-safes.
2. **[`frontend/src/app/main.tsx`](file:///c:/Users/Admin/OneDrive/Desktop/indent%20application/frontend/src/app/main.tsx)**
   - Binds global `window.onerror` and `window.onunhandledrejection` listeners to report uncaught exceptions, promise rejections, and lazy chunk load failures.
3. **[`frontend/src/components/common/GlobalErrorBoundary.tsx`](file:///c:/Users/Admin/OneDrive/Desktop/indent%20application/frontend/src/components/common/GlobalErrorBoundary.tsx)**
   - Reports React UI rendering crashes to the telemetry endpoint.
4. **[`frontend/src/api/interceptors/error.ts`](file:///c:/Users/Admin/OneDrive/Desktop/indent%20application/frontend/src/api/interceptors/error.ts)**
   - Catches Axios connection timeouts or offline status and logs them.

### B. Monitoring Dashboard Page
- **Page Link:** [MonitoringDashboardPage.tsx](file:///c:/Users/Admin/OneDrive/Desktop/indent%20application/frontend/src/pages/MonitoringDashboardPage.tsx)
- Exposes a live, auto-updating dashboard in Settings that displays:
  - **Dynamic Status Lights:** Health flags for Node application, PostgreSQL DB, Caching, and Notification systems.
  - **Performance Benchmarks:** Rolling average API latency, P95/P99 percentiles, and cache hit-rates.
  - **Diagnostics List Stream:** Capped logs lists showing slow requests, SQL slow queries, and uncaught frontend runtime errors.

---

## 5. Verification Results

Integration tests were run via the validation suite script `verify_observability.js` and confirmed:

1. **Liveness Check:** `GET /api/observability/health/liveness` returns status code `200` and `status: "UP"`.
2. **Readiness Check:** `GET /api/observability/health/readiness` dynamically checks PostgreSQL and Redis. Correctly returned `503 Service Unavailable` when Redis connection was offline in local test environment, proving health diagnostics are active.
3. **Correlation Propagation:** Every response returned by the server (including failures and health checks) automatically contains the `x-correlation-id` response header populated with the request's tracing UUID.
4. **Frontend Error Reporting:** `POST /api/observability/frontend-errors` successfully receives, parses, and buffers client exceptions.
5. **Security Controls:** `GET /api/observability/metrics` correctly blocks unauthenticated requests with `401 Unauthorized` and restricts access to users possessing admin privileges (`settings.manage`).

### Backend Build & Verification Status
```bash
> backend@0.0.1 build
> nest build
# Result: Success

> backend@0.0.1 test
> jest
# Result: All 180 unit and queue tests passed successfully.
```

### Frontend Build Status
```bash
> frontend@0.0.0 build
> tsc -b && vite build
# Result: Built bundle optimized in 25.78s with 0 errors.
```

---

## 6. Enterprise Engineering Compliance Statement
We confirm that all Phase 26B observability infrastructure conforms strictly to the constraints outlined in `AGENTS.md`. No existing core schemas, security roles, or Phase 1-8C routes were altered. All telemetry and logging mechanisms are fully decoupled, asynchronous, local, and event-driven.
