# PHASE 11A — MASTER DATA ANALYSIS REPORT
## Enterprise Manufacturing Indent & Costing Management System (IMCMS)

**Project:** Enterprise Manufacturing Indent & Costing Management System (IMCMS)
**Document Type:** Master Data Module Feasibility & Requirement Analysis
**Phase:** 11A — Prepare All Master Modules (Architecture Only)
**Version:** 1.0
**Status:** Approved

---

# 1. Purpose

Phase 11A prepares the master-data module architecture for IMCMS. It determines which of the candidate master modules are **actually required** by the business flow, database schema, business logic, reports, forms, dashboard, cost sheet, indent, and production — and creates only the architecture (DTOs, interfaces, constants, validation, module registration, folder structure) for those modules.

**No CRUD. No Controllers. No Services. No Frontend. No APIs.** Only architecture.

---

# 2. Analysis Method

Every authoritative Markdown document was read as source of truth:

| Document | Source |
| --- | --- |
| PRD.md | `PRD.md`, `docs/PRD.md` |
| TRD.md | `TRD.md`, `docs/TRD.md` |
| APPLICATION_FLOW.md | `APPLICATION_FLOW.md`, `docs/APPLICATION_FLOW.md` |
| BACKEND_DOMAIN_SCHEMA.md | `BACKEND_DOMAIN_SCHEMA.md`, `docs/BACKEND_DOMAIN_SCHEMA.md` |
| UI_UX_SPECIFICATION.md | `UI_UX_SPECIFICATION.md`, `docs/UI_UX_SPECIFICATION.md` |
| IMPLEMENTATION_ROADMAP.md | `IMPLEMENTATION_ROADMAP.md`, `docs/IMPLEMENTATION_ROADMAP.md` |
| SOFTWARE_IMPLEMENTATION_REPORT.md | `SOFTWARE_IMPLEMENTATION_REPORT.md`, `docs/SOFTWARE_IMPLEMENTATION_REPORT.md` |
| AGENTS.md | `.agents/AGENTS.md` |
| Database Design | `docs/Database Design.md` |
| API Standards / API Documentation | `docs/API Standards.md`, `docs/API Documentation.md` |
| Coding Standards | `docs/Coding Standards.md` |
| Supporting docs | `docs/Architecture.md`, `docs/Folder Structure.md`, `docs/SRS.md`, `docs/Requirement Analysis.md`, `docs/Environment Variables.md`, `docs/Deployment.md`, `docs/User Manual.md`, `docs/UI Design.md` |

Source-of-truth code artifacts cross-checked:

- `database/schema.prisma` (28 Prisma models — Phase 1–8C, **IMMUTABLE**)
- `database/seed.ts` (permission codes per module)
- `backend/src/app.module.ts` (registered module graph)
- `backend/src/users/**` (the implemented module convention — DTOs, interfaces, constants)

---

# 3. Candidate Module Analysis

## 3.1 Categories — ❌ NOT REQUIRED (rejected)

| Check | Evidence |
| --- | --- |
| Workflow | Not referenced in any workflow state or transition. |
| Database | **No `Category` model exists** in `schema.prisma`. `Material.category` is a plain `String @db.VarChar(100)` column (`schema.prisma:356`), i.e. a free-text attribute of Material, not a normalized entity. |
| Business logic | `PRD.md` §7 lists "Material Categories" only as a feature *inside* Material Management and "Category required" as a Material business rule — an attribute, not a module. |
| Reports / Forms | No Category master screen, report, or filter exists in PRD/UI specs. |
| Cost Sheet / Indent / Production | No foreign key to a category table exists in `cost_items`, `indent_items`, or production tables. |

**Decision:** **Do not create a Categories module.** `category` is a denormalized attribute of the `Material` master. Introducing a standalone `Category` table would require altering the immutable Phase 1–8C Prisma schema and is not demanded by any business flow, report, or form. If the organization later requires governed categories (validated drop-down), that is a schema-evolution request for the next phase, not an 11A master module.

## 3.2 Error Types — ❌ NOT REQUIRED (rejected)

| Check | Evidence |
| --- | --- |
| Workflow | Not referenced in workflow states, SLA, or notifications. |
| Database | **No `ErrorType` / `ErrorCatalog` model exists** in `schema.prisma`. |
| Business logic | The only "error" concept in the system is the standardized HTTP exception envelope (`docs/API Standards.md`) produced by `GlobalExceptionFilter` (`backend/src/common/filters/global-exception.filter.ts`). This is **infrastructure-level exception formatting**, not master data. |
| Reports / Forms | No error-code master screen, report, or configuration exists. |

**Decision:** **Do not create an Error Types module.** Error codes/messages are constants inside the exception filter and DTOs, not a reference entity. A master "Error Types" table is an ERP assumption with no business owner, no workflow reference, and no report dependency in IMCMS.

## 3.3 Components — ❌ NOT REQUIRED (rejected)

