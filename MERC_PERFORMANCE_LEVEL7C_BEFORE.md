# MERC PERFORMANCE LEVEL 7C - BEFORE MEASUREMENTS

Generated: 2026-08-22T15:00:00Z
Benchmark: benchmark-level7c.js (10 iterations)
Backend: localhost:3001
Database: Neon PostgreSQL

## Full Workflow Benchmark (10 iterations)

| Operation | P50 (ms) | P95 (ms) | P99 (ms) | Avg (ms) |
|---|---:|---:|---:|---:|
| Create Draft | 8700.69 | 9587.56 | 9587.56 | 7570.16 |
| Submit Design | 3076.23 | 6147.06 | 6147.06 | 3689.14 |
| Stores Verify | 3384.84 | 5273.50 | 5273.50 | 3480.40 |
| Stores Issue | 4195.31 | 6506.06 | 6506.06 | 4404.09 |
| Production Receive | 1228.58 | 1237.35 | 1237.35 | 1151.31 |
| Production Complete | 1130.99 | 2453.53 | 2453.53 | 1370.49 |
| Accounts Verify | 1126.31 | 1233.40 | 1233.40 | 1146.54 |
| Actual Cost | 1424.22 | 2248.23 | 2248.23 | 1424.49 |
| Financial Closure | 1228.89 | 1563.65 | 1563.65 | 1235.70 |
| Archive | 1234.51 | 4707.07 | 4707.07 | 1598.76 |

## Estimated DB Queries Per Operation (Before 7C)

| Operation | Estimated DB Queries |
|---|---:|
| Create Draft | ~15 |
| Submit Design | ~7 |
| Stores Verify | ~7 |
| Stores Issue (3 items) | ~16 (1 context + 1 dept + 1 findMany + 3x findUnique + 3x update + 3x update + 1 updateMany + 1 create) |
| Production Receive | ~6 |
| Production Complete | ~5 |
| Accounts Verify | ~5 |
| Actual Cost (3 items, 1 process) | ~10 (1 context + 3x findUnique + 3x update + 1x findUnique + 1x update + 1 update) |
| Financial Closure | ~6 |
| Archive | ~5 |

## Key Targets for 7C

1. **Stores Issue**: Batch material lookups (3x findUnique -> 1x findMany)
2. **Stores Issue**: Batch indent item updates (3x update -> controlled Promise.all or batch)
3. **Actual Cost**: Batch cost item updates (3x update -> controlled batch)
4. **Actual Cost**: Batch process cost updates (1x findUnique + 1x update -> reuse predicted from context)
5. **Submit/Production/Accounts**: Parallelize independent reads
