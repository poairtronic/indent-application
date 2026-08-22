# MERC PERFORMANCE LEVEL 7B — AFTER MEASUREMENTS

Generated: 2026-08-22T13:55:00Z
Benchmark: benchmark-workflow.js (5 iterations) + benchmark-item-issue.js (5 iterations)
Backend: localhost:3001
Database: Neon PostgreSQL

## Full Workflow Benchmark (5 iterations)

| Operation | P50 (ms) | P95 (ms) | Avg (ms) |
|---|---:|---:|---:|
| Create Draft | 7249.85 | 7352.76 | 7181.21 |
| Submit Design | 2517.14 | 3740.51 | 2860.71 |
| Stores Verify | 2987.51 | 4125.75 | 3308.29 |
| Stores Issue | 3170.27 | 5808.99 | 3603.53 |
| Production Receive | 981.38 | 1008.73 | 985.36 |
| Production Complete | 977.74 | 1012.15 | 986.24 |
| Accounts Verify | 1009.62 | 1136.28 | 1020.86 |
| Actual Cost | 1230.72 | 4215.06 | 1848.40 |
| Financial Closure | 1013.41 | 1221.82 | 1078.73 |
| Archive | 1003.52 | 1438.27 | 1120.73 |

## Item-Level Issue Benchmark (5 iterations)

| Operation | P50 (ms) | P95 (ms) | Avg (ms) |
|---|---:|---:|---:|
| Create Draft (2 items) | 6758.40 | 7275.17 | 5880.53 |
| Submit Design | 2473.14 | 3655.13 | 2819.20 |
| Stores Verify | 3109.69 | 4237.27 | 3174.53 |
| Issue Single Item (partial) | 2054.89 | 2193.37 | 1905.45 |
| Issue Second Item (full completion) | 5139.60 | 6899.37 | 5476.67 |

## Before/After Comparison — Item-Level Issue

| Operation | Before P50 (ms) | After P50 (ms) | Improvement |
|---|---:|---:|---:|
| Issue Single Item (partial) | 2680.12 | 2054.89 | **23.3% faster** |
| Issue Second Item (full completion) | 6764.98 | 5139.60 | **24.0% faster** |
| Delta (full - partial) | 4084.86 | 3084.71 | **24.5% reduction in overhead** |

## Estimated DB Queries Saved

| Operation | Before (est.) | After (est.) | Saved |
|---|---:|---:|---:|
| Issue Single Item (partial) | ~6 | ~5 | 1 (findMany→count) |
| Issue Single Item (full completion) | ~14 | ~8 | 6 (context+items+dept+validation) |

## Key Improvement: Full Completion Path

The full completion path (issuing the last unissued item) previously delegated to `storesIssueMaterials()` which re-fetched:
1. `getTransactionContext()` — 1 DB query with nested relations
2. `indentItem.findMany` with material include — 1 DB query
3. `department.findFirst` — 1 DB query
4. State validation — redundant
5. Workflow history — handled by delegation
6. Notification/audit — handled by delegation

After optimization, the inline path uses:
1. `indentItem.count` (unissued) — 1 lightweight query
2. `department.findFirst` — 1 query
3. `assertCurrentStateAndUpdate` — 1 query (optimistic lock)
4. `workflowHistory.create` — 1 query
5. Notification/audit — same as before

Total reduction: ~6 DB queries per full completion event.
