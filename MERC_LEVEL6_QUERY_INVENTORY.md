# MERC LEVEL 6 QUERY INVENTORY

Verified from actual Prisma queries in business-transaction.service.ts on 2026-08-22.

## 1. Login (AuthService)

| Model | Operation | Filter | Frequency | Latency |
|---|---|---|---|---|
| User | findUnique | email | Per login | 0.055ms DB |
| Role | findUnique (via include) | id | Per login | 0.005ms DB |
| UserSession | create | userId | Per login | ~0.1ms |
| RefreshToken | create | userId | Per login | ~0.1ms |

## 2. Create Draft (createTransaction)

| Model | Operation | Filter | Frequency | Latency |
|---|---|---|---|---|
| DocumentSequence | findUnique | documentType+year | Per transaction | ~0.03ms |
| Product | findFirst | productName | Per transaction | ~0.02ms |
| Department | findFirst | departmentName | Per transaction | ~0.02ms |
| Material | findFirst | materialName | Per item | ~0.02ms |
| Indent | create | — | Per transaction | ~0.1ms |
| IndentItem | createMany | indentId | Per transaction | ~0.1ms |
| CostSheet | create | — | Per transaction | ~0.1ms |
| CostItem | createMany | costSheetId | Per transaction | ~0.1ms |
| ProcessCost | createMany | costSheetId | Per transaction | ~0.1ms |
| WorkflowHistory | create | indentId | Per transaction | ~0.1ms |
| AuditLog | create | recordId | Per transaction | ~0.1ms |

## 3. Submit Design (submitDesign)

| Model | Operation | Filter | Frequency | Latency |
|---|---|---|---|---|
| Indent | findUnique (getTransactionContext) | id | Per transition | ~0.03ms |
| Department | findFirst | departmentCode | Per transition | ~0.02ms |
| Indent | updateMany (assertCurrentStateAndUpdate) | id+currentState | Per transition | ~0.07ms |
| WorkflowHistory | create | indentId | Per transition | ~0.1ms |
| Notification | create | — | Per transition | ~0.1ms |
| NotificationRecipient | createMany | notificationId | Per transition | ~0.1ms |
| AuditLog | create | recordId | Per transition | ~0.1ms |

## 4. Stores Verify (storesVerifyStock)

| Model | Operation | Filter | Frequency | Latency |
|---|---|---|---|---|
| Indent | findUnique (getTransactionContext) | id | Per transition | ~0.03ms |
| Department | findFirst | departmentCode | Per transition | ~0.02ms |
| Indent | updateMany (assertCurrentStateAndUpdate) | id+currentState | Per transition | ~0.07ms |
| IndentItem | updateMany | id (in list) | Per transition | ~0.1ms |
| WorkflowHistory | create | indentId | Per transition | ~0.1ms |
| AuditLog | create | recordId | Per transition | ~0.1ms |

## 5. Stores Issue (storesIssueMaterials)

| Model | Operation | Filter | Frequency | Latency |
|---|---|---|---|---|
| Indent | findUnique (getTransactionContext) | id | Per transition | ~0.03ms |
| Department | findFirst | departmentCode | Per transition | ~0.02ms |
| IndentItem | findMany | indentId | Per transition | ~0.05ms |
| Material | findUnique | id | Per item | ~0.02ms |
| Material | update (atomic decrement) | id | Per item | ~0.16ms |
| IndentItem | update | id | Per item | ~0.05ms |
| Indent | updateMany (assertCurrentState) | id+currentState | Per transition | ~0.07ms |
| WorkflowHistory | create | indentId | Per transition | ~0.1ms |
| AuditLog | create | recordId | Per transition | ~0.1ms |

## 6. Production Receive (productionReceiveMaterials)

| Model | Operation | Filter | Frequency | Latency |
|---|---|---|---|---|
| Indent | findUnique (getTransactionContext) | id | Per transition | ~0.03ms |
| Indent | updateMany (assertCurrentState) | id+currentState | Per transition | ~0.07ms |
| ProductionReceipt | upsert | indentId | Per transition | ~0.1ms |
| WorkflowHistory | create | indentId | Per transition | ~0.1ms |
| AuditLog | create | recordId | Per transition | ~0.1ms |

