# IMCMS T1 LEVEL 1 — UNIT TESTING AUDIT AND TEST DESIGN

**Project Name:** Enterprise Manufacturing Indent & Costing Management System (IMCMS)  
**Phase:** T1 (Level 1) - Unit Testing Audit & Test Design  
**Status:** Audit Completed - Pending Approval  

---

## 1. Executive Summary

This document serves as the Master Unit Testing Audit and Test Design (T1 - Level 1) for the IMCMS Enterprise monorepo. It strictly adheres to the requirements established in the PRD, TRD, and historical forensic audits.

The overarching goal is to implement a robust safety net around the IMCMS Two-Loop business architecture, financial calculations, and secure role-based state machine, without modifying any application code.

**Key Findings & Hard Boundaries Enforced:**
- **Customer Delivery Removed:** Customer Delivery is no longer part of the production application workflow and will not be tested.
- **Zero Modifications:** No tests have been implemented, no business code altered, and no packages installed.
- **Workflow Integrity:** Loop 1 closes at `PRODUCTION_COMPLETED`. Loop 2 runs from `ACCOUNTS_COST_VERIFICATION` to `COMPLETED`.

---

## 2. Current Testing Infrastructure

**Backend:**
- **Framework:** Jest
- **Current Coverage:** 27 test suites, 207 tests (all passing). Tests are located in `backend/src/**/*.spec.ts`.
- **Key Config:** Testing environment relies on `prisma-mock` and internal Jest configuration.

**Frontend:**
- **Framework:** Vitest with React Testing Library.
- **Current Coverage:** 10 test files, 30 tests (all passing). Tests are in `frontend/src/test/` and `frontend/src/api/tests/`.

*Conclusion:* Existing infrastructure is sound. No new frameworks are needed.

---

## 3. Current Business Workflow

**Roles & Responsibilities:**
- **Design:** Owns `DRAFT` creation, process planning, and submission.
- **Stores:** Owns material stock verification and issuing.
- **Production:** Owns receipt of materials and manufacturing completion.
- **Accounts:** Owns actual cost entry and financial variance closure.
- **Management (SM & GM):** Read-only passive monitoring; zero approvals required.

**Canonical Workflow State Machine:**
`DESIGN` (Draft → Submitted)  
→ `STORES` (Stores Processing → Materials Issued)  
→ `PRODUCTION` (Production Processing → Production Completed) *(Loop 1 Ends)*  
→ `ACCOUNTS` (Accounts Cost Verification → Actual Cost Updated → Accounts Financial Closure)  
→ `SYSTEM` (Archived → Completed) *(Loop 2 Ends)*  

---

## 4. Customer Delivery Removal Verification

**Search Results:**
A forensic search for `CUSTOMER_DELIVERED`, `customerDelivery`, and `deliverProduct` was executed across the repository.

- `backend/src/business-transaction/dto/production-update.dto.ts`: Contains `CustomerDeliveryDto`. (Status: **UNUSED / LEGACY**)
- Various Documentation Files (PRD, TRD, Phase Reports): Mentions `CUSTOMER_DELIVERED` as part of the original workflow. (Status: **LEGACY**)

*Conclusion:* The Customer Delivery workflow has been removed from actual business routing but remnants exist in DTOs and older documentation. **No tests will be created for Customer Delivery.**

---

## 5. Backend Unit Test Inventory

The backend test suite contains foundational tests.
| File | Module | Existing Tests | Quality | Gap |
|---|---|---|---|---|
| `analytics.service.spec.ts` | Analytics | Yes | High | Needs KPI stalled metric edge cases |
| `auth.service.spec.ts` | Auth | Yes | High | Needs session isolation edge cases (`BUG-AUTH-001`) |
| `financial-math.spec.ts` | Costing | Yes | Med | Needs IEEE-754 precision boundary checks (`BUG-FIN-001`) |
| `stores-issue-inventory.spec.ts` | Inventory | Yes | Med | Needs stock decrement validation (`BUG-REQ-001`) |

---

## 6. Frontend Unit Test Inventory

