# MERC PERFORMANCE LEVEL 4 AFTER

Metrics after Level 4 Write / Workflow Optimization:

- **Submit Indent P50:** ~3,173 ms (Down from 10.6s, a ~70% reduction!)
- **Submit Indent P95:** ~5,425 ms (Down from 16.5s, a ~67% reduction!)
- **Warm Average**: ~2,100 ms

## Improvements Made
1. **Fire-and-Forget Cache Busting**: Removed `await` from Redis invalidation routines (`invalidateMetadataCache`, `invalidateWorkflowCache`, etc.) to clear up the HTTP response path and execute background invalidations synchronously using `.catch`.
2. **Minimal Payload Returns**: Replaced massive `findTransactionForResponse(id)` round-trips with `{ id, success: true }`. The React Query invalidation loop naturally handles fetching the new state on the frontend, saving a redundant deep relational query at the end of every mutation.
3. **Parallel Sequential Reads**: Grouped `getTransactionContext` and independent master data lookups (`department.findFirst`) via `Promise.all` across critical mutation endpoints (`submitDesign`, `storesIssueMaterials`).
4. **Concurrent Material Resolution**: Replaced sequential Prisma reads in `createTransaction` loops mapping `Promise.all` execution for `resolveMaterial`, massively dropping latency for indents with multiple materials.
