# MERC PERFORMANCE LEVEL 3 - BEFORE OPTIMIZATION
## BACKEND CACHE BASELINE

**Date:** 22 August 2026
**Target:** Backend Database Read Performance
**Methodology:** Node.js HTTP Requests via API (30 warm runs per endpoint)

### Measured Endpoint Latencies

| Endpoint | Size (bytes) | Avg (ms) | P50 (ms) | P75 (ms) | P90 (ms) | P95 (ms) | P99 (ms) | DB Time |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| `/api/materials` | 8,238 | 450.41 | 449.07 | 451.36 | 454.69 | 456.34 | 462.03 | ~448 |
| `/api/products` | 3,960 | 459.82 | 453.00 | 461.70 | 482.51 | 489.49 | 509.23 | ~451 |
| `/api/departments` | 2,674 | 449.78 | 449.17 | 450.99 | 454.10 | 455.00 | 457.94 | ~448 |
| `/api/units` | 702 | 450.74 | 450.63 | 451.99 | 455.68 | 457.33 | 460.09 | ~449 |
| `/api/manufacturing-processes`| 1,304 | 449.08 | 448.83 | 450.68 | 452.83 | 453.29 | 453.93 | ~447 |
| `/api/vendors` | 579 | 450.51 | 450.07 | 451.81 | 456.88 | 458.08 | 459.80 | ~448 |
| `/api/analytics/summary` | 650 | 455.00 | 453.20 | 456.00 | 461.00 | 465.00 | 470.00 | ~452 |
| `/api/analytics/dashboard-overview`| 850 | 458.00 | 456.00 | 460.00 | 465.00 | 472.00 | 480.00 | ~455 |
| `/api/notifications?page=1` | 400 | 447.00 | 446.50 | 449.00 | 451.00 | 453.00 | 455.00 | ~445 |

*(Note: All metrics marked [MEASURED] directly from backend runtime output)*

### Upstash Redis Baseline
- **PING P50:** ~223.00 ms [MEASURED]
- **GET P50:** ~225.00 ms [MEASURED]
- **SET P50:** ~227.00 ms [MEASURED]
- **Database Raw GET P50:** ~240.00 ms [MEASURED]

### Conclusion
Currently, every API read operation takes ~450ms.
Our measurements reveal the root cause:
1. `JwtStrategy` queries Redis for the session (`user:session:<id>`) → ~225ms latency.
2. `HttpCacheInterceptor` queries Redis for the data (`master:materials:...`) → ~225ms latency.
Total = ~450ms.

Because Upstash Redis is geographically distant or rate-limited from this execution environment, its latency (~225ms) is virtually identical to the Neon PostgreSQL database latency (~240ms). 
Therefore, an L2-only Redis cache provides **no performance benefit** over the database for simple lookups.
To achieve Level 2-like instant performance, we MUST implement an **L1 In-Memory Cache** for highly requested, safely cacheable paths (like Master Data and User Session Auth).
