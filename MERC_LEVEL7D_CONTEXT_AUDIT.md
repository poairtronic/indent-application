# MERC LEVEL 7D CONTEXT AUDIT

## Context Audit of `getTransactionContext(id)`

### Returned Fields
- `id`: Indent ID
- `indentNumber`: Indent Number (String)
- `customerName`: String
- `layoutNumber`: String
- `departmentId`: String (Department relation ID)
- `priority`: Enum (NORMAL, URGENT, etc)
- `currentState`: Domain Workflow State
- `currentLoop`: Domain Workflow Loop (MANUFACTURING/FINANCIAL)
- `requiredDate`: DateTime
- `requiredDeliveryDate`: DateTime
- `purpose`: String
- `remarks`: String
- `createdAt`: DateTime
- `updatedAt`: DateTime
- `items`: Array of indentItems including Material name
- `costSheet`: CostSheet object with actual costs and predicted total

### Consumers of Context Data

| Field | Used By | Can Remove from Global? | Notes |
|-------|---------|-------------------------|-------|
| `currentState` | All state machine validations | No | Crucial for Optimistic Locking & Validation |
| `remarks` | All transitions appending remarks | No | Appended upon status change |
| `departmentId` | `submitDesign` (fallback ownership) | No | Required for notifications/ownership checks |
| `indentNumber` | Notification triggers in most transitions | No | Required for notifications & logging |
| `items` (indentItems) | `storesVerifyStock`, `issueSingleMaterialItem` | **Yes** | 90% of endpoints don't need items! Specifically, `submitDesign`, `productionReceive`, `productionComplete`, `accountsVerify`, `archive` have zero use for items. |
| `costSheet` | `enterActualCosts`, `financialClosure`, `addAttachmentToIndent` | **Yes** | Manufacturing loop transitions (Stores, Production) and Archiving do not touch the `costSheet`. |

## Optimization Opportunity

Currently `getTransactionContext` runs:
```javascript
select: {
  id: true, indentNumber: true, customerName: true, layoutNumber: true, departmentId: true, priority: true, status: true, currentState: true, requiredDate: true, requiredDeliveryDate: true, purpose: true, remarks: true, createdAt: true, updatedAt: true,
  indentItems: { ...nested... },
  costSheet: { ...nested... }
}
```
This query fetches potentially dozens of nested items and a cost sheet, which represents unnecessary sequential scanning + network payload overhead for workflow states that just need to transition from `DESIGN_COMPLETED` to `STORES_PROCESSING`.

### Proposed Specialization

We should specialize context methods:
1. `getBaseTransactionContext()`: Fetches purely the Indent fields (no nested `indentItems` or `costSheet`). Used by 80% of workflow transition operations.
2. `getStoresContext()`: Fetches Base + `indentItems`.
3. `getCostContext()`: Fetches Base + `costSheet`.

### Secondary Bottleneck: `storesIssueMaterials`
`storesIssueMaterials` currently calls `getTransactionContext(id)`, ignores `txData.items`, and then executes:
`await prisma.indentItem.findMany(...)` inside the transaction!
This means `indentItems` are fetched **twice** for bulk stores issue.
By using `getBaseTransactionContext()` here, we immediately eliminate the duplicate heavy read.
