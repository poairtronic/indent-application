# Phase 28G: Error Disclosure & API Hardening

## Goal
Secure the application's global exception filter (`global-exception.filter.ts`) to prevent it from leaking internal database implementation details, stack traces, schema details, or credentials to HTTP clients, while preserving detailed diagnostics in the server logs.

## Proposed Changes

### 1. Hardening Global Exception Filter
#### [MODIFY] backend/src/common/filters/global-exception.filter.ts
- Prevent exposing raw `PrismaClientKnownRequestError` exception messages to the client.
- Implement explicit handling for common Prisma codes:
  - **P2002 (Unique constraint failed):** Convert to `409 Conflict` with a generic message like `"A resource with these unique details already exists."`
  - **P2025 (Record not found):** Convert to `404 Not Found` with `"The requested resource was not found."`
  - **P2003 (Foreign key violation):** Convert to `400 Bad Request` with `"Invalid reference provided."`
  - **Other Prisma Request Errors:** Convert to generic `400 Bad Request` with `"Invalid data provided."`
- Catch `PrismaClientValidationError` and return a safe `400 Bad Request` (`"Data validation failed."`).
- Catch severe Prisma errors (`PrismaClientInitializationError`, `PrismaClientRustPanicError`, `PrismaClientUnknownRequestError`) and mask them as generic `500 Internal Server Error` without exposing the DB connection state.
- Ensure all detailed error strings, codes, and stack traces are pushed to `this.logger.error()` for internal telemetry but scrubbed from the `errors` array in the HTTP JSON response.

### 2. Output Report
#### [NEW] docs/PHASE_28G_ERROR_DISCLOSURE_HARDENING.md
- Create the final report detailing the vulnerability, before/after behavior, error classifications, test results, and security impact as requested.

## Verification Plan
### Automated Tests
- Run `backend/test-rate-limiting.ts` to ensure the server still boots correctly.

### Manual Verification
- Manually trigger a 404/401/409 locally to verify that the HTTP response is safe, but the server terminal prints the full diagnostic.

## User Review Required
> [!IMPORTANT]
> The exact Prisma messages (which sometimes include constraint names or partial payload dumps) will be replaced by user-friendly, abstracted strings. Application logs will still capture the exact Prisma stack trace for debugging. Please review and approve to proceed with the implementation.
