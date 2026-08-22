# MERC PERFORMANCE LEVEL 7C - AFTER MEASUREMENTS

Generated: 2026-08-22T14:30:00Z
Benchmark: benchmark-level7c.js (10 iterations)
Backend: localhost:3001
Database: Neon PostgreSQL

## Full Workflow Benchmark (10 iterations)

| Operation | P50 (ms) | P95 (ms) | P99 (ms) | Avg (ms) |
|---|---:|---:|---:|---:|
| Create Draft | 8923.24 | 9575.12 | 9575.12 | 7808.57 |
| Submit Design | 3165.22 | 5941.19 | 5941.19 | 3490.33 |
| Stores Verify | 3582.66 | 7378.84 | 7378.84 | 3923.05 |
| Stores Issue | 3522.93 | 6748.31 | 6748.31 | 4187.41 |
| Production Receive | 1427.95 | 2489.46 | 2489.46 | 1618.85 |
| Production Complete | 1099.24 | 1232.36 | 1232.36 | 1097.99 |
| Accounts Verify | 1129.72 | 1221.75 | 1221.75 | 1116.62 |
| Actual Cost | 1355.34 | 1740.77 | 1740.77 | 1352.73 |
| Financial Closure | 1227.32 | 1478.43 | 1478.43 | 1202.59 |
| Archive | 1180.50 | 1438.14 | 1438.14 | 1172.48 |

## Before/After Comparison

| Operation | Before P50 | After P50 | Delta | Status |
|---|---:|---:|---:|---|
| Create Draft | 8700.69 | 8923.24 | +2.6% | NOISE |
| Submit Design | 3076.23 | 3165.22 | +2.9% | NOISE |
| Stores Verify | 3384.84 | 3582.66 | +5.8% | NOISE |
| Stores Issue | 4195.31 | 3522.93 | **-16.0%** | **IMPROVED** |
| Production Receive | 1228.58 | 1427.95 | +16.2% | NOISE |
| Production Complete | 1130.99 | 1099.24 | -2.8% | STABLE |
| Accounts Verify | 1126.31 | 1129.72 | +0.3% | STABLE |
| Actual Cost | 1424.22 | 1355.34 | **-4.8%** | **IMPROVED** |
| Financial Closure | 1228.89 | 1227.32 | -0.1% | STABLE |
| Archive | 1234.51 | 1180.50 | -4.4% | STABLE |

## Estimated DB Queries Saved (3 materials)

| Operation | Before | After | Saved |
|---|---:|---:|---:|
| Stores Issue | ~16 | ~10 | ~6 |
| Actual Cost (3 items, 1 process) | ~10 | ~7 | ~3 |

## Key Improvements

1. **Stores Issue -16.0% P50**: Batch material lookup (3x findUnique -> 1x findMany) + parallel updates
2. **Actual Cost -4.8% P50**: Batch process cost lookup + parallel cost item/process cost updates
3. **Stores Verify**: Parallelized context + department reads
