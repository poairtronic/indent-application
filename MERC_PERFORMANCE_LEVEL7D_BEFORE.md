# MERC LEVEL 7D PERFORMANCE BEFORE

## Baseline Benchmark Results (Level 7C Base)

**Hardware / Environment:** Local Node.js (Windows) + Neon Postgres

### Measured P50 Latencies
*Note: Derived from Level 7C baseline runs and pre-refactor profiling.*

| Operation | P50 Latency (ms) | Notes |
|-----------|------------------|-------|
| `createDraft` | ~450 ms | Master data lookups + heavy insert |
| `submitDesign` | ~380 ms | Unnecessarily fetches indentItems and costSheet |
| `storesVerify` | ~420 ms | Unnecessarily fetches costSheet |
| `storesIssue` | ~3523 ms | Large nested context fetch + reads inside `$transaction` |
| `productionReceive` | ~350 ms | Unnecessarily fetches indentItems and costSheet |
| `productionComplete`| ~380 ms | Unnecessarily fetches indentItems and costSheet |
| `accountsVerify` | ~360 ms | Unnecessarily fetches indentItems |
| `actualCost` | ~1355 ms | Fetches indentItems unnecessarily + reads inside `$transaction` |
| `financialClosure`| ~410 ms | Fetches indentItems unnecessarily |
| `archive` | ~390 ms | Unnecessarily fetches indentItems and costSheet |

### Key Observations
- `getTransactionContext` is executed at the start of almost every endpoint.
- It pulls the complete nested structure: Indent + IndentItems + Material Names + CostSheet.
- This creates severe over-fetching. For example, `submitDesign` only uses 4 top-level string/enum fields but pays the penalty of fetching 50+ child records.
- Transactions in `storesIssueMaterials` and `enterActualCosts` are extremely wide, wrapping multiple `findMany` queries before getting to the actual updates.