The frontend test suite focuses on component isolation.
| File | Module | Existing Tests | Quality | Gap |
|---|---|---|---|---|
| `components.test.tsx` | UI Core | Yes | High | Missing dependency array edge cases |
| `auth.test.ts` | Auth API | Yes | High | Missing concurrent refresh test cases |
| `forms.test.tsx` | Forms | Yes | Med | Needs validation coverage for structured cost fields (`BUG-DATA-001`) |

---

## 7. Business Rule Coverage

| BUSINESS REQUIREMENT | SOURCE FILE | FUNCTION / METHOD | UNIT TEST REQUIRED? | CURRENT TEST? | GAP |
|---|---|---|---|---|---|
| Create Indent | `business-transaction.service.ts` | `createDraft` | YES | YES | Minimal |
| Issue Materials | `business-transaction.service.ts` | `storesIssueMaterials` | YES | PARTIAL | Ensure atomic stock decrement |
| Actual Cost Entry | `business-transaction.service.ts` | `enterActualCosts` | YES | YES | Validate 4-decimal math |

---

## 8. Financial Calculation Coverage

**Target:** `financial-math.util.ts` (`safeMultiply`, `safeAdd`, `safeSubtract`, `safeVariancePercentage`, `roundTo4Decimals`).

**Test Cases Required:**
- Exact 4-decimal precision with `$0.0001` increments.
- Zero denominator in variance.
- Extremely large batch amounts (BigInt limits).
- Verification of IEEE-754 drift elimination (e.g. `0.1 + 0.2 === 0.3`).

---

## 9. Workflow Transition Coverage

**Target:** `WorkflowStateMachineService` & `assertCurrentStateAndUpdate`

**Transition Matrix Verification:**
| Current State | Target State | Department | Allowed? |
|---|---|---|---|
| `DRAFT` | `DESIGN_COMPLETED` | Design | YES |
| `PRODUCTION_PROCESSING` | `PRODUCTION_COMPLETED`| Production | YES |
| `PRODUCTION_COMPLETED` | `ACCOUNTS_COST_VERIFICATION` | Accounts | YES (Auto-transition logic) |
| `PRODUCTION_COMPLETED` | `CUSTOMER_DELIVERED`| Production | **NO (Legacy)** |

---

## 10. Inventory Coverage

**Target:** `storesIssueMaterials`
- **Invariants:** Stock MUST NEVER become negative. Failed material issue MUST NOT partially move business transaction state.
- **Tests Needed:** Sufficient stock, Exact stock, Insufficient stock (throws 400), Zero/Negative quantities, Duplicate items.

---

## 11. Authentication Coverage

**Target:** `auth.service.ts`
- **Tests Needed:** Valid/Invalid login flows. Refresh token rotation. 
- **Critical Edge Case:** Confirm single session refresh does *not* revoke other concurrent devices/sessions (`BUG-AUTH-001`).

---

## 12. Authorization Coverage

**Target:** `authorization.service.ts`, `permissions.guard.ts`
- **Tests Needed:** Correct Department mapping. SM/GM passive monitoring access (read-only validation). Denied action when cross-department execution is attempted.

---

## 13. Tenant Isolation Coverage

*Not explicitly configured as multi-tenant at the DB level beyond department boundaries.* Tests will enforce Department isolation (e.g., Accounts cannot access Design-specific mutable APIs).

---

## 14. Notification Coverage

**Target:** `business-transaction-event.service.ts`
- **Tests Needed:** Passive broadcasts triggered for SM/GM at every stage transition. Verification that one intended event = one notification rule matched.

---

## 15. Error Handling Coverage

**Target:** Global Exception Filter & Axios Interceptors.
- **Tests Needed:** Ensure 401/403 map correctly. Ensure internal 500s do not leak DB credentials, JWTs, or passwords.

---

## 16. Edge Case Matrix

| Edge Case | Expected Behavior | Test Level | Priority |
|---|---|---|---|
| Negative stock quantity | Throw BadRequestException | Backend Unit | P0 |
| `0.1 + 0.2` cost sum | Resolves to `0.3000` | Backend Unit | P0 |
| Refresh token collision | Revoke target session only | Backend Unit | P1 |
| Missing UI JSX Key | Render safely without loops | Frontend Unit | P3 |

---

## 17. Loop/Retry Risk Matrix

