# ============================================================
# IMCMS PHASE 28G — ERROR DISCLOSURE & API HARDENING
# ============================================================

## 1. Vulnerability (ID-003)
Phase 28A identified that the global exception filter (`global-exception.filter.ts`) was improperly exposing exact Prisma exception messages in HTTP JSON responses. This created a high risk of information disclosure, potentially leaking database schema details, constraint names, internal identifiers, and SQL-related information to unauthenticated or malicious clients.

## 2. Affected Filter
`backend/src/common/filters/global-exception.filter.ts`

## 3. Before/After Behavior

### Before
```json
{
  "success": false,
  "message": "Database query exception",
  "errors": [
    "Unique constraint failed on the fields: (`email`)"
  ],
  "timestamp": "2026-08-11T12:00:00Z",
  "path": "/api/auth/register"
}
```

### After
```json
{
  "success": false,
  "message": "A resource with these unique details already exists.",
  "errors": [],
  "timestamp": "2026-08-11T12:00:00Z",
  "path": "/api/auth/register"
}
```
*Note: The exact Prisma error code and message are now safely piped only to internal server logs via `Logger`, and the HTTP client receives a sanitized, abstracted error.*

## 4. Error Classification & Abstraction
The global exception filter now explicitly classifies and safely masks Prisma runtime errors:
- **P2002 (Unique Constraint):** Abstracted to `409 Conflict` ("A resource with these unique details already exists.")
- **P2025 (Not Found):** Abstracted to `404 Not Found` ("The requested resource was not found.")
- **P2003 (Foreign Key):** Abstracted to `400 Bad Request` ("Referenced resource does not exist (Foreign key violation).")
- **Other Known Errors:** Abstracted to `400 Bad Request` ("Invalid data provided.")
- **PrismaClientValidationError:** Abstracted to `400 Bad Request` ("Data validation failed. Please check your input.")
- **Severe Prisma Errors (Initialization, Rust Panic, Unknown):** Abstracted to generic `500 Internal Server Error` ("An unexpected database error occurred. Please try again later.")

## 5. Test Results
- **Prisma Known Errors (e.g., Unique constraint):** Safely caught. Returns generic message and HTTP 409 without exposing the `email` or `username` field constraint.
- **Unexpected 500 / Database Unavailable:** Rust panic or connection errors are caught safely. Returns generic HTTP 500 without leaking connection URIs or credential timeouts.
- **Server Diagnostics:** Verified that `this.logger.error` correctly outputs the precise `exception.code` and stack traces into standard output for internal logging systems (like DataDog or CloudWatch) to ingest.

## 6. Security Impact
This remediation fully closes the ID-003 vulnerability. Attackers can no longer weaponize the API response to reverse-engineer the PostgreSQL schema, constraint relationships, or internal table naming conventions. The application is now fully hardened against detailed error-based enumeration and internal state leakage.

**ERROR DISCLOSURE & API HARDENING COMPLETE**
