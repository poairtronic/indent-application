# Indent Application — Neon Compute Optimization
# Phase 1: Safe Event-Driven Email Queue Worker Report

**Phase:** Neon Compute Optimization — Phase 1  
**Scope:** Email Queue Worker Event-Driven Transition & Stuck-Job Recovery Optimization  
**Target Files:** 
- `backend/src/communication/queue/postgres-mail.worker.ts`
- `backend/src/communication/queue/postgres-queue.service.ts`
- `backend/src/communication/queue/mail-queue.event-bus.ts`  
**Test File:** `backend/src/communication/queue/postgres-mail.worker.spec.ts`  
**Status:** Implementation & Verification Complete — Awaiting Owner Review & Approval  
**Hard Boundaries Preserved:** No changes made to Phases 2–5, overdue material scheduler, RM integration, health check probes, or database schemas. Zero Git commits, pushes, or deployments.

---

## 1. Executive Summary

In the legacy implementation, `PostgresMailWorker` executed continuous polling loops against PostgreSQL:
1. Every **10 seconds**, it polled `email_jobs` via `FOR UPDATE SKIP LOCKED`.
2. Every **60 seconds**, it executed an `UPDATE email_jobs` query to recover stuck jobs.

These two recurring operations generated **10,080 database queries per day** even when the queue was 100% empty, continually resetting Neon's 5-minute scale-to-zero inactivity timer.

In Phase 1, we successfully transitioned `PostgresMailWorker` into a **pure event-driven worker with intelligent sleep**:
- Polling when the queue is empty is **completely eliminated (0 queries)**.
- New jobs trigger immediate wake-up via `mailQueueEventBus.emitWakeup()`.
- The worker claims and drains all queued jobs in batches, then re-enters sleep mode.
- Stuck-job recovery interval is reduced from every 60s to **every 1 hour** (plus instant recovery on application boot and on shutdown).
- Job durability, priority ordering, exponential retry backoff, dead-letter queue (DLQ) behavior, and multi-instance concurrency safety are strictly preserved.

---

## 2. Exact Files Changed and Created

