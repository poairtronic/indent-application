# IMCMS — Error Resolution 1
## Cost Sheet / Business Transaction REST Data Visibility Leak
### Security Certification Report

**Issue ID:** ISS-02
**Original Severity:** P2 (Medium)
**Escalated Severity:** P1 (High) — Security / Unauthorized Financial Data Read
**Resolution Status:** CERTIFIED RESOLVED
**Resolution Date:** 2026-08-10

---

## 1. Issue Summary

Business Transaction REST GET responses were returning full `costSheet` objects including `predictedTotal`, `costNumber`, per-item rates, and per-process costs to ALL authenticated users regardless of RBAC permissions.

Roles affected (should NOT see cost data):
- DESIGN_EXECUTIVE
- STORES_EXECUTIVE
- PRODUCTION_EXECUTIVE

---

## 2. Root Cause

| Layer | Finding |
|---|---|
| Service Layer | findOne() returned full Prisma-joined costSheet relation |
| Controller Layer | No response transformation or permission-aware serialization |
| Frontend Layer | IndentForm rendered cost inputs unconditionally for all users |

---

## 3. Remediation Applied

### 3.1 Backend — NestJS Response Interceptor

File: backend/src/business-transaction/interceptors/cost-sheet-visibility.interceptor.ts

A controller-level NestInterceptor was created to strip financial fields (costSheet, predictedTotal, costNumber, per-item rates/amounts, per-process costs) from responses when user lacks costsheet.view or settings.manage permission.

Bound at class level on BusinessTransactionController covering all 26 endpoints.

### 3.2 Frontend — Conditional Rendering in IndentForm

File: frontend/src/modules/indent/components/IndentForm.tsx

canViewCostSheet boolean derived from Zustand auth store. The following sections are conditionally hidden:
- Per-process Planned/Actual Cost inputs
- Per-item product cost subtotal panel
- Item row Est. Rate / Material Cost inputs
- Global Costs section (Design, Overhead, Contingency)
- Subtotal and Grand Total panels

---

## 4. Permission Matrix (Post-Fix)

| Role | costsheet.view | API Returns Cost | UI Shows Cost |
|---|---|---|---|
| Admin | Yes (settings.manage) | Yes | Yes |
| General Manager | Yes | Yes | Yes |
| Senior Manager | Yes | Yes | Yes |
| Accounts Executive | Yes | Yes | Yes |
| Design Executive | No | No (stripped) | No (hidden) |
| Stores Executive | No | No (stripped) | No (hidden) |
| Production Executive | No | No (stripped) | No (hidden) |

Defense-in-depth: both API-layer and UI-layer protection are enforced independently.

---

## 5. Verification Results

Backend Build: Exit code 0 (PASS)
Backend Tests: 20 suites, 169 tests — all PASS
Frontend TypeScript: Exit code 0 (PASS)

---

## 6. Certification

ISS-02 is CERTIFIED RESOLVED.

The IMCMS backend API no longer exposes cost sheet data to unauthorized users.
The frontend hides all cost fields for unauthorized roles.
Both layers are independently enforced. All 169 unit tests pass.
