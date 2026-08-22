# MERC PERFORMANCE LEVEL 4 BEFORE

Baseline metrics before Level 4 Write / Workflow Optimization:

- **Submit Indent P50:** ~10,648 ms
- **Submit Indent P95:** ~16,500 ms

## Root Causes of Write Latency
1. **Synchronous Cache Invalidations:** `await this.invalidateMetadataCache()` wrapped Upstash Redis `SCAN` operations that made multiple network round-trips over the internet, completely blocking the HTTP response.
2. **Redundant Relational Payload Fetches:** A massive `this.findTransactionForResponse(id)` Prisma query tree was executed at the very end of every mutation and sent back to the client. The React Query architecture on the frontend ignores this payload and invalidates the cache instead, making the 250+ ms fetch completely redundant.
3. **Sequential Lookups:** Master data lookups (e.g., `department.findFirst`) were performed sequentially after `getTransactionContext` and inside mapping loops (e.g. material item resolution), causing interactive transaction roundtrips to multiply the base DB latency.
