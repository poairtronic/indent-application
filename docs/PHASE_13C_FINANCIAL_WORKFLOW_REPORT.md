# PHASE 13C — FINANCIAL WORKFLOW OPERATIONS REPORT
## Enterprise Manufacturing Indent & Costing Management System (IMCMS)

**Project:** Enterprise Manufacturing Indent & Costing Management System (IMCMS)  
**Document Type:** Financial Workflow & Architecture Compliance Report  
**Phase:** Phase 13C — Financial Workflow Operations (Loop 2)  
**Version:** 1.0  
**Status:** Approved & Completed  

---

# 1. Financial Workflow Report
Phase 13C implements the complete **Loop 2 (Financial Workflow & Archival)**. The loop starts once the product is delivered to the customer (`CUSTOMER_DELIVERED`):
`CUSTOMER_DELIVERED` → `ACCOUNTS_COST_VERIFICATION` → `ACTUAL_COST_UPDATED` → `ACCOUNTS_FINANCIAL_CLOSURE` → `ARCHIVED` → `COMPLETED`.  
The workflow transition enforces permission validation, audit trails, and broadcast notifications to Senior Managers (SM) and General Managers (GM) at each stage.

---

# 2. Accounts Operations Report
The Accounts Department owns the Cost Sheet during Loop 2. Accounts has exclusive permissions to perform the following operations:
1. **Verify Planned Cost:** Transitions state from `CUSTOMER_DELIVERED` to `ACCOUNTS_COST_VERIFICATION`.
2. **Enter Material Cost & Actual Cost:** Updates actual rate, quantity, process costs, and automatically computes process and product cost variances.
3. **Financial Closure:** Validates final costs, updates CostSheet status to `FINALIZED`, and transitions to `ACCOUNTS_FINANCIAL_CLOSURE`.
4. **Archive & Complete:** Archives drawing/attachment records, marks indent as locked (`isLocked = true`), and finishes the business transaction.

---

# 3. Cost Calculation Report
Cost calculations are computed dynamically and persisted in the `CostSheet` entity:
- **Material Actual Amount:** $\text{Actual Rate} \times \text{Actual Quantity}$ computed for each CostItem.
- **Process Actual Cost:** Entered for each manufacturing process step (In-house or Vendor).
- **Cost Sheet Actual Total:** Sum of all actual material item costs plus all actual process step costs:
  $$\text{Actual Total} = \sum (\text{CostItem.actualAmount}) + \sum (\text{ProcessCost.actualCost})$$

---

# 4. Process Variance Report
Process variance is calculated for every manufacturing process step:
- **Formula:** $\text{Variance} = \text{Actual Cost} - \text{Predicted Cost}$
- **Significance:** Positive variance indicates a cost overrun, whereas negative variance indicates a cost saving. Calculated process variances are stored in `ProcessCost.variance`.

---

# 5. Product Variance Report
Product variance is computed at the overall transaction level:
- **Product Variance Amount:** $\text{Variance Amount} = \text{Actual Total Cost} - \text{Predicted Total Cost}$
- **Product Variance Percentage:** 
  $$\text{Variance Percentage} = \left(\frac{\text{Variance Amount}}{\text{Predicted Total Cost}}\right) \times 100$$
All totals and percentages are persisted directly in the `CostSheet`.

---

# 6. Workflow State Transition Report
The state transitions are governed by the State Machine engine and department guards:
```
[CUSTOMER_DELIVERED]
        │
        ▼ (POST /accounts/verify)
[ACCOUNTS_COST_VERIFICATION] (Accounts Department takes ownership)
        │
        ▼ (POST /accounts/actual-cost or PATCH /accounts/material-cost)
[ACTUAL_COST_UPDATED] (Tag [ACTUAL_COST_UPDATED] appended, Variances calculated)
        │
        ▼ (POST /accounts/financial-close)
[ACCOUNTS_FINANCIAL_CLOSURE] (CostSheet marked FINALIZED)
        │
        ▼ (POST /archive)
[ARCHIVED] (isLocked = true, drawings locked)
        │
        ▼ (POST /complete)
[COMPLETED] (Loop 2 Closed & Transaction Completed ✅)
```

---

# 7. API Matrix

| Method | Endpoint | Backward Compatible Alias | Permission Guard | Target State | Description |
| --- | --- | --- | --- | --- | --- |
| `POST` | `/business-transactions/:id/accounts/verify` | `POST /accounts-verify` | `accounts.verify` | `ACCOUNTS_COST_VERIFICATION` | Accounts starts cost verification |
| `POST` | `/business-transactions/:id/accounts/actual-cost`| `POST /actual-costs` | `accounts.verify` | `ACTUAL_COST_UPDATED` | Enters actual costs and calculates variances |
| `PATCH`| `/business-transactions/:id/accounts/material-cost`| N/A | `accounts.verify` | `ACTUAL_COST_UPDATED` | Modifies individual material cost line item |
| `POST` | `/business-transactions/:id/accounts/financial-close`| `POST /financial-closure`| `accounts.close` | `ACCOUNTS_FINANCIAL_CLOSURE`| Concludes verification, finalizes sheet |
| `POST` | `/business-transactions/:id/archive` | N/A | `system.archive` | `ARCHIVED` | Locks indent record and archives drawings |
| `POST` | `/business-transactions/:id/complete` | N/A | `system.complete` | `COMPLETED` | Fully completes the business transaction |

