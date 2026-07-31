# PHASE 11B — PERMISSION MATRIX
## Enterprise Manufacturing Indent & Costing Management System (IMCMS)

**Project:** Enterprise Manufacturing Indent & Costing Management System (IMCMS)
**Document Type:** Master Modules RBAC Permission Matrix
**Phase:** 11B — Approved Master Modules Backend Implementation
**Version:** 1.0
**Status:** Approved

---

# 1. Permission Definitions Added (database/seed.ts)

Phase 11A already defined `vendors.create/view/update`, `manufacturing-processes.view/update`, and `units.view`.
Phase 11B extends the seed with the following **new** permission rows (idempotent `upsert`):

| Module | Permission Code | Action | Description |
| --- | --- | --- | --- |
| Vendors | `vendors.delete` | DELETE | Delete vendors |
| Vendors | `vendors.restore` | UPDATE | Restore vendors |
| Manufacturing Processes | `manufacturing-processes.create` | CREATE | Create manufacturing processes |
| Manufacturing Processes | `manufacturing-processes.delete` | DELETE | Delete manufacturing processes |
| Manufacturing Processes | `manufacturing-processes.restore` | UPDATE | Restore manufacturing processes |
| Units | `units.create` | CREATE | Create units |
| Units | `units.update` | UPDATE | Update units |
| Units | `units.delete` | DELETE | Delete units |
| Units | `units.restore` | UPDATE | Restore units |

> **Note:** The `PermissionAction` enum (`CREATE, READ, UPDATE, DELETE, APPROVE, REJECT, ALL`) has no RESTORE value, so restore permissions use `PermissionAction.UPDATE`, mirroring the existing `users.restore` controller convention.

---

# 2. Role → Permission Grant Matrix (seed role mappings)

Legend: ✔ granted · — not granted
`Admin` is granted **all** permission codes automatically via `Object.values(permMap)`.

| Permission Code | Admin | Design Engineer | Stores Executive | Accounts Executive | Production Executive | Senior Manager | General Manager |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `manufacturing-processes.create` | ✔ | — | — | — | — | — | — |
| `manufacturing-processes.view` | ✔ | ✔ | — | — | — | — | — |
| `manufacturing-processes.update` | ✔ | — | — | — | — | — | — |
| `manufacturing-processes.delete` | ✔ | — | — | — | — | — | — |
| `manufacturing-processes.restore` | ✔ | — | — | — | — | — | — |
| `units.create` | ✔ | — | — | — | — | — | — |
| `units.view` | ✔ | ✔ | — | — | — | — | — |
| `units.update` | ✔ | — | — | — | — | — | — |
| `units.delete` | ✔ | — | — | — | — | — | — |
| `units.restore` | ✔ | — | — | — | — | — | — |
| `vendors.create` | ✔ | — | — | — | — | — | — |
| `vendors.view` | ✔ | ✔ | — | ✔ | — | — | — |
| `vendors.update` | ✔ | — | — | — | — | — | — |
| `vendors.delete` | ✔ | — | — | — | — | — | — |
| `vendors.restore` | ✔ | — | — | — | — | — | — |

**Design intent:** Master-data read access is granted to the roles that consume the data in their workflow (Design Engineer reads processes/units/vendors; Accounts Executive reads vendors for costing). All master-data mutations are restricted to the **Admin** role.

---

# 3. Enforcement

- Guards applied globally (APP_GUARD): `JwtAuthGuard` → `RolesGuard` → `PermissionsGuard`.
- Each controller also declares `@UseGuards(JwtAuthGuard, PermissionsGuard)` and `@Permissions('<module>.<action>')` per route.
- `PermissionsGuard` compares the required code (case-insensitive) against `req.user.permissions` loaded by `JwtStrategy` from the user's role → `role_permissions` → `permission.code`.
- Unauthorized / forbidden responses: 401 (missing/invalid token) and 403 (missing permission) from the guards; the `GlobalExceptionFilter` standardizes the envelope.

---

# 4. Required Seed Re-run

To activate the new permissions in an existing database, re-run the seeder (idempotent `upsert`):

```bash
npx ts-node database/seed.ts
```

Re-running adds the 9 new permission rows and maps them to the Admin role without duplicating existing data.
