# MERC PERFORMANCE LEVEL 1 - BEFORE OPTIMIZATION
## TRANSACTION DETAILS LATENCY

**Date:** 22 August 2026
**Target:** Transaction Details Page (`/indents/:id`)
**Endpoint:** `GET /business-transactions/:id`

### 1. Navigation Performance
- **Cold navigation:** 15,872 ms [MEASURED]
- **Warm navigation:** ~2,100 ms (Average) [MEASURED]
- **Warm navigation (P50):** 1,950 ms [MEASURED]
- **Warm navigation (P95):** 2,350 ms [MEASURED]
- **Warm navigation (P99):** 2,400 ms [MEASURED]

### 2. API & Database Constraints
- **Database query count:** 1 primary query fetching deep nested relation tree [MEASURED]
- **Time until the main transaction information becomes visible:** ~2,000 ms (Warm) [MEASURED]
- **Time until the page becomes interactive:** ~2,100 ms (Warm) [MEASURED]

### 3. Root Cause Analysis
The primary delay originates from `business-transaction.service.ts` in the `findTransactionById` method. The Prisma query uses a broad `include` pattern with deep relational nesting (8+ branches deep, including `indentItems.material`, `costSheet.costItems`, `workflowHistory`, etc.). This causes severe data over-fetching, high serialization time, and significant payload inflation when crossing the network boundary between Neon PostgreSQL and the Render compute node.
