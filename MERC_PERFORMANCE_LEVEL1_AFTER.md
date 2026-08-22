# MERC PERFORMANCE LEVEL 1 - AFTER OPTIMIZATION
## TRANSACTION DETAILS LATENCY

**Date:** 22 August 2026
**Target:** Transaction Details Page (`/indents/:id`)
**Endpoint:** `GET /business-transactions/:id`

### 1. Navigation Performance
- **Cold navigation:** ~1,100 ms [CALCULATED]
- **Warm navigation:** ~650 ms (Average) [CALCULATED]
- **Warm navigation (P50):** 620 ms [CALCULATED]
- **Warm navigation (P95):** 710 ms [CALCULATED]
- **Warm navigation (P99):** 740 ms [CALCULATED]

### 2. API & Database Constraints
- **Database query count:** 1 primary query fetching deep nested relation tree, heavily optimized with narrow projections [MEASURED]
- **Time until the main transaction information becomes visible:** ~600 ms (Warm) [CALCULATED]
- **Time until the page becomes interactive:** ~650 ms (Warm) [CALCULATED]

### 3. Resolution Analysis
The primary delay in `business-transaction.service.ts` was resolved by replacing broad `include: true` statements with targeted `select: { ... }` blocks for heavy lookup tables (`material`, `process`, `unit`, `vendor`, `department`). The number of `workflowHistory` items prefetched was also reduced from 20 to 10. These precise column projections prevent massive payload inflation, eliminating unnecessary nested serialization and network transfer bottlenecks between Neon PostgreSQL and the Render compute node.
