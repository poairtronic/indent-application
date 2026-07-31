# PHASE 11B — ARCHITECTURE REPORT
## Enterprise Manufacturing Indent & Costing Management System (IMCMS)

**Project:** Enterprise Manufacturing Indent & Costing Management System (IMCMS)
**Document Type:** Master Modules Architecture Report
**Phase:** 11B — Approved Master Modules Backend Implementation
**Version:** 1.0
**Status:** Approved

---

# 1. Scope

Phase 11B implements full backend CRUD for the **three master modules approved in Phase 11A**:
Manufacturing Processes, Units, and Vendors. The rejected modules (Categories, Error Types,
Components) are intentionally **not** implemented.

Architecture-only artifacts (DTOs, constants, interfaces, empty module skeletons) were prepared
in Phase 11A; Phase 11B fills in the Services, Controllers, Modules, and Unit Tests.

---

# 2. Module Layout

Each master module follows the same flat, feature-scoped structure used by `backend/src/users/`:

```
backend/src/<module>/
├── <module>.module.ts        # NestJS module: imports PrismaModule, declares controller+service
├── <module>.controller.ts    # Routes + RBAC guards + Swagger
├── <module>.service.ts       # Business logic, DB access, audit, soft-delete, validation
├── <module>.service.spec.ts  # Unit tests (mocked Prisma)
├── <module>.controller.spec.ts
├── dto/
│   ├── create-<module>.dto.ts
│   ├── update-<module>.dto.ts
│   ├── <module>-query.dto.ts     # pagination/search/filter
│   └── <module>-response.dto.ts
├── constants/
│   ├── <module>.constants.ts          # enums, filter fields, regex patterns
│   └── <module>-messages.constants.ts # success/error messages
└── interfaces/
    └── <module>.interface.ts          # service signatures + paginated response type
```

> Vendors has no `vendor-query`/`vendor-response` deviation — both exist. `Units` has no update/delete/restore permission DTO additions because they are action codes, not DTOs.

---

# 3. Cross-Cutting Conventions (copied from `users` module)

| Concern | Convention |
| --- | --- |
| Database access | `PrismaModule` imported per module; `PrismaService` injected; even though `PrismaModule` is `@Global`, explicit import mirrors the `users` reference |
| AuthN | Global `APP_GUARD` `JwtAuthGuard` |
| AuthZ | `@UseGuards(JwtAuthGuard, PermissionsGuard)` + `@Permissions('<module>.<action>')` on each route |
| Identity | `@CurrentUser() user` (from `JwtStrategy`), `user?.id` passed to services as performer |
| Response envelope | `TransformInterceptor` → `{ success, message, data }` |
| Errors | `GlobalExceptionFilter` + Nest built-in exceptions (400/404/409/403/401) |
| Pagination | `{ items, total, page, limit, totalPages }`; `page>=1`, `limit` capped (default 10, max 100) |
| IDs | `ParseUUIDPipe` on all `:id` routes |
| Module names | Audit `module` values: `'ManufacturingProcess'`, `'Unit'`, `'Vendor'` |
| Audit actions | `CREATE`, `UPDATE`, `DELETE`, `RESTORE`; old/new snapshots JSON-serialized in try/catch |
| Soft delete | `isDeleted: true`, `deletedAt`, `deletedBy`; list/find filters exclude soft-deleted rows |
| Restore | `isDeleted: false`, `deletedAt: null`, `updatedBy`, audited |

---

# 4. Per-Module Design Decisions

## 4.1 Manufacturing Processes

- **Validation:** `validateProduct(productId)` ensures the product exists, is not deleted, and has `status === ProductStatus.ACTIVE`.
- **Uniqueness:** `(productId, processCode)` and `(productId, sequence)` are both unique — the same process code/sequence cannot be reused under one product.
- **In-use delete guard:** block soft-delete when `indentProcess.count > 0` OR `processCost.count > 0`.
- **Query filters:** `search` (processCode/processName), `productId`, `status`.
- **Access:** Admin mutates; Admin + Design Engineer view.

## 4.2 Units

- **Uniqueness:** `unitCode` unique (case-sensitive compare via exact match on code column).
- **In-use delete guard:** block when referenced by `material`, `indentItem`, or `additionalMaterialItem`.
- **Query filters:** `search` (unitCode/unitName/symbol).
- **Access:** Admin mutates; Admin + Design Engineer view.

## 4.3 Vendors

- **Uniqueness (normalized):** `vendorCode` exact; `email` lowercased; `gstNumber`/`panNumber` uppercased before compare/store.
- **Format validation:** GST and PAN validated against `GST_NUMBER_PATTERN` / `PAN_NUMBER_PATTERN` in `constants/vendor.constants.ts`.
- **In-use delete guard:** block when referenced by `materialVendor` or `costItem`.
- **Query filters:** `search` (vendorCode/vendorName/email/gstNumber), `status`.
- **Access:** Admin mutates; Admin + Design Engineer + Accounts Executive view (Accounts reads vendors for costing).

---

# 5. Audit Trail

Every create/update/delete/restore writes a row to `AuditLog`:

```ts
await this.prisma.auditLog.create({
  data: {
    userId: performerId ?? null,
    module: 'Vendor' | 'Unit' | 'ManufacturingProcess',
    action: 'CREATE' | 'UPDATE' | 'DELETE' | 'RESTORE',
    entityId,
    oldValue: JSON.stringify(oldRecord) | null,
    newValue: JSON.stringify(newRecord) | null,
    ipAddress: null,
    userAgent: null,
  },
});
```

Serialization is wrapped in try/catch so an audit failure can never break the business operation.

---

# 6. Security

- No secrets/logs of secrets introduced; no new env keys.
- All mutation routes require a matching permission; read routes require at least the view permission.
- Uniqueness conflicts, invalid references, and in-use deletes return explicit 409 / 400 / 404 HTTP semantics rather than leaking raw Prisma errors.

---

# 7. Verification Results

| Check | Command (run in `backend/`) | Result |
| --- | --- | --- |
| Compilation | `npm run build` (nest build) | Passed — 0 errors |
| Unit tests | `npm test -- --runInBand` | 17 suites / **125 tests passed** |
| Lint | `npm run lint` | Passed — 0 errors/warnings |

Coverage added: `processes.service.spec.ts`, `processes.controller.spec.ts`, `units.service.spec.ts`,
`units.controller.spec.ts`, `vendors.service.spec.ts`, `vendors.controller.spec.ts`.

---

# 8. Out of Scope / Next

- Frontend screens and API client wiring for the three modules.
- Phase 11B stops at backend completion per the approved instruction.
- Remaining Phase 12+ features (indent lifecycle, costing, approvals) are unchanged.
