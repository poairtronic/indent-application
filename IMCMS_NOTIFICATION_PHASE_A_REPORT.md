# IMCMS_NOTIFICATION_PHASE_A_REPORT.md

## 1. BUG-001 Root Cause
`CommunicationService.saveEmailLogs` forcefully assigned `jobId` to the `id` field of the `EmailLog` entity, which is defined as a primary key UUID. When iterating over multiple recipients, this resulted in attempting to insert multiple `EmailLog` records with the exact same `id`. This caused a database primary-key collision. The collision error was caught by a generic catch block, swallowed, and the process continued. Consequently, only the first recipient was successfully logged.

## 2. BUG-001 Implementation
- Modified `CommunicationService.saveEmailLogs` to generate a unique `crypto.randomUUID()` for each recipient's `EmailLog` record.
- Added an `emailLogIds: string[]` field to the `IJobPayload` to properly associate multiple unique logs with a single BullMQ job.
- Updated `updateLogStatus` and `finalizeLogStatus` methods to accept an array of IDs and use Prisma's `in` operator for updates.
- This ensures every recipient has an independent log, and the parent job can update the state of all associated logs simultaneously.

## 3. BUG-001 Database Impact
No database schema migration was required. The application now correctly maps UUIDs to `EmailLog.id` and passes the generated keys through the `IJobPayload` without needing to add a new `jobId` column to the `EmailLog` table.

## 4. BUG-001 Tests
Tests were updated to verify that `QueueProcessor` functions (`handleRetry`, `handleFinalFailure`) correctly process and update an array of `emailLogIds`. The tests confirm that the database logs are accurately persisted across multiple recipients using the `in` query logic.

## 5. BUG-002 Root Cause
`QueueProcessor.processJob()` encapsulated SMTP execution in a `try/catch` block. When an error occurred, it invoked a custom `handleFailure()` function. This function calculated a retry delay, manually added a new job to the queue, and then allowed `processJob()` to return normally. Since no exception was thrown, BullMQ recorded the initial failed attempt as "COMPLETED" and tracking was lost. The newly queued job operated independently, breaking BullMQ's native retry, tracking, and backoff systems.

## 6. BUG-002 Implementation
- Removed the custom manual requeue logic from `QueueProcessor.processJob()` and updated it to `throw error`, ensuring BullMQ is notified of the attempt failure.
- Implemented `handleRetry` and `handleFinalFailure` functions in `QueueProcessor`.
- Updated `MailWorker` to hook into BullMQ's native `failed` event. It now compares `job.attemptsMade` against `job.opts.attempts`. If retries remain, it delegates to `handleRetry` (setting DB state to `RETRYING`). If exhausted, it delegates to `handleFinalFailure` (setting DB state to `DEAD_LETTER` and moving the payload to the DLQ).

## 7. BullMQ Retry Configuration
- **Attempts**: Configured via `SMTP_MAX_RETRIES` environment variable (defaults to 4).
- **Backoff**: Set to BullMQ's native `exponential` strategy with a base delay of 300,000ms (5 minutes).

## 8. BUG-002 Tests
Test suites in `queue.spec.ts` were modernized to align with native BullMQ retry logic:
- `should throw error on SMTP delivery failure to trigger BullMQ native retry`
- `should update log status to RETRYING when handleRetry is called`
- `should move to DLQ when max retries are exceeded via handleFinalFailure`

## 9. Files Changed
- `backend/src/communication/queue/queue.constants.ts` (Added `emailLogIds` to `IJobPayload`)
- `backend/src/communication/communication.service.ts` (Generate UUIDs and return array of log IDs)
- `backend/src/communication/queue/queue.service.ts` (Configured BullMQ native attempts and backoff)
- `backend/src/communication/queue/queue.processor.ts` (Re-throw errors, implemented new retry/failure handlers)
- `backend/src/communication/queue/mail.worker.ts` (Added BullMQ `failed` event hook)
- `backend/src/communication/queue/tests/queue.spec.ts` (Updated test expectations)

## 10. Test Results
Backend Tests:
- `npm test -- --runInBand` ran successfully (208 passing tests, 0 failures).
- Backend and Frontend typecheck and build processes completed successfully.

## 11. Redis/BullMQ Verification
BullMQ now properly handles backoff and max attempts natively without double-queueing. The `mail.worker.ts` correctly captures the failure states, triggering the expected DB updates and DLQ migrations.

## 12. Business Regression Verification
No changes were made to existing workflows, recipient resolving rules, frontend notification UI, templates, or the modular auth/RBAC system. The original architecture is fully intact with robust boundaries.

## 13. Remaining Phase B Items
As requested, the following remain deferred to Phase B:
- SMTP configuration changes and env validation (`SMTP_PASSWORD` vs `SMTP_PASS`)
- Duplicate NodemailerProvider / Module destruction cleanup
- `FRONTEND_URL` / `APP_URL` validation
- Notification filtering and rate limiting
- Event tracking mapping, missing business workflow email triggers, dead template cleanup
