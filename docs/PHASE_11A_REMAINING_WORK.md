# PHASE 11A — REMAINING WORK
## Enterprise Manufacturing Indent & Costing Management System (IMCMS)

**Project:** Enterprise Manufacturing Indent & Costing Management System (IMCMS)
**Document Type:** Remaining Work & Next-Phase Backlog
**Phase:** 11A — Master Modules Architecture Complete
**Version:** 1.0
**Status:** Open (deferred to future phases)

---

# 1. What Phase 11A Completed

- Determined the required master modules: **Manufacturing Processes**, **Units**, **Vendors** (Categories, Error Types, Components rejected with rationale).
- Created architecture-only artifacts: DTOs, interfaces, constants, validation, module registration, folder structure.
- Registered `ProcessesModule`, `UnitsModule`, `VendorsModule` in `AppModule`.
- Verified clean build and lint.

---

# 2. Remaining Work — Deferred to Later Phases

## 2.1 Phase 11B — Master Module CRUD (Backend)

| Module | Backend Work |
| --- | --- |
| Processes | `ProcessesController`, `ProcessesService`, `ProcessesRepository`; Prisma queries, transactions, audit logging, permission guards (`manufacturing-processes.view/update`), soft delete, unique checks `[productId, processCode]` & `[productId, sequence]` |
| Units | `UnitsController`, `UnitsService`, `UnitsRepository`; CRUD + soft delete, duplicate `unitCode` check, delete-restriction when referenced by materials/transactions |
| Vendors | `VendorsController`, `VendorsService`, `VendorsRepository`; CRUD + soft delete, duplicate `email`/`gstNumber`/`panNumber` checks, GST/PAN format enforcement, delete-restriction when referenced by `MaterialVendor`/`CostItem` |

Each controller must follow the `UsersController` guard pattern (`JwtAuthGuard` + `PermissionsGuard` + `@Permissions(...)`) and use the DTOs prepared in Phase 11A.

## 2.2 Phase 9/12 — Remaining Master Data CRUD (Outside 11A scope)

- **Departments** (`backend/src/departments`), **Materials** (`backend/src/materials`), **Products** (`backend/src/products`) — placeholder folders await their own backend CRUD phases.
- These were intentionally excluded from Phase 11A (not part of the 11A candidate list).

## 2.3 Phase 12 — Workflow Engine Integration

- Wire the 7-department approval flow (`Design → Stores → Accounts → Senior Manager → General Manager → Production`) on top of the master data.
- Material verification (Stores) and costing (Accounts) will consume `Unit`, `Vendor`, and `ManufacturingProcess` masters.

## 2.4 Phase 11+ — Frontend Master Screens

- `frontend/src/modules/vendors/`, `frontend/src/modules/processes/` exist as placeholders; `frontend/src/modules/units/` must be created.
- Axios services, React Query hooks, and pages for the three masters (list, create/edit form, status toggles).
- **No frontend module is `units`** yet — `frontend/src/constants/api.ts` has no unit/vendor/process routes.

## 2.5 Phase 14 — Reporting

- Vendor Report (`PRD.md` §18) and Material Report will read Vendor/Material master data.
- Manufacturing process costs feed the Cost Sheet report.

## 2.6 Future Schema Considerations (NOT for 11A)

- **Category governance:** If a validated Category drop-down is required for Materials, a schema evolution (`Category` table + `Material.categoryId`) must be proposed as a dedicated phase (Phase 1–8C is immutable).
- **Indent vendor column:** PRD §11 lists a Vendor column on the Indent material grid, but `indent_items` has no `vendorId` FK — confirm whether this becomes a schema change or remains a costing-time selection only.

---

# 3. Open Questions for Product Team

1. Should `Material.category` remain a free-text field, or migrate to a governed `Category` master in a future release?
2. Should the Indent material grid Vendor column (`PRD.md:794`) be backed by a `vendorId` FK on `indent_items`, or is vendor selection restricted to the Cost Sheet (`cost_items.vendorId`)?
3. Are `manufacturing-processes.update` / `units.view` permission grants in `database/seed.ts` sufficient, or should more roles receive them (e.g., Admin is granted all via role mapping)?

---

# 4. Phase Completion Checklist

- ✅ Clean compilation (0 errors) — verified via `npm run build`.
- ✅ Lint clean — verified via `npm run lint`.
- ✅ No schema/backend-foundation modifications.
- ✅ No CRUD/controllers/services/frontend created.
- ✅ Documentation updated (Master Data Analysis, Dependency, Implementation, Remaining Work).
- ⏳ Unit & integration tests — deferred to CRUD implementation phase (11B).
