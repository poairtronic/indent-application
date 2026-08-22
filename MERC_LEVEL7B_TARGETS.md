# MERC LEVEL 7B TARGETS — VERIFIED REDUNDANT CALL ELIMINATION

Generated: 2026-08-22T08:00:00Z
Source: Level 6 Query Inventory + Code Forensic Analysis

## 1. Verified Redundancies Identified

### REDUNDANCY #1: issueSingleMaterialItem() — Full Item Fetch After Transaction

| Field | Value |
|---|---|
| Remote call | `prisma.indentItem.findMany({ where: { indentId } })` |
| File/function | `business-transaction.service.ts:1341-1345` |
| Why redundant | After the transaction updates the item to ISSUED, all items are fetched again just to check if all are issued. A simple COUNT query suffices. |
| Evidence from 7A | Level 6 Query Inventory shows `IndentItem.findMany` at ~0.05ms DB but includes full relation data (materialId, unitId, quantity, status, remarks, material). Only `status` is needed. |
| What consumes result | Boolean check: `allItems.every(i => i.status === 'ISSUED')` |
| Why removal is safe | A `COUNT` query with `status != 'ISSUED'` produces the identical boolean result with fewer bytes transferred and fewer fields read. |
| Expected remote-call reduction | 1 DB query replaced with 1 lighter DB query (same count, less data) |
| Business risk | NONE — identical boolean result |
| Test required | Issue single item when it's the last unissued item → should trigger MATERIALS_ISSUED transition |

### REDUNDANCY #2: issueSingleMaterialItem() → storesIssueMaterials() Nested Delegation

| Field | Value |
|---|---|
| Remote call | `this.storesIssueMaterials(id, userId, dto)` called from `issueSingleMaterialItem()` |
| File/function | `business-transaction.service.ts:1353-1356` |
| Why redundant | `storesIssueMaterials()` re-does: `getTransactionContext()` (1 DB query), `department.findFirst()` (1 DB query), `indentItem.findMany` with material include (1 DB query), validates transition, creates workflow history, dispatches notification, logs audit — ALL of which were already done or can be done with single-statements. |
| Evidence from 7A | Level 6 Query Inventory shows `storesIssueMaterials` uses ~10+ queries per item. When called from `issueSingleMaterialItem`, the context and item state are already known. |
| What consumes result | The return value `{ id, success: true }` — frontend reads nothing from it |
| Why removal is safe | Inline the transition: (a) 1 department lookup, (b) 1 optimistic-lock updateMany, (c) 1 workflowHistory.create. Same atomic state change, same audit, same notification. No duplicate queries. |
| Expected remote-call reduction | ~5-7 redundant DB queries removed per single-item issue that completes all items |
| Business risk | LOW — must preserve identical optimistic locking, workflow history, notification, audit |
| Test required | Full test matrix (see Section 21 of spec) |

### REDUNDANCY #3: storesIssueMaterials() — Redundant Material findUnique Per Item

| Field | Value |
|---|---|
| Remote call | `prisma.material.findUnique({ where: { id: item.materialId } })` inside the item loop |
| File/function | `business-transaction.service.ts:1179-1181` |
| Why redundant | The `indentItem.findMany` on line 1147-1150 uses `include: { material: true }` which already loads the material. However, the include only selects default fields (not `currentStock`). The `findUnique` is needed for `currentStock`. |
| Evidence from 7A | Level 6 shows Material findUnique at ~0.02ms DB |
| What consumes result | `material.currentStock` for stock validation |
| Why removal is **NOT safe** | The material include does not load `currentStock`. The findUnique IS required for stock validation. DO NOT REMOVE. |
| Expected remote-call reduction | 0 — this is NOT redundant |
| Business risk | HIGH if removed — would skip stock validation |
| Test required | N/A — keeping this call |

## 2. Summary of Changes to Implement

| # | Change | DB Queries Saved | Risk |
|---|---|---|---|
| 1 | Replace `indentItem.findMany` with `indentItem.count` in `issueSingleMaterialItem` | 1 query (lighter) | NONE |
| 2 | Inline final transition in `issueSingleMaterialItem` instead of calling `storesIssueMaterials` | ~5-7 queries | LOW |
| **TOTAL** | | **~6-8 queries per item-level full completion** | |

## 3. What is NOT Being Changed

- No business logic changes
- No financial calculation changes
- No workflow state machine changes
- No database schema changes
- No caching strategy changes
- No notification semantics changes
- No audit record changes
- No RBAC changes
- No tenant isolation changes
- `storesIssueMaterials()` remains unchanged (still used by its own controller endpoint)
- All other workflow transitions remain unchanged
