# ============================================================
# IMCMS PHASE 28F — RATE LIMITING & ABUSE PROTECTION
# ============================================================

## 1. Finding (ID-005)
Phase 28A identified the absence of a global NestJS throttling/rate-limiting mechanism. This left the application vulnerable to automated abuse, brute-force attacks on authentication endpoints, credential stuffing, and uncontrolled volume requests on heavy operations like file uploads and analytics generation.

## 2. Distributed Architecture Integration
The solution preserves and deeply integrates with the existing architectural infrastructure:
- **Redis Integration**: Leverages the official community `@nest-lab/throttler-storage-redis` package, hooking directly into the existing Upstash Redis deployment without requiring a secondary cache cluster.
- **Proxy/IP Preservation**: Configured Express to explicitly trust the proxy (`app.set('trust proxy', 1)`), ensuring the Render load balancer properly forwards the client's original IP to `req.ip` instead of attributing all traffic to internal cluster nodes.
- **NAT Exhaustion Prevention**: Recognizing that 20+ legitimate IMCMS users may operate from the same corporate facility behind a single outbound NAT router, the global throttler tracker overrides `req.ip` with `req.user.id` when the request is authenticated. This isolates limits per-user for authenticated sessions while correctly restricting unauthenticated vectors (like `/login`) via IP.

## 3. Rate Limit Policies & Thresholds
A `ThrottlerGuard` has been registered globally. The default limit acts as a high-capacity baseline to protect against general DoS while remaining invisible to legitimate users. Specific, sensitive routes override this default with much stricter thresholds using `@Throttle()` decorators.

| Category               | Rate Limit              | Rationale                                                                |
|------------------------|-------------------------|--------------------------------------------------------------------------|
| **Global Default**     | 300 requests / minute   | Safe baseline for standard API usage, preventing general DoS without disrupting SPAs. |
| **Authentication**     | 5 requests / minute     | Strong brute-force and credential stuffing prevention for `login` and `refresh`. |
| **Password Ops**       | 3 requests / minute     | Prevents spamming `forgot-password`, `reset-password`, `change-password`.|
| **File Uploads**       | 20 requests / minute    | Mitigates disk exhaustion / S3 upload spam.                              |
| **File Downloads**     | 30 requests / minute    | Prevents automated data scraping and heavy egress bandwidth abuse.         |
| **Analytics/Reports**  | 50 requests / minute    | Restricts heavy database aggregation queries from being spammed.           |

## 4. Regression & Verification Results
A dedicated validation script (`backend/test-rate-limiting.ts`) was executed, firing rapid consecutive requests at the unauthenticated `/api/auth/login` endpoint.
- ✅ **Requests 1-5**: Successfully processed (returned standard 401 Unauthorized, indicating the login flow executed).
- ✅ **Request 6**: Correctly intercepted by the ThrottlerGuard (returned `429 Too Many Requests`).
- ✅ **Redis Health**: Redis connected correctly and TTL keys (`throttler:`) expired as expected, freeing the limit.
- ✅ **Queue Health**: BullMQ and general cache remain entirely unaffected, confirming structural compatibility.

## 5. Final Verdict

**RATE LIMITING & ABUSE PROTECTION COMPLETE**
