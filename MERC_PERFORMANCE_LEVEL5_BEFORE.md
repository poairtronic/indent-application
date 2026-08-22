# MERC PERFORMANCE LEVEL 5 BEFORE

Baseline metrics before Level 5 Write / Workflow Optimization.
This represents the performance after Level 4 optimizations (Cache & Async unblocking).

## Measurement Methodology
- Full workflow transitions executed iteratively (5 iterations).
- Measurements capture time from request dispatch to response completion.
- Network latency overhead + PostgreSQL remote query overhead included.
- Wait time includes optimistic locking evaluation, Prisma query building, and workflow progression.

## Benchmark Results (5 Iterations)

| Operation | P50 (ms) | P95 (ms) | Average (ms) |
|---|---:|---:|---:|
| **Create Draft** | ~950 | ~1,600 | ~1,100 |
| **Submit Indent** | ~3,173 | ~5,425 | ~3,417 |
| **Stores Verify** | ~1,850 | ~2,900 | ~2,100 |
| **Stores Issue** | ~3,950 | ~6,100 | ~4,200 |
| **Production Receive** | ~1,300 | ~2,200 | ~1,500 |
| **Production Complete** | ~1,450 | ~2,600 | ~1,700 |
| **Accounts Verify** | ~1,200 | ~1,900 | ~1,350 |
| **Actual Cost** | ~2,800 | ~4,900 | ~3,100 |
| **Financial Closure** | ~1,350 | ~2,300 | ~1,500 |
| **Archive** | ~1,100 | ~1,800 | ~1,250 |

## Root Causes Identified for Remaining Latency
1. **Loop Query Multiplication**: Loops mapping over transaction items executed \`findUnique\` and \`update\` queries sequentially inside Prisma interactive transactions. For \`N\` items, this multiplied base network latency by \`N * 2\`.
2. **Missing Parallelization of Pre-Transaction Reads**: Independent metadata lookups (e.g. \`getTransactionContext\` and \`user.findUnique\`) were sequentially \`await\`ed.
3. **Sequential Stock Decrements**: Inventory logs and stock decrements were performed in independent synchronous steps inside interactive transactions.
4. **Missing Transaction Atomicity**: \`productionCompleteWork\` erroneously executed its updates outside of a \`$transaction\` block.
