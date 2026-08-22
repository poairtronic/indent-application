# MERC PERFORMANCE LEVEL 6 BEFORE

Baseline metrics before Level 6 PostgreSQL Optimization.
This represents the performance after Level 5 optimizations (Transaction parallelization & loop removal).

## Measurement Methodology
- Full workflow transitions executed iteratively.
- Measurements capture time from request dispatch to response completion.
- Network latency overhead + PostgreSQL remote query overhead included.

## Benchmark Results (Level 5 Baseline)

| Operation | P50 (ms) | P95 (ms) | Average (ms) |
|---|---:|---:|---:|
| **Create Draft** | ~750 | ~1,200 | ~800 |
| **Submit Indent** | ~1,450 | ~2,100 | ~1,600 |
| **Stores Verify** | ~1,100 | ~1,800 | ~1,300 |
| **Stores Issue** | ~1,250 | ~2,000 | ~1,400 |
| **Production Receive** | ~850 | ~1,200 | ~950 |
| **Production Complete** | ~900 | ~1,400 | ~1,050 |
| **Accounts Verify** | ~800 | ~1,300 | ~900 |
| **Actual Cost** | ~1,100 | ~1,900 | ~1,300 |
| **Financial Closure** | ~850 | ~1,400 | ~950 |
| **Archive** | ~750 | ~1,100 | ~800 |

## Goal for Level 6
Optimize PostgreSQL query plans, add missing composite indexes for lists/queries, tighten Prisma interactive transaction scopes (where safe), and eliminate expensive Redis `SCAN` operations that needlessly block backend threads.
