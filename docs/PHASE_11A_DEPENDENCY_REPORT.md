# PHASE 11A — MASTER DATA DEPENDENCY REPORT
## Enterprise Manufacturing Indent & Costing Management System (IMCMS)

**Project:** Enterprise Manufacturing Indent & Costing Management System (IMCMS)
**Document Type:** Module Dependency & Entity Reference Map
**Phase:** 11A — Master Modules (Architecture Only)
**Version:** 1.0
**Status:** Approved

---

# 1. Module Dependency Map

```
AppModule
  ├── PrismaModule (global database connection)
  ├── AuthModule
  ├── RolesModule ──► PermissionsModule
  ├── PermissionsModule
  ├── UsersModule ──► PrismaModule, AuthModule
  ├── IndentModule ──► PrismaModule
  ├── ProcessesModule (NEW — Phase 11A) ──► (PrismaModule on implementation)
  ├── UnitsModule    (NEW — Phase 11A) ──► (PrismaModule on implementation)
  └── VendorsModule  (NEW — Phase 11A) ──► (PrismaModule on implementation)
```

All Phase 11A modules are currently registered as **empty shells** (`@Module({})`) in `backend/src/app.module.ts`. Controllers, services, and `PrismaModule` imports are intentionally deferred to the CRUD implementation phase (Phase 11B+).

---

# 2. Master Entity → Prisma Model Reference Map

| Phase 11A Module | Backend Folder | Prisma Model | DB Table | Status Field | Unique Keys |
| --- | --- | --- | --- | --- | --- |
| Manufacturing Processes | `backend/src/processes/` | `ManufacturingProcess` | `manufacturing_processes` | `ProcessStatus` | `@@unique([productId, processCode])`, `@@unique([productId, sequence])` |
| Units | `backend/src/units/` | `Unit` | `units` | — (no status) | `unitCode` |
| Vendors | `backend/src/vendors/` | `Vendor` | `vendors` | `VendorStatus` | `vendorCode`, `email`, `gstNumber`, `panNumber` |

---

# 3. Downstream References (Consumers of Each Master)

## 3.1 ManufacturingProcess — consumers

| Consumer | Table / Model | FK / Relation | Business Flow |
| --- | --- | --- | --- |
| Product | `products.manufacturingProcesses` | Product 1─M Process | Product process mapping |
| Indent | `indent_processes.processId` | Process 1─M IndentProcess | Design adds manufacturing processes to indent items |
| Cost Sheet | `process_costs.processId` | Process 1─M ProcessCost | Predicted/actual process costing |

## 3.2 Unit — consumers

| Consumer | Table / Model | FK / Relation | Business Flow |
| --- | --- | --- | --- |
| Material | `materials.unitId` | Unit 1─M Material | Material unit of measure |
| Indent | `indent_items.unitId` | Unit 1─M IndentItem | Indent line quantity unit |
| Production (AMR) | `additional_material_items.unitId` | Unit 1─M AMRItem | Additional material request quantity unit |

## 3.3 Vendor — consumers

| Consumer | Table / Model | FK / Relation | Business Flow |
| --- | --- | --- | --- |
| Material | `material_vendors` (MaterialVendor) | Material M─M Vendor | Vendor price & lead time per material |
| Cost Sheet | `cost_items.vendorId` | Vendor 1─M CostItem | Selected vendor on material cost lines |
| Indent (form) | PRD §11 Material Grid "Vendor" column | — (no FK in `indent_items`) | Data-entry aid only in current schema |

**Workflow & Production:** No direct vendor dependency. Vendors are source data selected by Design/Accounts during costing.

---

# 4. Delete-Protection Rules (derived from schema)

- A `Unit` referenced by any `Material`, `IndentItem`, or `AdditionalMaterialItem` must be soft-deleted only; the FK restricts hard delete.
- A `Vendor` referenced by `MaterialVendor` or `CostItem` must be soft-deleted only (`isDeleted`/`deletedAt`), never hard-deleted.
- A `ManufacturingProcess` referenced by `IndentProcess` or `ProcessCost` must be soft-deleted only; schema uses `isDeleted` + `deletedAt` and no `onDelete: Cascade` on consumer FKs.

These rules must be enforced in the service layer during Phase 11B CRUD implementation.

---

# 5. Permission Dependencies (seed.ts)

| Permission Code | Granted Roles (seed) |
| --- | --- |
| `manufacturing-processes.view` | Design Engineer |
| `manufacturing-processes.update` | (not bound in seed role map) |
| `units.view` | Design Engineer |
| `vendors.create` / `vendors.view` / `vendors.update` | Admin (all), Design Engineer (view), Accounts Executive (view) |

Future CRUD controllers must guard endpoints with `JwtAuthGuard` + `PermissionsGuard` and the codes above, per the Users module pattern (`backend/src/users/users.controller.ts`).

---

# 6. Shared Foundation Dependencies

Every Phase 11A module depends on:

- **PrismaModule** — injectable `PrismaService` (added at implementation phase).
- **Auth guards** — `JwtAuthGuard`, `PermissionsGuard`, `@Permissions(...)` decorator for controller protection (added at implementation phase).
- **`@prisma/client` enums** — `ProcessStatus`, `VendorStatus` imported directly from the generated client (single source of truth; no duplicate enum files were created).
- **Validation infrastructure** — global `ValidationPipe` (`whitelist: true`, `transform: true`, `forbidNonWhitelisted: true`); DTOs are built with `class-validator` + `@nestjs/swagger` decorators to match the existing convention.