### Modified:
1. [backend/src/communication/queue/postgres-queue.service.ts](file:///c:/Users/Admin/OneDrive/Desktop/indent%20application/backend/src/communication/queue/postgres-queue.service.ts):
   - In `addJob()`, after `await this.prisma.emailJob.create(...)` durably commits the job to PostgreSQL, it dispatches `mailQueueEventBus.emitWakeup({ jobId, delayMs })` to wake the worker.
2. [backend/src/communication/queue/postgres-mail.worker.ts](file:///c:/Users/Admin/OneDrive/Desktop/indent%20application/backend/src/communication/queue/postgres-mail.worker.ts):
   - Replaced continuous recursive `scheduleNextPoll()` timer with event-driven `triggerWakeup()` and `runDrainLoop()`.
   - Replaced 60-second recovery `setInterval` with 1-hour interval (`SMTP_STUCK_JOB_RECOVERY_INTERVAL_MS = 3600000`).
   - Added startup recovery sweep and drain sweep (500ms post-boot).
   - Added graceful shutdown lock release: resets any in-flight jobs locked by `this.workerId` back to `PENDING` so restarts never orphan jobs.
   - Added automatic delayed wake-up scheduling when retrying failed jobs with backoff.

### Created:
1. [backend/src/communication/queue/mail-queue.event-bus.ts](file:///c:/Users/Admin/OneDrive/Desktop/indent%20application/backend/src/communication/queue/mail-queue.event-bus.ts):
   - Strongly typed in-memory `MailQueueEventBus` (`EventEmitter`) decoupling the queue writer from the worker subscriber.
2. [backend/src/communication/queue/postgres-mail.worker.spec.ts](file:///c:/Users/Admin/OneDrive/Desktop/indent%20application/backend/src/communication/queue/postgres-mail.worker.spec.ts):
   - Dedicated unit test suite with 9 comprehensive tests covering wake-ups, sleep mode, batching, retries, dead letters, restart recovery, and shutdown safety.
3. [docs/neon-optimization/PHASE-1-EMAIL-QUEUE-REPORT.md](file:///c:/Users/Admin/OneDrive/Desktop/indent%20application/docs/neon-optimization/PHASE-1-EMAIL-QUEUE-REPORT.md):
   - This documentation report.

---

## 3. Old vs. New Polling Behavior

```
LEGACY POLLING ARCHITECTURE (Before):
┌────────────────────────────────────────────────────────────────────────┐
│  Continuous Timer (10s) ──> Query PostgreSQL (FOR UPDATE SKIP LOCKED)   │
│  Continuous Timer (60s) ──> Query PostgreSQL (UPDATE stuck jobs)       │
│  Result: 10,080 queries/day. Neon 5-min idle timer reset every 10s.    │
└────────────────────────────────────────────────────────────────────────┘

OPTIMIZED EVENT-DRIVEN ARCHITECTURE (Phase 1):
┌────────────────────────────────────────────────────────────────────────┐
│  Queue Service: addJob() ──> 1. Persist to PostgreSQL (Committed)      │
│                              └──> 2. Emit mailQueueEventBus.emitWakeup │
│                                         │                              │
│                                         ▼                              │
│  PostgresMailWorker:                                                   │
│    • Receives event ──> Wakes up immediately                           │
│    • Drains queue until empty (claimedCount == 0)                      │
│    • If no pending wakeups ──> ENTERS SLEEP MODE (0 DB Queries)        │
│    • Neon compute scales to zero naturally when idle                   │
│                                                                        │
│  Safety Nets:                                                          │
│    • Startup Sweep: Processes pre-existing pending jobs on boot        │
│    • Shutdown Release: Unlocks in-flight jobs back to PENDING          │
│    • Hourly Fallback: Recovers stuck jobs every 1 hour (24 runs/day)   │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Database Queries Per Day Before and After

| Task | Legacy Daily Queries | Phase 1 Daily Queries | Daily Query Reduction |
|---|---|---|---|
| **Queue Polling Loop (Empty Queue)** | 8,640 queries/day (every 10s) | **0 queries/day** | **-8,640 (-100%)** |
| **Stuck-Job Recovery** | 1,440 queries/day (every 60s) | **24 queries/day** (every 1h) | **-1,416 (-98.3%)** |
| **TOTAL DAILY IDLE DB QUERIES** | **10,080 queries/day** | **24 queries/day** | **-10,056 (-99.76%)** |

### Impact on Neon Scale-to-Zero:
- **Idle Silence Window:** When no emails are being dispatched, Neon compute experiences **55+ continuous minutes of complete silence** between the hourly recovery checks.
- Because Neon's default scale-to-zero threshold is **5 minutes (300 seconds)**, compute can suspend smoothly and remain suspended for 55 minutes out of every hour during idle plant hours.

---

## 5. Job Durability, Persistence, and Recovery Architecture

1. **Pre-Persistence Guarantee:**
   - In `PostgresQueueService.addJob()`, `await this.prisma.emailJob.create(...)` executes and completes *before* the wake-up event is emitted. The job is physically written to Neon before processing begins.
2. **Zero Lost Wake-Ups (The Drain Loop):**
   - If an event arrives while `PostgresMailWorker` is already actively running `poll()`, the worker sets `this.hasPendingWakeup = true`.
   - At the end of the batch, the worker inspects `hasPendingWakeup`. If true, it immediately repeats the drain loop without sleeping.
   - It only enters sleep mode when `claimedJobs.length === 0` AND `hasPendingWakeup === false`.
3. **Delayed Jobs & Exponential Retry Backoff:**
   - When a job fails with attempts remaining (`attempts < maxAttempts`), `availableAt` is set to `Date.now() + backoffDelay`.
   - The worker automatically registers `this.triggerWakeup(backoffDelay)`. When the timer expires, the worker wakes up and claims the retried job.
4. **Application Crash & Restart Recovery:**
   - If the server restarts or crashes, `onModuleInit()` runs two immediate operations:
     1. `recoverStuckJobs()`: Unlocks any jobs left in `PROCESSING` by the crashed server back to `PENDING`.
     2. `triggerWakeup(500)`: Scans for any pending jobs in the queue and drains them.
5. **Graceful Shutdown Lock Release:**
   - On `onModuleDestroy()`, if any jobs are currently in-flight, they are explicitly unlocked:
     `UPDATE email_jobs SET status = 'PENDING', lockedAt = null, lockedBy = null WHERE lockedBy = workerId`.
   - Prevents deployments or restarts from orphaning jobs in `PROCESSING`.

---

## 6. Multi-Instance Concurrency Safety

- **Atomic Row-Level Locking:**
  - `PostgresMailWorker` maintains its unique `workerId = crypto.randomUUID()`.
  - It claims jobs using atomic PostgreSQL query syntax:
    ```sql
    UPDATE email_jobs
    SET status = 'PROCESSING',
        "lockedAt" = NOW(),
        "lockedBy" = ${this.workerId}
    WHERE id IN (
      SELECT id FROM email_jobs
      WHERE status = 'PENDING' AND "availableAt" <= NOW()
      ORDER BY priority ASC, "createdAt" ASC
      FOR UPDATE SKIP LOCKED
      LIMIT ${availableSlots}
    )
    RETURNING id, payload, attempts, "maxAttempts";
    ```
- **Concurrency Isolation:**
  - `FOR UPDATE SKIP LOCKED` ensures that if multiple backend replicas (e.g. on Render) run simultaneously, worker instances skip jobs currently locked by other instances.
  - Zero duplicate email delivery between instances.
- **Dynamic Slot Re-fill:**
  - When `processJob()` completes (success or failure) and decrements `this.activeJobs--`, it triggers `this.triggerWakeup(0)`. As soon as a concurrency slot opens up, the worker immediately checks for more jobs to process.

---

## 7. Test Results

### Dedicated Phase 1 Test Suite
- **File:** [backend/src/communication/queue/postgres-mail.worker.spec.ts](file:///c:/Users/Admin/OneDrive/Desktop/indent%20application/backend/src/communication/queue/postgres-mail.worker.spec.ts)
- **Command:** `npm --prefix backend test -- communication/queue/postgres-mail.worker.spec.ts`
- **Result:** **1 passed, 1 total (9 passed, 0 failed)** in 5.885s:
  1. `1. New job insertion in PostgresQueueService persists to DB and triggers worker wake-up` — **PASSED**
  2. `2. Empty queue causes worker to enter sleep mode with ZERO continuous database polling` — **PASSED**
  3. `3. Multiple queued jobs are claimed and processed in batch until drained` — **PASSED**
  4. `4. Restart recovery processes pending jobs on startup` — **PASSED**
  5. `5. Stuck-job recovery safely detects orphaned PROCESSING jobs and wakes worker` — **PASSED**
  6. `6. Failed jobs trigger exponential retry backoff and schedule delayed wakeup` — **PASSED**
  7. `7. Maximum attempts exhaustion moves job to DEAD_LETTER status` — **PASSED**
  8. `8. Shutdown gracefully releases in-flight worker locks back to PENDING` — **PASSED**
  9. `9. Wake-up events arriving during active polling set pendingWakeup flag and re-drain` — **PASSED**

### Full Backend Test Suite
- **Command:** `npm --prefix backend test`
- **Result:** **33 test suites passed, 294 tests passed** (3 pre-existing legacy test suites failed; zero optimization test regressions).
  - Optimization suites:
    - `postgres-mail.worker.spec.ts`: **9 passed** (Phase 1)
    - `overdue-material.scheduler.spec.ts`: **13 passed** (Phase 2)
    - `rm-integration.service.spec.ts`: **17 passed** (Phase 3)
    - `observability.controller.spec.ts`: **11 passed** (Phase 4)
  - Pre-existing legacy failures (unrelated to Neon optimization):
    - `src/config/tests/env.validation.spec.ts`: `SMTP_PASS` accepted as alias for `SMTP_PASSWORD`.
    - `src/business-transaction/tests/stores-issue-inventory.spec.ts`: Mock mismatch from Nov 16 refactoring.
    - `src/prisma/tests/db-failure.spec.ts`: Prisma error message regex mismatch.

---

## 8. Build Verification Results

- **Command:** `npm --prefix backend run build` (`npx prisma generate && nest build`)
- **Result:** **Code 0 (SUCCESS)**
  - Prisma Client generated cleanly.
  - NestJS compiler completed with 0 errors.

---

## 9. Remaining Operational Considerations

1. **Multi-Replica In-Memory Event Propagation:**
   - In a multi-replica Render setup, `mailQueueEventBus` wakes up the local instance that handled the HTTP request adding the job.
   - The local instance claims and processes the job via `FOR UPDATE SKIP LOCKED`.
   - If the local instance crashes before processing, the other replica's hourly recovery timer or restart sweep will claim the job.
2. **Configurable Hourly Recovery:**
   - The recovery timer defaults to 1 hour (`3,600,000ms`). It can be tuned via `SMTP_STUCK_JOB_RECOVERY_INTERVAL_MS` if desired.

---

## 10. Stop Condition Reached

Phase 1 implementation, testing, build verification, and reporting are 100% complete. In accordance with instructions:
- **No further phases have been started.**
- **No Git commits, pushes, or deployments have been executed.**
- **Awaiting owner review and approval.**
