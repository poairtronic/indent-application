# IMCMS Enterprise - Master Testing Strategy

**Project Name:** Enterprise Manufacturing Indent & Costing Management System (IMCMS)  
**Document Type:** Master Testing Strategy & Architecture Audit  
**Status:** Approved  
**Phase:** Testing Architecture Planning  

---

## 1. Executive Summary

This Master Testing Strategy outlines the comprehensive, enterprise-grade testing architecture for the IMCMS application. Currently, the application is live in production (Render, Neon PostgreSQL, Redis, NestJS, React) and operates flawlessly on the **Two-Loop Zero-Approval Architecture**.

The purpose of this strategy is to systematically construct a safety net that protects the integrity of the business logic, financial calculations, state transitions, and UI performance, ensuring strict conformance to the engineering baseline (`IMCMS_Enterprise_Engineering_Baseline.md`) without disrupting the live production environment.

**Core Principles:**
- **Zero Production Mutation:** Test environments and CI/CD pipelines will be isolated. Production data and workflow states will never be mutated by automated tests.
- **Workflow Fidelity:** Tests will explicitly validate the linear Two-Loop workflow and the strict lack of manual approval gates.
- **Role-Based Isolation:** Security and E2E tests will validate strict Department and Executive (SMGR/GMGR) boundary enforcement.

---

## 2. Unit Testing

**Objective:** Validate the smallest units of code (functions, methods, UI components) in complete isolation.

### 2.1 Backend (NestJS / Jest)
- **Business Logic & Math:** Exhaustively test `financial-math.util.ts` to ensure exact 4-decimal precision (`safeMultiply`, `safeAdd`, `roundTo4Decimals`) and zero floating-point drift.
- **Services:** Test service methods (e.g., `BusinessTransactionService`, `AuthService`) by mocking Prisma (`prisma-mock`) and external queues. 
- **State Transitions:** Unit test the `WorkflowStateMachineService` to ensure `assertCurrentStateAndUpdate` correctly calculates allowed next states based on inputs.
- **Token Rotation:** Validate logic mapping token hashes and session eviction specific to families, avoiding global session drops.

### 2.2 Frontend (React / Vitest)
- **Utilities:** Test `currencyFormatter.ts` to ensure correct symbol rendering (`$`, `₹`, `€`).
- **Components:** Test isolated React components (e.g., `CommandPalette`, `DatePicker`) ensuring proper rendering, hook dependency arrays, and lifecycle cleanup (preventing memory leaks).
- **Hooks & State:** Unit test Zustand stores and custom React Query hooks to ensure they handle loading states and transformations correctly.

---

## 3. Integration Testing

**Objective:** Validate that interconnected modules and boundaries work correctly together, including database layers.

### 3.1 Backend Data Layer
- **Prisma Transactions:** Validate that multi-step operations (e.g., `Submit Business Transaction`, `Stores Material Issue`) correctly execute inside `$transaction` blocks.
- **Atomic Operations:** Verify that stock decrements (`currentStock - qty`) are atomic and cannot be bypassed or driven below zero (concurrency/race condition checks).
- **Event Bus:** Test the `BusinessTransactionEventService` integration with the Notification Engine, ensuring state transitions dispatch the correct payloads to the event bus.

### 3.2 Frontend Integration
- **Form Submissions:** Validate the integration between React Hook Form, Zod validation, and Axios clients (e.g., creating an Indent and verifying the payload structure).
- **Token Refresh Interceptor:** Ensure the Axios interceptor correctly queues requests during a 401 refresh flight and resolves them after a successful token rotation.

---

## 4. API Testing

**Objective:** Secure and validate the REST API boundary.

- **Tools:** Supertest with NestJS testing module.
- **RBAC & Guards:** Hit all protected routes (`/api/business-transactions/*`) with missing tokens, expired tokens, and cross-department tokens (e.g., Design user attempting an Accounts route) to verify `JwtAuthGuard` and `PermissionsGuard` enforcement (Expect 401/403).
- **Validation Pipes:** Send malformed DTOs to controllers to verify standard global exception filter responses (`statusCode: 400`, specific error arrays).
- **Pagination:** Validate that list endpoints respect `page` and `limit` constraints and return accurate metadata.

---

## 5. UI Testing

**Objective:** Ensure visual and interactive correctness of the React application in the browser.

- **Tools:** Cypress Component Testing or Playwright.
- **Role Dashboards:** Mount dashboards under different mock contexts (SMGR vs Design) to ensure zero-approval constraints are visually enforced (i.e., Executives see read-only feeds, no action buttons).
- **Performance:** Verify that large lists (Materials, Departments) do not suffer from re-render loops by monitoring React component mount lifecycles.
- **Dynamic Content:** Validate that Excel/PDF export buttons properly trigger downloads and that localized currency symbols render correctly in the DOM.

---

## 6. End-to-End (E2E) Testing

**Objective:** Simulate real user behaviors across the complete business lifecycle from end to end.

- **Tools:** Playwright.
- **Scope:** Execution against a dedicated staging/test database.
- **Primary Happy Path (The Two Loops):**
  1. **Login (DSGN):** Create Indent & Process Cost Sheet -> Submit (`DESIGN_COMPLETED`).
  2. **Login (STOR):** Verify stock -> Issue Materials (`STORES_PROCESSING`).
  3. **Login (PROD):** Receive -> Manufacture -> Deliver to Customer (`CUSTOMER_DELIVERED` - Loop 1 Closes).
  4. **Login (ACCT):** Verify Invoices -> Enter Actual Costs (`ACCOUNTS_COST_VERIFICATION`).
  5. **Login (ACCT):** Financial Closure -> Calculate Variance (`ACCOUNTS_FINANCIAL_CLOSURE`).
  6. **System Assertions:** Verify Archival process locks the record and changes state to `COMPLETED`.
- **Zero-Approval Verification:** Log in as SMGR and GMGR. Assert that notifications appear for every step above, but no manual approval capabilities are present.

---

## 7. Load / Performance Testing

**Objective:** Validate system stability under expected enterprise load.

- **Tools:** k6 or Artillery.
- **Focus Areas:**
  - **Concurrent Stock Issues:** Simulate multiple Stores users issuing the same material simultaneously to guarantee database locks and avoid negative stock invariants.
  - **API Rate Limiting:** Spam endpoints to trigger and validate the Redis-backed Throttler (expect 429 Too Many Requests).
  - **Dashboard Query Load:** Validate response times for `analytics.service.ts` dashboard aggregations under heavy historical data volumes.
  - **Notification Spikes:** Validate the async queue (BullMQ/Redis) handles bursting SMTP/notification events during bulk workflow transitions.

---

## 8. Continuous Integration Strategy

All testing layers will be integrated into the existing CI pipeline (`azure-pipelines.yml` or GitHub Actions).

- **Gate 1 (Static):** ESLint and TypeScript (`tsc --noEmit`).
- **Gate 2 (Unit & Integration):** Jest & Vitest suites (require 100% pass rate).
- **Gate 3 (API & E2E):** Supertest & Playwright run against an ephemeral database container (Docker Compose).
- **Gate 4 (Security):** Dependency vulnerability scans.

*(End of Architecture Document. Implementation is deferred to subsequent phases.)*
