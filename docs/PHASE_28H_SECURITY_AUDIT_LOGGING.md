# ============================================================
# IMCMS PHASE 28H — SECURITY AUDIT LOGGING HARDENING
# ============================================================

## 1. Current Implementation
The application employs a federated logging approach tailored to the semantic meaning of events. The observability architecture relies on the following Prisma models to securely persist audit data without leaking infrastructure secrets:

1. **ActivityLog (`ActivityLog`)**: Used exclusively for identity and security operations (Auth).
2. **AuditLog (`AuditLog`)**: Captures standard CRUD lifecycle events across core master data (Users, Vendors, Units, Processes).
3. **WorkflowHistory (`WorkflowHistory`)**: Captures business-level transitions (Indents, Cost Sheets) providing non-repudiable state histories.
4. **AppLogger (`AppLogger`)**: Real-time console diagnostics utilizing `correlationIdAls` for distributed tracing.

## 2. Security Events Verification

### Authentication & Authorization
- **Login Success/Failure**: Handled in `login-history.service.ts`. Logs to `ActivityLog` capturing IP, Device, and failure reason (abstracted, e.g., "Invalid password").
- **Logout**: Handled in `login-history.service.ts`. Logs session termination details safely.
- **Refresh/Session Revocation**: Telemetry emitted via `observabilityEventBus`. Hard token revocation relies on database deletion of `RefreshToken` and `UserSession`.
- **Account Lock**: Verified in `account-security.service.ts`. `ACCOUNT_LOCKED` explicitly logs the threshold breach without leaking internal credentials.
- **Authorization**: Access violations (e.g., `RolesGuard`) are strictly rejected via `ForbiddenException` and passed to standard telemetry (AppLogger), avoiding DB bloat for routine scans/probes.

### Users & Identity
- **Password Changes**: Captured in `ActivityLog` as `PASSWORD_RESET` or `PASSWORD_CHANGE`. The hash itself is **never** logged.
- **Role/Permission Changes**: Captured in `AuditLog` via `users.service.ts`. The `createAuditLog` method strictly serializes the `UserResponseDto` (which guarantees omission of the password payload) into the `newValue` JSONB column.

### Documents & Business
- **Documents**: `business-transaction.service.ts` tracks attachment linkage. Revisions emit historical artifacts safely.
- **Business Workflows**: Exclusively governed by `WorkflowHistory`, ensuring a sequential, append-only ledger for all Indent stage progression.

## 3. Sensitive-Data Filtering
The audit logging has been manually verified against the leakage of critical secrets. 

**Verified Omissions:**
- **Passwords & Hashes**: Stripped from User CRUD operations via `mapToResponse` before reaching `AuditLog`.
- **JWT / Refresh Tokens**: Handled as hashed comparisons in `TokenService`; the plaintext tokens are not transmitted to `ActivityLog`.
- **System Secrets**: `DATABASE_URL`, Supabase Keys, and Redis Passwords are strictly confined to the `@nestjs/config` context and never participate in the standard CRUD/Audit loops.

## 4. Audit Integrity & Performance Considerations
- **Execution Integrity**: The `createAuditLog` utility in core services (e.g., `users.service.ts`) executes the Prisma `create` call within a `try/catch` block. This ensures that if the audit log fails (e.g., due to a brief DB timeout), the primary business transaction is not rolled back, preventing denial-of-service via log exhaustion.
- **JSONB Optimization**: `oldValue` and `newValue` use PostgreSQL `JSONB` for optimized indexing without polluting unstructured text blobs.
- **Duplicate Events**: By scoping logic to specific controller endpoints rather than global middleware, the system prevents logging identical workflow logic twice.

## 5. Test Results
- **Authentication Bypass Check**: Failed logins increment `failedLoginAttempts`. Reaching the threshold successfully creates an `ACCOUNT_LOCKED` log without exposing the hashed DB state.
- **Data Scrubbing Check**: Updating a user (e.g., changing their department) successfully records the `DEPARTMENT_CHANGE` inside `AuditLog`. The `password` and `refreshToken` fields were confirmed absent from the `newValue` JSON payload.

**STATUS: VERIFIED AND HARDENED. SECURE EVENT LOGGING IS PRODUCTION-READY.**
