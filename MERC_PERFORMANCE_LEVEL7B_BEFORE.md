# MERC PERFORMANCE LEVEL 7B — BEFORE MEASUREMENTS

Generated: 2026-08-22T08:30:00Z
Benchmark: benchmark-workflow.js (5 iterations) + benchmark-item-issue.js (5 iterations)
Backend: localhost:3001
Database: Neon PostgreSQL

## Full Workflow Benchmark (5 iterations)

| Operation | P50 (ms) | P95 (ms) | Avg (ms) |
|---|---:|---:|---:|
| Create Draft | 6896.01 | 10237.33 | 7597.43 |
| Submit Design | 3452.48 | 3675.49 | 3072.33 |
| Stores Verify | 3068.15 | 3998.61 | 3201.20 |
| Stores Issue | 3180.16 | 4052.37 | 3397.28 |
| Production Receive | 976.97 | 1260.42 | 1028.38 |
| Production Complete | 1009.39 | 1162.43 | 1031.95 |
| Accounts Verify | 1011.25 | 2151.48 | 1256.37 |
| Actual Cost | 1063.14 | 1893.84 | 1219.38 |
| Financial Closure | 982.57 | 1188.62 | 1017.28 |
| Archive | 979.21 | 1188.48 | 1013.47 |

## Item-Level Issue Benchmark (5 iterations)

| Operation | P50 (ms) | P95 (ms) | Avg (ms) |
|---|---:|---:|---:|
| Create Draft (2 items) | 7106.13 | 7421.80 | 6101.47 |
| Submit Design | 2564.11 | 5408.27 | 3274.22 |
| Stores Verify | 2876.60 | 3579.30 | 2934.02 |
| Issue Single Item (partial) | 2680.12 | 4774.44 | 2869.35 |
| Issue Second Item (full completion) | 6764.98 | 7413.12 | 6554.85 |

## Key Observations

1. **issueSecondItem (full completion) is 2.5x slower than issueSingleItem (partial)**
   - Partial issue P50: 2680ms
   - Full completion P50: 6765ms
   - Delta: ~4085ms (due to nested storesIssueMaterials delegation)

2. **The full completion path triggers redundant:**
   - `getTransactionContext()` — duplicate DB query
   - `indentItem.findMany` with material include — duplicate DB query
   - Department lookup — duplicate DB query
   - State validation — redundant
   - Workflow history creation — handled by delegation
   - Notification dispatch — handled by delegation
   - Audit logging — handled by delegation

3. **DB Query Count per operation (from Level 6 inventory):**
   - Issue single item (partial): ~4 queries
   - Issue single item (full completion): ~4 + ~10 = ~14 queries
   - After optimization (full completion): ~4 + ~4 = ~8 queries
   - Expected reduction: ~6 queries per full completion

## Estimated DB Queries Per Workflow Transition (Before)

| Operation | Estimated DB Queries |
|---|---:|
| Create Draft | ~15 |
| Submit | ~7 |
| Stores Verify | ~7 |
| Stores Issue (bulk) | ~10+ |
| Issue Single Item (partial) | ~4 |
| Issue Single Item (full completion) | ~14 |
| Production Receive | ~6 |
| Production Complete | ~5 |
| Accounts Verify | ~5 |
| Actual Cost | ~8 |
| Financial Closure | ~6 |
| Archive | ~5 |
