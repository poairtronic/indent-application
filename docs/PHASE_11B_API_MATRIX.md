# PHASE 11B — API MATRIX
## Enterprise Manufacturing Indent & Costing Management System (IMCMS)

**Project:** Enterprise Manufacturing Indent & Costing Management System (IMCMS)
**Document Type:** Master Modules API Matrix
**Phase:** 11B — Approved Master Modules Backend Implementation
**Version:** 1.0
**Status:** Approved

---

# 1. Conventions

- Base path: `/api` (configured via `SET_PREFIX` in `backend/src/main.ts`).
- Every endpoint is protected by global `JwtAuthGuard` (APP_GUARD) plus the controller-level `JwtAuthGuard` + `PermissionsGuard`.
- All responses pass through `TransformInterceptor` → `{ success, message, data }`.
- All errors pass through `GlobalExceptionFilter`.
- `:id` is a UUID v4 validated with `ParseUUIDPipe`.
- All list endpoints return `{ items, total, page, limit, totalPages }`.

---

# 2. Manufacturing Processes — `/api/manufacturing-processes`

| # | Method | Path | Permission | Purpose | Success | Errors |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | `POST` | `/api/manufacturing-processes` | `manufacturing-processes.create` | Create a manufacturing process | 201 Created | 400 Invalid product/data · 409 Code/sequence conflict |
| 2 | `GET` | `/api/manufacturing-processes` | `manufacturing-processes.view` | Paginated list with search, `productId` and `status` filters | 200 | — |
| 3 | `GET` | `/api/manufacturing-processes/:id` | `manufacturing-processes.view` | Get one process by UUID | 200 | 404 Not found |
| 4 | `PATCH` | `/api/manufacturing-processes/:id` | `manufacturing-processes.update` | Update process details | 200 | 400 Invalid product · 404 Not found · 409 Conflict |
| 5 | `DELETE` | `/api/manufacturing-processes/:id` | `manufacturing-processes.delete` | Soft delete a process | 200 | 400 In use · 404 Not found |
| 6 | `PATCH` | `/api/manufacturing-processes/:id/restore` | `manufacturing-processes.restore` | Restore a soft-deleted process | 200 | 404 Not found |

**List filters:** `page`, `limit`, `search` (processCode/processName), `productId`, `status`.

---

# 3. Units — `/api/units`

| # | Method | Path | Permission | Purpose | Success | Errors |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | `POST` | `/api/units` | `units.create` | Create a unit of measure | 201 Created | 409 Duplicate code |
| 2 | `GET` | `/api/units` | `units.view` | Paginated list with search | 200 | — |
| 3 | `GET` | `/api/units/:id` | `units.view` | Get one unit by UUID | 200 | 404 Not found |
| 4 | `PATCH` | `/api/units/:id` | `units.update` | Update unit details | 200 | 404 Not found · 409 Duplicate code |
| 5 | `DELETE` | `/api/units/:id` | `units.delete` | Soft delete a unit | 200 | 400 In use · 404 Not found |
| 6 | `PATCH` | `/api/units/:id/restore` | `units.restore` | Restore a soft-deleted unit | 200 | 404 Not found |

**List filters:** `page`, `limit`, `search` (unitCode/unitName/symbol).

---

# 4. Vendors — `/api/vendors`

| # | Method | Path | Permission | Purpose | Success | Errors |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | `POST` | `/api/vendors` | `vendors.create` | Create a vendor | 201 Created | 400 Invalid data / GST-PAN format · 409 Duplicate code/email/GST/PAN |
| 2 | `GET` | `/api/vendors` | `vendors.view` | Paginated list with search and `status` filter | 200 | — |
| 3 | `GET` | `/api/vendors/:id` | `vendors.view` | Get one vendor by UUID | 200 | 404 Not found |
| 4 | `PATCH` | `/api/vendors/:id` | `vendors.update` | Update vendor details | 200 | 404 Not found · 409 Duplicate code/email/GST/PAN |
| 5 | `DELETE` | `/api/vendors/:id` | `vendors.delete` | Soft delete a vendor | 200 | 400 In use · 404 Not found |
| 6 | `PATCH` | `/api/vendors/:id/restore` | `vendors.restore` | Restore a soft-deleted vendor | 200 | 404 Not found |

**List filters:** `page`, `limit`, `search` (vendorCode/vendorName/email/gstNumber), `status`.

---

# 5. Response DTO Shape

Each endpoint returns the module response DTO (`ProcessResponseDto`, `UnitResponseDto`, `VendorResponseDto`) wrapped by `TransformInterceptor`:

```json
{
  "success": true,
  "message": "Operation completed successfully.",
  "data": { }
}
```

List endpoints return the pagination envelope inside `data`.