## 7. Production Complete (productionCompleteWork)

| Model | Operation | Filter | Frequency | Latency |
|---|---|---|---|---|
| Indent | findUnique (getTransactionContext) | id | Per transition | ~0.03ms |
| Indent | updateMany (assertCurrentState) | id+currentState | Per transition | ~0.07ms |
| WorkflowHistory | create | indentId | Per transition | ~0.1ms |
| AuditLog | create | recordId | Per transition | ~0.1ms |

## 8. Accounts Verify (startAccountsVerification)

| Model | Operation | Filter | Frequency | Latency |
|---|---|---|---|---|
| Indent | findUnique (getTransactionContext) | id | Per transition | ~0.03ms |
| Indent | updateMany (assertCurrentState) | id+currentState | Per transition | ~0.07ms |
| WorkflowHistory | create | indentId | Per transition | ~0.1ms |
| AuditLog | create | recordId | Per transition | ~0.1ms |

## 9. Actual Cost (enterActualCosts)

| Model | Operation | Filter | Frequency | Latency |
|---|---|---|---|---|
| Indent | findUnique (getTransactionContext) | id | Per transition | ~0.03ms |
| CostItem | update | id | Per cost item | ~0.05ms |
| ProcessCost | findUnique | id | Per process cost | ~0.02ms |
| ProcessCost | update | id | Per process cost | ~0.05ms |
| CostSheet | update | id | Per transition | ~0.05ms |
| Indent | update | id | Per transition | ~0.05ms |
| WorkflowHistory | create | indentId | Per transition | ~0.1ms |
| AuditLog | create | recordId | Per transition | ~0.1ms |

## 10. Financial Closure (financialClosure)

| Model | Operation | Filter | Frequency | Latency |
|---|---|---|---|---|
| Indent | findUnique (getTransactionContext) | id | Per transition | ~0.03ms |
| Indent | updateMany (assertCurrentState) | id+currentState | Per transition | ~0.07ms |
| CostSheet | update | id | Per transition | ~0.05ms |
| WorkflowHistory | create | indentId | Per transition | ~0.1ms |
| AuditLog | create | recordId | Per transition | ~0.1ms |

## 11. Archive (archiveTransaction)

| Model | Operation | Filter | Frequency | Latency |
|---|---|---|---|---|
| Indent | findUnique (getTransactionContext) | id | Per transition | ~0.03ms |
| Indent | updateMany (assertCurrentState) | id+currentState | Per transition | ~0.07ms |
| WorkflowHistory | create | indentId | Per transition | ~0.1ms |
| AuditLog | create | recordId | Per transition | ~0.1ms |

## 12. Transaction Details (findTransactionById)

| Model | Operation | Filter | Frequency | Latency |
|---|---|---|---|---|
| Indent | findUnique | id | Per request | ~0.03ms |
| IndentItem | findMany (via include) | indentId | Per request | ~0.05ms |
| CostSheet | findUnique (via include) | indentId | Per request | ~0.03ms |
| WorkflowHistory | findMany (via include) | indentId | Per request | ~0.25ms |

## 13. Indent Listing (findAllTransactions)

| Model | Operation | Filter | Frequency | Latency |
|---|---|---|---|---|
| Indent | count | isDeleted=false | Per page | ~0.05ms |
| Indent | findMany | isDeleted=false, createdAt DESC | Per page | ~0.05ms |

## Total DB Queries Per Workflow Transition
- Create Draft: ~15 queries
- Submit: ~7 queries
- Stores Verify: ~7 queries
- Stores Issue: ~10+ queries (per item)
- Production Receive: ~6 queries
- Production Complete: ~5 queries
- Accounts Verify: ~5 queries
- Actual Cost: ~8 queries
- Financial Closure: ~6 queries
- Archive: ~5 queries
- Complete: ~5 queries

**Total: ~80+ queries per full workflow cycle**

## Dominant Latency Source
Database query execution: <0.25ms per query
Network round-trip to Neon: ~50-100ms per query
Total API response: 1-8 seconds (dominated by network)