| Check | Evidence |
| --- | --- |
| Workflow | Not referenced in workflow. |
| Database | **No `Component` model exists** in `schema.prisma`. The system decomposes products via `Product` → `ProductMaterial` (BOM) and `ManufacturingProcess`, never via a "Component" entity. |
| Business logic | All "component" mentions in the documentation refer to the **frontend UI component library** (`docs/IMPLEMENTATION_ROADMAP.md`, `docs/UI_UX_SPECIFICATION.md`, `docs/SOFTWARE_IMPLEMENTATION_REPORT.md`) — React components, unrelated to master data. |
| Cost Sheet / Indent / Production | No foreign key to a component table exists. |

**Decision:** **Do not create a Components module.** There is no component master in the database or domain model. Manufacturing structure is expressed through `Product`, `ProductMaterial`, and `ManufacturingProcess`.

## 3.4 Manufacturing Processes — ✅ REQUIRED (approved)

| Check | Evidence |
| --- | --- |
| Database | **`ManufacturingProcess` model exists** (`schema.prisma:460`). |
| Product | `Product.manufacturingProcesses` relation (`schema.prisma:426`). |
| Indent | `IndentProcess.processId` FK — indent line items reference processes (`schema.prisma:603`). |
| Cost Sheet | `ProcessCost.processId` FK — process costing (`schema.prisma:701`). |
| Permissions | Seed defines `manufacturing-processes.view` and `manufacturing-processes.update`. |
| Backend | Placeholder `backend/src/processes/.gitkeep` existed awaiting implementation. |
| PRD | §10 Manufacturing Process Management — Process Master, Estimated Hours, Process Order, Cost Parameters. |
| Backend Domain Schema | Manufacturing module owns `manufacturing_processes`. |

**Decision:** **Create the Manufacturing Processes module architecture.**

## 3.5 Units — ✅ REQUIRED (approved)

| Check | Evidence |
| --- | --- |
| Database | **`Unit` model exists** (`schema.prisma:324`). |
| Material | `Material.unitId` FK (`schema.prisma:353`). |
| Indent | `IndentItem.unitId` FK (`schema.prisma:549`). |
| Production (AMR) | `AdditionalMaterialItem.unitId` FK (`schema.prisma:767`). |
| Permissions | Seed defines `units.view`. |
| Backend | **No `backend/src/units` folder existed** — folder must be created. |

**Decision:** **Create the Units module architecture.**

## 3.6 Vendors — ✅ REQUIRED (approved)

The prompt requires an explicit determination of whether Vendor is referenced inside **Cost Sheet, Material, Indent, Workflow, Production**.

| Location | Reference | Verdict |
| --- | --- | --- |
| **Cost Sheet** | `CostItem.vendorId` FK → `Vendor` (`schema.prisma:670, 691`). BACKEND_DOMAIN_SCHEMA: Vendor owns relationship to `cost_items`. | ✅ **Referenced** |
| **Material** | `MaterialVendor` join table `material_vendors` (`schema.prisma:382`) — vendor price & lead time per material. | ✅ **Referenced** |
| **Indent** | PRD §11 Material Grid defines a "Vendor" column (`PRD.md:794`), but the current `IndentItem` model has **no** `vendorId` FK. | ⚠️ Form-level only |
| **Workflow** | No vendor reference in workflow states or transitions. | ❌ Not referenced |
| **Production** | No vendor reference in `ProductionReceipt` / AMR models. | ❌ Not referenced |
| Permissions | Seed defines `vendors.create`, `vendors.view`, `vendors.update`. | ✅ |
| Backend | Placeholder `backend/src/vendors/.gitkeep` existed awaiting implementation. | ✅ |

**Decision:** **Create the Vendors module architecture.** Vendor is genuinely referenced inside the **Cost Sheet** (`cost_items.vendorId`) and **Material** domain (`material_vendors`), so a Vendor master is mandatory. No schema changes are required — the `Vendor` model already exists.

---

# 4. Decision Summary

| Candidate Module | Verdict | Rationale (one line) |
| --- | --- | --- |
| Categories | ❌ Rejected | Only a free-text attribute of `Material`; no table/entity in the schema. |
| Error Types | ❌ Rejected | No entity; "errors" are standardized HTTP exceptions, not master data. |
| Components | ❌ Rejected | No entity; docs use "component" for the frontend UI library only. |
| Manufacturing Processes | ✅ Approved | Referenced by Product, IndentProcess, ProcessCost; schema + permissions exist. |
| Units | ✅ Approved | Referenced by Material, IndentItem, AMR item; schema + permissions exist. |
| Vendors | ✅ Approved | Referenced by CostItem (Cost Sheet) and MaterialVendor (Material). |

**Scope guard:** Materials, Products, Departments, Roles, Permissions, and Users are existing/foundation master data **outside** this phase's candidate list and were intentionally **not** modified.

---

# 5. Hard Boundaries Respected

- Phase 1–8C backend/database is **immutable** — no Prisma schema changes were made.
- No controllers, services, repositories, or CRUD were created.
- No frontend code was created or modified.
- No APIs were added.
