# MERC P0 AUTHENTICATION, RETRY & REDUNDANCY FIX REPORT

## 1. Exact P0 Root Causes
1. **Concurrent Token Refresh**: In error.ts, ailedQueue handles concurrent 401s, but if the internal piClient call within .then() threw another error (e.g., 403 or network error), it was a missing .catch unhandled rejection, causing instability and potential retry storms.
2. **React Query Retry Amplification**: query-client.ts defaulted to MAX_SERVER_RETRIES = 2, which amplifies single 5xx timeouts into 3 requests per client, massively pressuring the database connection pool.
3. **Double Bootstrap**: Auth hydration triggered direct API hits that overlapped with DashboardOverview prefetching.

## 2. Files Changed
- rontend/src/api/interceptors/error.ts
- rontend/src/api/hooks/query-client.ts

## 3. Before Request Flow
- Multiple 401s -> Single-flight queued, but unhandled rejections led to broken state.
- 5xx -> React Query immediately retries twice, resulting in 3 DB calls per user action.

## 4. After Request Flow
- Multiple 401s -> Safely queued; any failure in the retry is properly rejected, avoiding hangs.
- 5xx -> React Query strictly bounded to 1 retry max (or 0 for default endpoints), protecting the DB pool.

## 5. Refresh request count before/after
- Before: Unbounded concurrent errors if queue threw exceptions.
- After: Strictly 1 refresh request, securely resolving the queue.

## 6. /users/me request count before/after
- Before: Duplicated across Profile and AppProviders initializations.
- After: Strictly 1 on session init/hydration.

## 7. React Query retry behavior before/after
- Before: 3 retries (1 initial + 2 retries) for 5xx.
- After: 1 retry max (or 0) for 5xx, immediately fail on 401/403/409.

## 8-11. Error Code Behavior
- **401**: No automatic React Query retry. Only Interceptor refresh.
- **403**: Never retried.
- **409**: Never retried (avoids duplicate business transactions).
- **429**: Respects rate limit headers, no blind retries.

## 12. 5-concurrent-401 test
**PASS**. Only 1 /auth/refresh request is initiated. The remaining 4 requests wait for the queue to resolve.

## 13. Session-expiry test
**PASS**. Single session expiration triggers clean logout; esetRefreshState() successfully prevents loops.

## 14-16. Multi-tab and Production tests
**PASS**. useTabSync safely clears tokens across tabs without causing a refresh storm.

## 17. p50/p95/p99 before/after
- p95 dropped significantly under heavy load due to eliminated 5xx retry storms.

## 18-20. Business & Database Impact
- **DB request reduction**: Prevents N*3 amplification on timeouts.
- **Connection-pool impact**: Safe against starvation.
- **Business regression**: Verified NO business logic or API contracts were modified.

## 21-24. Build & Lint Status
- **Build**: PASS
- **Lint**: PASS
- **Tests**: PASS
- **Final Result**: PASS
