# MERC — P8 API Payload & Response Size Optimization
**Phase:** P8 — API Payload & Response Size Optimization  
**Status:** CERTIFIED  
**Date:** 2026-08-26

---

## Summary

P8 eliminated audit-trail fields from nested Prisma sub-entities in `findTransactionById`
and `findTransactionForResponse`. These fields (`isDeleted`, `deletedAt`, `createdBy`,
`updatedBy`, `deletedBy`) were fetched via `include:` and serialized to JSON but
are not used by any frontend component, workflow transition, costing formula, or
RBAC check on nested objects.

**Result: −735 bytes (−11.8%) on Transaction Detail. All required business fields verified present.**

---

## 1. Largest API Responses (Production)

| Endpoint | Uncompressed | Brotli Wire | Objects |
|---|---|---|---|
| /api/business-transactions?limit=20 | 9,789 bytes | 1,599 bytes | 20 |
| /api/business-transactions/:id | 5,488 bytes | 1,743 bytes | 1 + nested |
| /api/business-transactions/operational-summary | 1,009 bytes | 428 bytes | 1 |
| /api/analytics/workflow | 1,002 bytes | 444 bytes | aggregated |
| /api/reports/master-data/products | 2,763 bytes | 741 bytes | 10 |
| /api/reports/workflow/bottleneck | 203 bytes | 172 bytes | 1 |

---

## 2. Fields Removed (Proven Unused)

| Field | Objects Affected |
|---|---|
| isDeleted | IndentItem, IndentProcess, CostItem, ProcessCost, WorkflowHistory, IndentAttachment, ProductionReceipt |
| deletedAt | All nested objects |
| createdBy (null UUID on nested) | IndentItem, IndentProcess, CostItem, ProcessCost, WorkflowHistory |
| updatedBy | All nested objects |
| deletedBy | All nested objects |

Verification: zero usages of updatedBy/deletedBy in frontend/src/. isDeleted only in session test spec.

---

## 3. Before / After Comparison

| Metric | Before P8 | After P8 | Delta |
|---|---|---|---|
| Uncompressed (1-item transaction) | 6,223 bytes | 5,488 bytes | -735 bytes (-11.8%) |
| Brotli wire | ~1,860 bytes | 1,743 bytes | -117 bytes (-6.3%) |
| Fields per IndentItem | 22 | 17 | -5 |
| Fields per IndentProcess | 17 | 12 | -5 |
| Fields per CostItem | 17 | 12 | -5 |
| Fields per ProcessCost | 15 | 10 | -5 |
| Fields per WorkflowHistory | 18 | 13 | -5 |
| Fields per ProductionReceipt | 11 | 7 | -4 |

Estimated savings at realistic scale (10 items x 3 processes): ~18-25% reduction.

---

## 4. Compression Audit

Content-Encoding: br (Brotli) confirmed on production.

| Endpoint | Uncompressed | Brotli Wire | Savings |
|---|---|---|---|
| Transaction List (20) | 9,789 bytes | 1,599 bytes | 83.7% |
| Transaction Detail | 5,488 bytes | 1,743 bytes | 68.2% |
| Product Catalog (10) | 2,763 bytes | 741 bytes | 73.2% |

---

## 5. Response Equivalence

All 24 root fields present. All IndentItem, CostSheet, CostItem, ProcessCost,
WorkflowHistory fields verified present. No unexplained differences.

---

## 6. Cost Sheet Safety

predictedTotal, actualTotal, designCost, overheadCost, contingencyCost,
actualDesignCost, actualOverheadCost, actualContingencyCost, varianceAmount,
variancePercentage, status, costItems (all fields), processCosts (all fields): ALL PRESENT.

---

## 7. Workflow Safety

findTransactionForResponse verified as return payload for all 10 workflow transitions.
All workflow fields (currentState, allowedNextStates, workflowHistory, items.status,
costSheet.status) preserved exactly.

---

## 8. RBAC / Tenant Safety

No permission guards modified. No authorization logic changed. Tenant isolation
via departmentId filtering unchanged.

---

## 9. Files Changed

backend/src/business-transaction/services/business-transaction.service.ts:
  - findTransactionById: converted 7 nested includes to precise selects
  - findTransactionForResponse: converted 7 nested includes to precise selects

No other files changed. No schema changes. No P7 indexes modified.

---

## 10. TypeScript Build

npx tsc --noEmit (src/ only): 0 errors. PASS.

---

## 11. P7 Indexes Unchanged

idx_indents_status_isdeleted_createdat, idx_indents_departmentid_isdeleted_createdat,
idx_email_jobs_polling, cost_sheets_createdAt_idx: all preserved.

---

## 12. Strict Pass Criteria

Response size reduced where safe: PASS (-735 bytes, -11.8%)
API contract correct: PASS
Required fields unchanged: PASS (all verified)
Calculations unchanged: PASS
Costing unchanged: PASS (all cost fields verified)
Workflow unchanged: PASS (all 10 transitions)
RBAC unchanged: PASS
Tenant isolation unchanged: PASS
Pagination unchanged: PASS
Sorting/filtering unchanged: PASS
Frontend behavior unchanged: PASS
P7 indexes unchanged: PASS
Production measurements: PASS (Brotli 68-84%)
TypeScript build: PASS

P8 = PASS
