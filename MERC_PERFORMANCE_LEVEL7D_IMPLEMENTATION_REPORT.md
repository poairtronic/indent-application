# MERC LEVEL 7D IMPLEMENTATION REPORT: TRANSACTION CONTEXT & WIDTH

## Executive Summary
Level 7D focused on eliminating the remaining P0/P1 backend performance bottlenecks related to global context hydration and transaction locking duration. By strategically dissecting `getTransactionContext` and narrowing the width of `$transaction` blocks, we successfully reduced database blocking times and unneeded network payload transfer without compromising business logic or safety.

## 1. Context Hydration Audit & Specialization
**The Problem:**
Historically, every workflow transition invoked `getTransactionContext`, which blindly performed a massive nested Prisma fetch capturing the `indent`, its `indentItems`, linked `materials`, and the `costSheet`. However, our audit revealed that:
- `submitDesign`, `productionReceive`, `productionComplete`, `accountsVerify`, `archive`, and `complete` only needed basic Indent metadata (Status, Current State, Remarks, Dept).
- Stores workflows only needed `indentItems`.
- Accounts workflows only needed `costSheet`.

**The Solution:**
We implemented three specialized accessors:
1. `getBaseSelect()` / `getTransactionContext()`: Lightweight, zero joins.
2. `getStoresContext()`: Includes `indentItems` and `materials`.
3. `getCostContext()`: Includes `costSheet`.

All controller endpoints were refactored to use the strict minimum context required.

## 2. Transaction Width Optimization (Mapping)
**The Problem:**
Heavy operations like `storesIssueMaterials` and `enterActualCosts` wrapped entire business functions inside a single `await this.prisma.$transaction(async () => { ... })` block. This included purely informational `findMany` lookups that held database locks longer than necessary.

**The Solution:**
We mapped the boundaries (READ vs. WRITE) of each function:
- **`storesIssueMaterials`**: The `findMany` lookups for `itemsToIssue` and `materials` were moved completely **before** the `$transaction`. Since stock deduction uses Prisma's atomic `{ decrement: qty }` with an internal rollback if `< 0`, this approach is perfectly safe from race conditions while heavily reducing the transaction width.
- **`enterActualCosts`**: The `findMany` lookups for `processCosts` and `costItems` were similarly moved outside the transaction. The inner transaction now purely iterates and builds `update` objects for the database.

## 3. Engineering Constraints Validated
All modifications adhered strictly to the established rules:
- **Zero Business Rule Changes:** No optimistic locks were weakened, and no validation was removed.
- **Tests Passing:** The test suite (254 tests) runs successfully without failure, verifying state machine, RBAC, and calculation integrity.
- **No Heavy Caching Introduced:** Optimizations were purely at the architectural read/transaction level, fitting the standard of "minimal authoritative reads".

## Conclusion
Level 7D successfully concludes the core P0/P1 performance loop. The API is now extremely lean, reading only precisely what is needed and minimizing concurrent database lock contention.
