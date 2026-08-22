# MERC PERFORMANCE LEVEL 5 AFTER

Metrics after Level 5 Write / Workflow Optimization:

## Benchmark Results (5 Iterations)

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

## Improvements Made
1. **Parallel Pre-Transaction Lookups**: Aggregated independent \`getTransactionContext\`, \`user.findUnique\`, and \`department.findFirst\` queries into concurrent \`Promise.all\` structures across \`updateDraftTransaction\` and attachment operations.
2. **Concurrent Loop Operations (Stores Issue)**: 
   - Converted sequential N-item \`material.findUnique\` lookups into a single batch \`material.findMany\` IN query.
   - Converted sequential N-item \`inventoryLogs.push()\` inserts into a single batch \`inventoryLog.createMany\` operation.
   - Converted sequential N-item \`material.update\` stock decrements into a concurrent \`Promise.all\` execution block inside the transaction.
3. **Concurrent Loop Operations (Actual Costs)**:
   - Migrated sequential iteration over \`dto.costItems\` and \`dto.processCosts\` into concurrent \`Promise.all\` mutation arrays, severely dropping interactive transaction lifespan.
4. **Enforced Missing Atomicity**:
   - Wrapped \`productionCompleteWork\` operations in a full \`$transaction\` block, securing workflow state increments natively.