---

# 8. Notification Matrix

| Source State | Target State | Recipient | Broadcaster | Template Title & Message Body |
| --- | --- | --- | --- | --- |
| `CUSTOMER_DELIVERED` | `ACCOUNTS_COST_VERIFICATION` | Accounts | SM & GM | **Accounts Cost Verification Underway:** Accounts is verifying actual vendor and in-house costs for Indent #{indentNumber}. |
| `ACCOUNTS_COST_VERIFICATION`| `ACTUAL_COST_UPDATED` | Accounts | SM & GM | **Actual Cost Updated:** Actual costs and variance calculations updated for Indent #{indentNumber}. |
| `ACTUAL_COST_UPDATED` | `ACCOUNTS_FINANCIAL_CLOSURE`| System | SM & GM | **Financial Closure Completed:** Financial closure and variance calculations completed for Indent #{indentNumber}. Ready for archival. |
| `ACCOUNTS_FINANCIAL_CLOSURE`| `ARCHIVED` | System | SM & GM | **Business Transaction Archived:** Business transaction for Indent #{indentNumber} archived. Record locked. |
| `ARCHIVED` | `COMPLETED` | System | SM & GM | **Business Transaction Completed:** Business transaction for Indent #{indentNumber} is completed. both loops closed. |

---

# 9. Audit Matrix

| Audit Event Type | Module | State Transition | Action Code | Captured Context |
| --- | --- | --- | --- | --- |
| `VERIFY_COSTS` | `ACCOUNTS` | `CUSTOMER_DELIVERED` → `ACCOUNTS_COST_VERIFICATION` | `ACCOUNTS_START_VERIFICATION` | `state: ACCOUNTS_COST_VERIFICATION` |
| `VERIFY_COSTS` | `ACCOUNTS` | `ACCOUNTS_COST_VERIFICATION` → `ACTUAL_COST_UPDATED`| `ACCOUNTS_ACTUAL_COST_ENTRY` | `costSheetId`, `predictedTotal`, `state: ACTUAL_COST_UPDATED` |
| `VERIFY_COSTS` | `ACCOUNTS` | `ACTUAL_COST_UPDATED` → `ACTUAL_COST_UPDATED` | `ACCOUNTS_MATERIAL_COST_UPDATE` | `costItemId`, `actualRate`, `actualQuantity` |
| `FINANCIAL_CLOSURE` | `ACCOUNTS` | `ACTUAL_COST_UPDATED` → `ACCOUNTS_FINANCIAL_CLOSURE` | `ACCOUNTS_FINANCIAL_CLOSURE` | `state: ACCOUNTS_FINANCIAL_CLOSURE`, `costSheetStatus: FINALIZED` |
| `ARCHIVE_TRANSACTION` | `SYSTEM` | `ACCOUNTS_FINANCIAL_CLOSURE` → `ARCHIVED` | `SYSTEM_ARCHIVE_RECORD` | `state: ARCHIVED`, `isLocked: true` |
| `COMPLETE_TRANSACTION`| `SYSTEM` | `ARCHIVED` → `COMPLETED` | `SYSTEM_COMPLETE_RECORD` | `state: COMPLETED` |

---

# 10. Business Validation Report
The service layer implements rigid guard rails to prevent invalid financial operations:
1. **Actual Cost Sign Validation:** Rejects any negative actual rate, quantity, process cost, or hours with `400 Bad Request`.
2. **Timeline Check:** Blocks cost verification or actual cost entry if transaction is not yet delivered to the customer.
3. **Lock Enforcement:** Indent `isLocked = true` status is enforced once archived. Rejects edit or state update requests on archived or completed transactions.
4. **Duplicate Closure Guard:** Rejects closure requests if the transaction is already finalized or closed.

---

# 11. Integration Report
All modules (state engine, event logger, email notifications, audit tables, and NestJS controllers) function in complete harmony:
- Transactions ensure complete transactional rollback if database checks fail.
- Status mapper parses remark tags dynamically, allowing standard database enums to represent complex workflow stages.

---

# 12. Architecture Compliance Report
- **Prisma Schema Compliance:** 100% untouched. No new database entities or column alterations.
- **Zero-Approval Model:** Fully compliant. Senior Manager and General Manager passive monitoring is preserved through real-time notifications.
- **Role Security:** Fully guarded by RBAC checks on controllers and service functions.

---

# 13. Production Readiness Report
- **NestJS Build:** ✅ **PASS** (Successful build with 0 warnings).
- **Format Integrity:** ✅ **PASS** (Prettier code alignment verified).
- **Prisma Database Connections:** ✅ **PASS** (Neon database connected successfully).
- **Core Security Guards:** ✅ **PASS** (JWT and permissions guards active on all new endpoints).
