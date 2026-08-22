# MERC LEVEL 7D TRANSACTION MAP

## Transaction Width Classification

### `createTransaction`
- Reads: Product, Unit, Department, Process
- Writes: Indent, IndentItems, CostSheet, ProcessCosts
- Status: **SAFE BEFORE** (Master data reads can safely execute before transaction)

### `submitDesign`
- Reads: Context (Indent), Department
- Writes: Indent (Update), WorkflowHistory
- Status: **SAFE BEFORE** (Reads outside transaction, optimistic lock during update)

### `storesVerifyStock`
- Reads: Context, Department
- Writes: Indent (Update), WorkflowHistory
- Status: **SAFE BEFORE**

### `storesIssueMaterials`
- **Current Flow**:
  1. Read Context, Read ProductionDept (Outside Tx)
  2. BEGIN TX
  3. Read IndentItems (Inside Tx)
  4. Read Materials (Inside Tx)
  5. Validate Stock (Inside Tx)
  6. Update Materials (Inside Tx, decrement)
  7. Update IndentItems (Inside Tx)
  8. assertCurrentStateAndUpdate (Inside Tx)
  9. Create WorkflowHistory (Inside Tx)
  10. COMMIT
- **Analysis**: Since material stock updates use `{ decrement: issueQty }` and perform a `< 0` rollback check within the transaction, the preliminary READs of `IndentItems` and `Materials` can be safely moved OUTSIDE the transaction. The preliminary stock check will fail fast, and the transaction will atomically decrement and strictly enforce the non-negative constraint.
- **Classification**: **SAFE AFTER** (Reads can be moved to before the transaction).

### `productionReceiveMaterials` & `productionCompleteWork` & `accountsVerify` & `financialClosure` & `archiveTransaction`
- Reads: Context
- Writes: Indent, WorkflowHistory
- Status: **SAFE BEFORE** (Standard optimistic locking pattern already applied)

### `enterActualCosts`
- **Current Flow**:
  1. Read Context (Outside Tx)
  2. BEGIN TX
  3. Read CostItems (Inside Tx)
  4. Read ProcessCosts (Inside Tx)
  5. Update CostItems (Inside Tx)
  6. Update ProcessCosts (Inside Tx)
  7. Update CostSheet (Inside Tx)
  8. Update Indent (Inside Tx)
  9. Create WorkflowHistory (Inside Tx)
  10. COMMIT
- **Analysis**: Updating cost records requires computing variances. `actualTotal` is computed inside the transaction based on the input DTO (not DB reads). The only DB reads inside the transaction are to get the current CostItems and ProcessCosts to update them. If we read them outside, we can prepare the `update` payloads and run them atomically inside.
- **Classification**: **SAFE AFTER** (CostItem and ProcessCost reads can be moved before transaction).

## Action Plan
1. Refactor `storesIssueMaterials` to fetch `itemsToIssue` and `materials` outside `$transaction`.
2. Refactor `enterActualCosts` to fetch `costItems` and `processCosts` outside `$transaction`.
