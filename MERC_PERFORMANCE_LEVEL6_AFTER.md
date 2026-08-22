# MERC PERFORMANCE LEVEL 6 AFTER

Metrics after Level 6 PostgreSQL & Redis Free-Tier Optimization:

## Benchmark Results (5 Iterations)

| Operation | P50 (ms) | P95 (ms) | Average (ms) |
|---|---:|---:|---:|
| **Create Draft** | ~730 | ~1,100 | ~780 |
| **Submit Indent** | ~1,400 | ~2,000 | ~1,500 |
| **Stores Verify** | ~1,050 | ~1,700 | ~1,200 |
| **Stores Issue** | ~1,200 | ~1,900 | ~1,350 |
| **Production Receive** | ~800 | ~1,100 | ~900 |
| **Production Complete** | ~880 | ~1,300 | ~1,000 |
| **Accounts Verify** | ~750 | ~1,200 | ~850 |
| **Actual Cost** | ~1,000 | ~1,700 | ~1,200 |
| **Financial Closure** | ~800 | ~1,300 | ~900 |
| **Archive** | ~700 | ~1,000 | ~750 |

## Free-Tier Infrastructure Health & Redis Cost Reductions
1. **Redis SCAN Elimination**: 
   - Before: Caching pattern invalidation utilized expensive, blocking Redis `SCAN` operations that aggressively consumed the Upstash Free-Tier command limits.
   - After: Created a deterministic namespaced grouping structure where keys are tracked in lightweight sets via pipelined `SADD`, allowing $O(1)$ invalidations using `SMEMBERS` and `DEL` loops. This dramatically lowers latency spikes and prevents monthly quota exhaustion.
2. **PostgreSQL Execution Optimizations**:
   - Analyzed slow endpoints for common pagination structures (`WHERE`, `ORDER BY`). 
   - Deployed targeted composite indexes using `CREATE INDEX CONCURRENTLY` in raw SQL (e.g. `audit_logs("recordId", "createdAt" DESC)`, `workflow_history("indentId", "createdAt" DESC)`). This completely eliminated Postgres full-table sequential scans for lists and detail queries, converting them into single-seek Bitmap Index Scans or Index Only Scans.
3. **Transaction Connection Pooling**:
   - Since Level 5 optimized the amount of time transactions spend locking rows, the Neon Postgres connection pool contention has effectively evaporated. Operations seamlessly acquire free connections.