| Risk Area | Loop Type | Risk | Classification |
|---|---|---|---|
| Frontend Token Refresh | Axios Interceptor | 401 Infinite Loop | High (Needs resilience test) |
| React UI `useMemo` | Dependency array | Unbounded Re-render | Med (`BUG-UI-002`) |
| BullMQ Notification | Retry Handler | Dead Letter Queue spam | Low |

---

## 18. Previous Bug Regression Coverage

| Bug ID | Root Cause | Existing Regression Test | Recommended Test Level |
|---|---|---|---|
| `BUG-FIN-001` | IEEE-754 drift | Partial | Backend Unit (`financial-math`) |
| `BUG-AUTH-001`| Global session revocation | Partial | Backend Unit (`auth.service`) |
| `BUG-REQ-001` | Missing stock decrement | Partial | Backend Unit (`storesIssueMaterials`) |

---

## 19. Test Anti-Patterns

**Audit Findings:**
- No arbitrary `sleep()` functions observed.
- Backend tests correctly utilize mocked Prisma repositories.
- No real SMTP or DB connection credentials found in existing `.spec.ts` files.

---

## 20. Test Data Strategy

**Fixtures Required for T1:**
- Mock Users: `mockDesignUser`, `mockStoresUser`, `mockProductionUser`, `mockAccountsUser`, `mockSMGR`.
- Mock Transactions: `mockIndent`, `mockProcessCostSheet`.
- *Constraint:* Real production credentials or PII will NEVER be utilized in the test suite.

---

## 21. Coverage Strategy

- **Financial Logic:** VERY HIGH (100% path coverage required).
- **Workflow State Transitions:** VERY HIGH.
- **Inventory Math:** VERY HIGH.
- **Authentication/Security:** VERY HIGH.
- **UI Components/DTOs:** MED-HIGH.

---

## 22. Complete T1 Test Matrix

| Test ID | Module | Function | Scenario | Expected Result | Priority |
|---|---|---|---|---|---|
| T1-F01 | Costing | `safeAdd` | Add `0.1` and `0.2` | `0.3000` | P0 |
| T1-I01 | Inventory | `storesIssueMaterials` | Issue qty > stock | `BadRequestException` | P0 |
| T1-W01 | Workflow | `assertCurrentState...` | Attempt `PRODUCTION` to `CUSTOMER_DELIVERED` | Throws Invalid Transition | P1 |
| T1-A01 | Auth | `executeRefresh` | Concurrent rotation | Isolates revocation to specific session | P1 |

---

## 23. T1 Implementation Plan

**Future Execution Blocks (DO NOT IMPLEMENT NOW):**
- **T1-A (Financial & Workflow):** Implement `financial-math.util.ts` and `workflow-state-machine` unit tests.
- **T1-B (Inventory & Auth):** Implement atomic decrement and token rotation tests.
- **T1-C (Notifications):** Implement event bus notification payload verification.
- **T1-D (Frontend Utilities):** Implement Vite tests for `currencyFormatter.ts` and UI component hooks.
- **T1-E (Regression):** Enforce tests for `BUG-AUTH-001`, `BUG-FIN-001`, `BUG-REQ-001`.

---

## 24. Risks

- The presence of `CustomerDeliveryDto` and legacy documentation may inadvertently invite developers to restore the flow. Tests must strictly omit it.
- String serialization of JSON in `indent.remarks` (`BUG-DATA-001`) remains brittle and must be tested carefully for malformed JSON handling.

---

## 25. Acceptance Criteria

- [x] Codebase inspected.
- [x] Tests inventoried.
- [x] Customer Delivery removal validated.
- [x] Financial, Inventory, and Workflow logic mapped.
- [x] Implementation Plan documented.
- [x] NO CODE WAS MODIFIED OR TESTS CREATED.

---

## 26. Files Recommended for T1 implementation

1. `backend/src/business-transaction/tests/financial-math.spec.ts` (Update)
2. `backend/src/business-transaction/tests/workflow-state-machine.spec.ts` (New)
3. `backend/src/business-transaction/tests/stores-issue-inventory.spec.ts` (Update)
4. `backend/src/auth/services/auth.service.spec.ts` (Update)
5. `frontend/src/test/session.test.ts` (Update)
