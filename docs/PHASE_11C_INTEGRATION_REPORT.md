# PHASE 11C — INTEGRATION REPORT
## Enterprise Manufacturing Indent & Costing Management System (IMCMS)

**Project:** Enterprise Manufacturing Indent & Costing Management System (IMCMS)
**Document Type:** Frontend — Backend Integration Report
**Phase:** 11C — Approved Master Modules Frontend Implementation
**Version:** 1.0
**Status:** Approved

---

# 1. Scope

Phase 11C implements the React frontend for the **three master modules approved in Phase 11A**
and fully implemented in Phase 11B (backend): **Manufacturing Processes**, **Units**, and **Vendors**.

Rejected modules (Categories, Error Types, Components) were **not** implemented in the frontend.

The backend APIs from Phase 11B are the single source of truth. No backend changes were made in
this phase.

---

# 2. Technology Stack (as required by the phase)

| Requirement | Implementation |
| --- | --- |
| React | React 19 (`react`, `react-dom`) |
| TypeScript | TypeScript ~6.0 (strict; `noUnusedLocals`/`noUnusedParameters`) |
| Tailwind | Tailwind utility-class conventions used throughout all pages/components (the project ships a pre-existing CSS-token `global.css`; no new styling system added) |
| TanStack Query | `@tanstack/react-query` v5 — `useQuery` (list/detail) + `useMutation` (create/update/delete/restore) |
| Zustand | `useAuthStore` for permissions/RBAC; `useDeletedRecords` state persisted to `sessionStorage` |
| Axios | `src/lib/axios.ts` `apiClient` with Bearer-token injection and 401 refresh-token flow |
| React Hook Form | All create/edit modals |
| Zod | All form validation schemas (mirrors backend class-validator rules) |

---

# 3. Files Created / Modified

## 3.1 Types (mirror backend DTOs exactly)

| File | Mirrors |
| --- | --- |
| `src/types/process.ts` | `ProcessResponseDto`, `CreateProcessDto`, `UpdateProcessDto`, `ProcessQueryDto` |
| `src/types/unit.ts` | `UnitResponseDto`, `CreateUnitDto`, `UpdateUnitDto`, `UnitQueryDto` |
| `src/types/vendor.ts` | `VendorResponseDto`, `CreateVendorDto`, `UpdateVendorDto`, `VendorQueryDto` |

All pagination shapes use `{ items, total, page, limit, totalPages }` matching the Phase 11B
list response. Status unions (`ProcessStatus`, `VendorStatus`) match the Prisma enums.

## 3.2 Services (axios, `apiClient`)

| File | Endpoints consumed |
| --- | --- |
| `src/services/process.service.ts` | `GET/POST /manufacturing-processes`, `GET/PATCH/DELETE /manufacturing-processes/:id`, `PATCH /manufacturing-processes/:id/restore` |
| `src/services/unit.service.ts` | `GET/POST /units`, `GET/PATCH/DELETE /units/:id`, `PATCH /units/:id/restore` |
| `src/services/vendor.service.ts` | `GET/POST /vendors`, `GET/PATCH/DELETE /vendors/:id`, `PATCH /vendors/:id/restore` |

Each service unwraps the backend `{ success, message, data }` envelope via a local `unwrap` helper
(identical to the existing `user.service.ts` pattern).

## 3.3 Query hooks (TanStack Query)

| File | Hooks |
| --- | --- |
| `src/hooks/useProcesses.ts` | `useProcesses`, `useProcess`, `useCreateProcess`, `useUpdateProcess`, `useDeleteProcess`, `useRestoreProcess` |
| `src/hooks/useUnits.ts` | `useUnits`, `useUnit`, `useCreateUnit`, `useUpdateUnit`, `useDeleteUnit`, `useRestoreUnit` |
| `src/hooks/useVendors.ts` | `useVendors`, `useVendor`, `useCreateVendor`, `useUpdateVendor`, `useDeleteVendor`, `useRestoreVendor` |

Conventions match `useUsers.ts`: exported query keys, `placeholderData: (previous) => previous`,
mutations `invalidateQueries` on the base key.

## 3.4 Shared restore infrastructure

| File | Purpose |
| --- | --- |
| `src/hooks/useDeletedRecords.ts` | Session-scoped registry of soft-deleted records (`sessionStorage`) |
| `src/components/ui/DeletedRecordsModal.tsx` | Reusable restore tray listing recently deleted records with a Restore action |

## 3.5 Module UIs

| Module | Files |
| --- | --- |
| Processes | `src/modules/processes/ProcessesPage.tsx`, `ProcessFormModal.tsx`, `ProcessDetailModal.tsx` |
| Units | `src/modules/units/UnitsPage.tsx`, `UnitFormModal.tsx`, `UnitDetailModal.tsx` |
| Vendors | `src/modules/vendors/VendorsPage.tsx`, `VendorFormModal.tsx`, `VendorDetailModal.tsx` |

## 3.6 Wiring

| File | Change |
| --- | --- |
| `src/constants/permissions.ts` | Added `PROCESSES_*`, `UNITS_*` (`manufacturing-processes.*`, `units.*`) and `VENDORS_DELETE`/`VENDORS_RESTORE` to `AppPermission` + `MODULE_PERMISSIONS` |
| `src/app/router.tsx` | Added `/manufacturing-processes` and `/units` routes; replaced Vendors "Coming Soon" placeholder with `<VendorsPage />` |
| `src/components/layout/Sidebar.tsx` | Added Manufacturing Processes + Units nav items (permission-gated); Vendors item now points at the real page |

