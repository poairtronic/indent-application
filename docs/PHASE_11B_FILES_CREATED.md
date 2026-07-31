# PHASE 11B — FILES CREATED / MODIFIED
## Enterprise Manufacturing Indent & Costing Management System (IMCMS)

**Project:** Enterprise Manufacturing Indent & Costing Management System (IMCMS)
**Document Type:** Master Modules Implementation — Files Inventory
**Phase:** 11B — Approved Master Modules Backend Implementation
**Version:** 1.0
**Status:** Approved

---

# 1. Legend

| Status | Meaning |
| --- | --- |
| NEW | File created during Phase 11B |
| MOD | Existing file modified during Phase 11B |
| KEEP | Created in Phase 11A (architecture), reused unchanged in 11B |

---

# 2. Manufacturing Processes — `backend/src/processes/`

| Status | File | Purpose |
| --- | --- | --- |
| KEEP | `dto/create-process.dto.ts` | Create payload validation (productId, processCode, processName, sequence, cycleTime, setupTime, defaultPrice, standardPrice, description, isActive) |
| KEEP | `dto/update-process.dto.ts` | Partial update payload validation |
| KEEP | `dto/process-query.dto.ts` | List query: page, limit, search, productId, status |
| KEEP | `dto/process-response.dto.ts` | Standardized response shape |
| KEEP | `constants/process.constants.ts` | Enums / filter fields / GST & PAN patterns |
| MOD | `constants/process-messages.constants.ts` | Added `IN_USE_DELETE` message |
| KEEP | `interfaces/process.interface.ts` | Service method signatures / paginated response interface |
| NEW | `processes.service.ts` | CRUD + pagination/search/filter, product validation, uniqueness (productId+processCode, productId+sequence), soft delete/restore, in-use guard (indentProcess, processCost), audit log |
| NEW | `processes.controller.ts` | Routes + `PermissionsGuard` + `@Permissions('manufacturing-processes.*')` |
| NEW | `processes.module.ts` | Module wiring (PrismaModule, controller, service) |
| NEW | `processes.service.spec.ts` | Service unit tests (31 cases) |
| NEW | `processes.controller.spec.ts` | Controller unit tests |

---

# 3. Units — `backend/src/units/`

| Status | File | Purpose |
| --- | --- | --- |
| KEEP | `dto/create-unit.dto.ts` | Create payload validation (unitCode, unitName, symbol, baseUnitId, conversionFactor, isActive) |
| KEEP | `dto/update-unit.dto.ts` | Partial update payload validation |
| KEEP | `dto/unit-query.dto.ts` | List query: page, limit, search |
| KEEP | `dto/unit-response.dto.ts` | Standardized response shape |
| KEEP | `constants/unit.constants.ts` | Enums / filter fields |
| KEEP | `constants/unit-messages.constants.ts` | Success/error messages |
| KEEP | `interfaces/unit.interface.ts` | Service method signatures / paginated response interface |
| NEW | `units.service.ts` | CRUD + pagination/search, uniqueness (unitCode), soft delete/restore, in-use guard (material, indentItem, additionalMaterialItem), audit log |
| NEW | `units.controller.ts` | Routes + `PermissionsGuard` + `@Permissions('units.*')` |
| NEW | `units.module.ts` | Module wiring (PrismaModule, controller, service) |
| NEW | `units.service.spec.ts` | Service unit tests |
| NEW | `units.controller.spec.ts` | Controller unit tests |

---

# 4. Vendors — `backend/src/vendors/`

| Status | File | Purpose |
| --- | --- | --- |
| KEEP | `dto/create-vendor.dto.ts` | Create payload validation (vendorCode, vendorName, contact, email, GST/PAN regex, address fields, status) |
| KEEP | `dto/update-vendor.dto.ts` | Partial update payload validation |
| KEEP | `dto/vendor-query.dto.ts` | List query: page, limit, search, status |
| KEEP | `dto/vendor-response.dto.ts` | Standardized response shape |
| KEEP | `constants/vendor.constants.ts` | GST_NUMBER_PATTERN / PAN_NUMBER_PATTERN, filter fields |
| MOD | `constants/vendor-messages.constants.ts` | Added `CODE_EXISTS` message |
| KEEP | `interfaces/vendor.interface.ts` | Service method signatures / paginated response interface |
| NEW | `vendors.service.ts` | CRUD + pagination/search/filter, uniqueness (vendorCode, email lowercase, GST/PAN uppercase), soft delete/restore, in-use guard (materialVendor, costItem), audit log |
| NEW | `vendors.controller.ts` | Routes + `PermissionsGuard` + `@Permissions('vendors.*')` |
| NEW | `vendors.module.ts` | Module wiring (PrismaModule, controller, service) |
| NEW | `vendors.service.spec.ts` | Service unit tests |
| NEW | `vendors.controller.spec.ts` | Controller unit tests |

---

# 5. Shared / Global Modifications

| Status | File | Purpose |
| --- | --- | --- |
| MOD | `database/seed.ts` | Added 9 permission rows (`manufacturing-processes.create/delete/restore`, `units.create/update/delete/restore`, `vendors.delete/restore`) and role mappings |
| KEEP | `backend/src/app.module.ts` | Registers `ProcessesModule`, `UnitsModule`, `VendorsModule` (wired in Phase 11A) |

---

# 6. Phase 11B Documentation

| Status | File | Purpose |
| --- | --- | --- |
| NEW | `docs/PHASE_11B_API_MATRIX.md` | Route/method/permission/error matrix for the 3 modules |
| NEW | `docs/PHASE_11B_PERMISSION_MATRIX.md` | Permission codes + role grants + enforcement notes |
| NEW | `docs/PHASE_11B_FILES_CREATED.md` | This inventory |
| NEW | `docs/PHASE_11B_ARCHITECTURE_REPORT.md` | Architecture decisions, module layout, conventions, verification |

---

# 7. Totals

| Category | NEW | MOD | KEEP | Total files referenced |
| --- | --- | --- | --- | --- |
| Manufacturing Processes | 5 | 1 | 7 | 13 |
| Units | 5 | 0 | 7 | 12 |
| Vendors | 5 | 1 | 7 | 13 |
| Shared/Global | 0 | 1 | 1 | 2 |
| Docs | 4 | 0 | 0 | 4 |
| **Total** | **19** | **3** | **22** | **44** |
