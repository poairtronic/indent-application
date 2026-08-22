# MERC LEVEL 5 WRITE QUERY MAP

This document maps all Prisma interactions during critical workflow mutations to identify and optimize latency bottlenecks.

## Submit Indent (DESIGN -> DESIGN_COMPLETED -> STORES_PROCESSING)
1. **getTransactionContext** (READ)
   - Status: Mapped to concurrent \`Promise.all\`
   - Classification: CAN be executed in parallel
2. **Department Lookup (STORES)** (READ)
   - Status: Mapped to concurrent \`Promise.all\`
   - Classification: CAN be executed in parallel
3. **Workflow Validation** (COMPUTATION)
4. **Prisma Transaction BEGIN**
5. **Indent State Update (Optimistic Lock)** (WRITE)
   - Status: \`updateMany\` with \`currentState\`
   - Classification: MUST remain inside transaction
6. **Workflow History Create** (WRITE)
   - Status: Sequential after update
   - Classification: MUST remain inside transaction
7. **Prisma Transaction COMMIT**

## Stores Issue Materials (STORES_PROCESSING -> MATERIALS_ISSUED)
1. **getTransactionContext** (READ)
   - Status: Mapped to concurrent \`Promise.all\`
   - Classification: CAN be executed in parallel
2. **Department Lookup (PRODUCTION)** (READ)
   - Status: Mapped to concurrent \`Promise.all\`
   - Classification: CAN be executed in parallel
3. **Prisma Transaction BEGIN**
4. **Materials Loop (N Items)** (READ) -> *OPTIMIZED*
   - Status: Eliminated the \`for\` loop read. Replaced with single batch lookup \`findMany({ where: { id: { in: [] } } })\` before the transaction.
   - Classification: CAN be combined & executed before transaction.
5. **Inventory Logs Create** (WRITE) -> *OPTIMIZED*
   - Status: Migrated from N \`push()\` operations inside the transaction to a single \`createMany\` array insert.
   - Classification: CAN be combined.
6. **Stock Decrement (N Items)** (WRITE) -> *OPTIMIZED*
   - Status: \`update\` on different material IDs run concurrently via \`Promise.all\` inside the transaction.
   - Classification: MUST remain inside transaction, but CAN be parallelized.
7. **Indent State Update (Optimistic Lock)** (WRITE)
   - Status: \`updateMany\`
   - Classification: MUST remain inside transaction
8. **Workflow History Create** (WRITE)
9. **Prisma Transaction COMMIT**

## Production Complete (PRODUCTION_PROCESSING -> PRODUCTION_COMPLETED)
1. **getTransactionContext** (READ)
   - Classification: CAN be executed before transaction.
2. **Prisma Transaction BEGIN** -> *OPTIMIZED*
   - Status: Added transaction wrapper (previously missing!).
   - Classification: MUST remain inside transaction for atomicity.
3. **Indent State Update (Optimistic Lock)** (WRITE)
   - Classification: MUST remain inside transaction
4. **Workflow History Create** (WRITE)
   - Classification: MUST remain inside transaction
5. **Prisma Transaction COMMIT**

## Enter Actual Costs (ACCOUNTS_COST_VERIFICATION -> ACTUAL_COST_UPDATED)
1. **getTransactionContext** (READ)
2. **Prisma Transaction BEGIN**
3. **Cost Items Updates (N Items)** (WRITE) -> *OPTIMIZED*
   - Status: Migrated from sequential \`for\` loop to \`Promise.all\` concurrency.
   - Classification: CAN be executed in parallel.
4. **Process Costs Updates (M Items)** (WRITE) -> *OPTIMIZED*
   - Status: Migrated from sequential \`for\` loop to \`Promise.all\` concurrency.
   - Classification: CAN be executed in parallel.
5. **Cost Sheet Update** (WRITE)
   - Status: Wait for costs to finish, update actual total fields.
   - Classification: MUST remain inside transaction.
6. **Indent State Update (Optimistic Lock)** (WRITE)
7. **Workflow History Create** (WRITE)
8. **Prisma Transaction COMMIT**

## Financial Closure (ACTUAL_COST_UPDATED -> ACCOUNTS_FINANCIAL_CLOSURE)
1. **getTransactionContext** (READ)
2. **Prisma Transaction BEGIN**
3. **Indent State Update (Optimistic Lock)** (WRITE)
4. **Cost Sheet Finalize** (WRITE)
5. **Workflow History Create** (WRITE)
6. **Prisma Transaction COMMIT**

## Archive Transaction (ACCOUNTS_FINANCIAL_CLOSURE -> ARCHIVED)
1. **getTransactionContext** (READ)
2. **Prisma Transaction BEGIN**
3. **Indent State Update (Lock Record)** (WRITE)
4. **Workflow History Create** (WRITE)
5. **Prisma Transaction COMMIT**