Removed empty `.gitkeep` stubs in `src/modules/processes/` and `src/modules/vendors/`.

---

# 4. API Contract Verification (request ↔ backend DTO)

| Field | Backend DTO rule | Frontend form (Zod) | Match |
| --- | --- | --- | --- |
| process: productId | `@IsUUID(4)` | `z.uuid()` | ✅ |
| process: processCode | `@MaxLength(50)` required | `.min(1).max(50)` | ✅ |
| process: processName | `@MaxLength(150)` required | `.min(1).max(150)` | ✅ |
| process: sequence | `@IsInt() @Min(1)` | `.int().min(1)` | ✅ |
| process: estimatedHours | `@IsNumber({ maxDecimalPlaces: 2 }) @Max(999999.99)` | `.min(0.01).max(999999.99)` + 2-decimals refine | ✅ |
| process: description | `@MaxLength(5000)` optional | `.max(5000)` optional | ✅ |
| process: status | `ProcessStatus` enum | `z.enum(['ACTIVE','INACTIVE'])` | ✅ |
| unit: unitCode | `@MaxLength(20)` required | `.min(1).max(20)` | ✅ |
| unit: unitName | `@MaxLength(100)` required | `.min(1).max(100)` | ✅ |
| unit: symbol | `@MaxLength(10)` required | `.min(1).max(10)` | ✅ |
| vendor: vendorCode | `@MaxLength(50)` required | `.min(1).max(50)` | ✅ |
| vendor: vendorName | `@MaxLength(150)` required | `.min(1).max(150)` | ✅ |
| vendor: email | `@IsEmail()` `@MaxLength(150)` | `.email().max(150)`, lowercased on submit | ✅ |
| vendor: phone | `@MaxLength(20)` optional | `.max(20)` optional | ✅ |
| vendor: gstNumber | `@Matches(GST_NUMBER_PATTERN)` optional | same regex, uppercased on submit | ✅ |
| vendor: panNumber | `@Matches(PAN_NUMBER_PATTERN)` optional | same regex, uppercased on submit | ✅ |
| vendor: address/city/state/country/pincode | required + length limits | `.min(1).max(...)`, pincode regex | ✅ |
| vendor: status | `VendorStatus` enum | `z.enum([...4 values])` | ✅ |

Query params sent match the Phase 11B query DTOs exactly:
- Processes: `page`, `limit`, `search`, `productId`, `status`
- Units: `page`, `limit`, `search`
- Vendors: `page`, `limit`, `search`, `status`

Unknown params are never sent, keeping requests valid under the backend's
`ValidationPipe({ whitelist: true, forbidNonWhitelisted: true })`.

---

# 5. RBAC Integration

- Route guard: each route is wrapped in `ProtectedRoute permissions={['<module>.view']}`.
- Action guard: `useAuthStore.hasPermission` drives visibility of Create / Edit / Delete / Restore
  buttons and the Deleted-records entry point, using the new `AppPermission` constants.
- The permission strings sent to the backend match the seed permission codes
  (`manufacturing-processes.*`, `units.*`, `vendors.*`), so a user's JWT `permissions` list gates
  both navigation and server responses consistently.

Role mapping (from Phase 11B Permission Matrix):
- **Admin** — full CRUD + restore for all three modules.
- **Design Engineer** — view access to processes, units, vendors.
- **Accounts Executive** — view access to vendors only.

---

# 6. Cross-Cutting Requirements Coverage

| Requirement | Where implemented |
| --- | --- |
| List | Table view in each `XxxPage` |
| Create | `XxxFormModal` (create mode) |
| Edit | `XxxFormModal` (edit mode) |
| View | `XxxDetailModal` (row click / eye icon) |
| Delete | Row action → `ConfirmDialog` → `DELETE` endpoint |
| Restore | `DeletedRecordsModal` → `PATCH /:id/restore` |
| Search | Debounced (`useDebouncedValue`) text search |
| Pagination | Shared `Pagination` component |
| Filters | Processes (product UUID, status), Vendors (status), Units (search only — backend query DTO supports no other filter) |
| Permission-aware UI | `hasPermission` gates all actions + routes |
| Loading | `TableSkeleton` on first load; button spinners on mutations |
| Error handling | `ErrorState` + `getApiErrorMessage` + toast notifications |
| Responsive design | Mobile-first Tailwind grid/table overflow scroll; `sm:`/`lg:` breakpoints |

---

# 7. Known Integration Notes / Limitations

1. **Restore discovery.** The Phase 11B list endpoints filter out soft-deleted records
   (`isDeleted: false`) and expose no deleted-records listing endpoint. Restore therefore uses a
   session-scoped registry (`useDeletedRecords`) populated when a record is deleted in the current
   browser session. Records deleted before the session can only be restored if the record UUID is
   known. A backend enhancement (e.g. `?deleted=true` filter on the list DTOs) would enable full
   restore discovery and is recommended for a later phase.
2. **Product dropdown (Processes).** The Products backend module is not yet implemented, so no
   product-list API exists. The process form takes the `productId` as a validated UUID input
   (with inline hint) instead of a dropdown. Once Products is implemented, swap the input for a
   product options `<select>` fed by a products endpoint.
3. **`description` clear on process edit.** The backend update accepts `description: ''` to clear
   the field; the edit form sends the trimmed value as-is so clearing works.
4. **GST/PAN casing.** Inputs are uppercased on submit; validation requires uppercase, matching the
   backend `@Matches` case-sensitive patterns.
