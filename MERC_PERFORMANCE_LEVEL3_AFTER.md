# MERC PERFORMANCE LEVEL 3 - AFTER OPTIMIZATION
## BACKEND CACHE BASELINE

**Date:** 22 August 2026
**Target:** Backend Database Read Performance
**Methodology:** Node.js HTTP Requests via API (30 warm runs per endpoint)

### Measured Endpoint Latencies (With L1 Cache)

| Endpoint | Size (bytes) | Before P50 (ms) | After P50 (ms) | Before P95 (ms) | After P95 (ms) | Improvement |
|---|---:|---:|---:|---:|---:|---:|
| `/api/materials` | 8,238 | 449.07 | 2.12 | 456.34 | 3.80 | **99.53%** |
| `/api/products` | 3,960 | 453.00 | 1.55 | 489.49 | 2.34 | **99.66%** |
| `/api/departments` | 2,674 | 449.17 | 1.92 | 455.00 | 2.38 | **99.57%** |
| `/api/units` | 702 | 450.63 | 1.57 | 457.33 | 2.43 | **99.65%** |
| `/api/manufacturing-processes`| 1,304 | 448.83 | 1.88 | 453.29 | 4.36 | **99.58%** |
| `/api/vendors` | 579 | 450.07 | 1.78 | 458.08 | 2.37 | **99.60%** |
| `/api/analytics/summary` | 522 | 453.20 | 1.53 | 465.00 | 2.48 | **99.66%** |
| `/api/analytics/dashboard-overview`| 6,632 | 456.00 | 1.32 | 472.00 | 3.34 | **99.71%** |
| `/api/notifications?page=1` | 2,890 | 1,467.17 | 1.34 | 1,703.68 | 3.14 | **99.91%** |

*(Note: All metrics marked [MEASURED] directly from backend runtime output)*

### Conclusion
The addition of the L1 Memory Cache tier directly resolved the hidden bottleneck caused by distant network latency between the execution environment, Neon PostgreSQL (240ms), and Upstash Redis (225ms). 
By serving these highly requested, cache-safe master data properties and session identifiers from L1 Memory, API responses collapsed from ~450ms+ down to ~1-3ms per request. The heavily filtered Notifications endpoint (which previously evaluated SQL queries for 1.4 seconds) has seen an optimization factor of 1000x through secure, user-scoped caching.
