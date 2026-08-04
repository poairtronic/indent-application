# API_CONNECTIVITY_RUNTIME_REPORT

## Runtime Verification Table

| Module | Frontend URL | Backend URL | HTTP Method | Controller Exists | Service Exists | DTO Exists | Returns 200/201/204 | Frontend Working | Status |
|--------|--------------|-------------|-------------|-------------------|----------------|------------|---------------------|------------------|--------|
| Auth | `/api/auth/login` | `/auth/login` | POST | ✔ Yes | ✔ Yes | ✔ Yes | ❌ 404 | ❌ No | ❌ P1 - Controller Exists but URL differs (Missing /api prefix) |
| Auth | `/api/auth/refresh` | `/auth/refresh` | POST | ✔ Yes | ✔ Yes | ✔ Yes | ❌ 404 | ❌ No | ❌ P1 - Controller Exists but URL differs (Missing /api prefix) |
| Users | `/api/users` | `/users` | GET | ✔ Yes | ✔ Yes | ✔ Yes | ❌ 404 | ❌ No | ❌ P1 - Controller Exists but URL differs (Missing /api prefix) |
| Users | `/api/users/1` | `/users/1` | GET | ✔ Yes | ✔ Yes | ✔ Yes | ❌ 404 | ❌ No | ❌ P1 - Controller Exists but URL differs (Missing /api prefix) |
| Users | `/api/users/1/status` | `/users/1/status` | PATCH | ✔ Yes | ✔ Yes | ✔ Yes | ❌ 404 | ❌ No | ❌ P1 - Controller Exists but URL differs (Missing /api prefix) |
| Users | `/api/users/1/restore` | `/users/1/restore` | PATCH | ✔ Yes | ✔ Yes | ✔ Yes | ❌ 404 | ❌ No | ❌ P1 - Controller Exists but URL differs (Missing /api prefix) |
| Roles | `/api/roles` | `/roles` | GET | ✔ Yes | ✔ Yes | ✔ Yes | ❌ 404 | ❌ No | ❌ P1 - Controller Exists but URL differs (Missing /api prefix) |
| Permissions | `/api/permissions` | `/permissions` | GET | ✔ Yes | ✔ Yes | ✔ Yes | ❌ 404 | ❌ No | ❌ P1 - Controller Exists but URL differs (Missing /api prefix) |
| Indents | `/api/indents` | `/indents` | GET | ✔ Yes | ✔ Yes | ✔ Yes | ❌ 404 | ❌ No | ❌ P1 - Controller Exists but URL differs (Missing /api prefix) |
| Indents | `/api/indents/1` | `/indents/1` | GET | ✔ Yes | ✔ Yes | ✔ Yes | ❌ 404 | ❌ No | ❌ P1 - Controller Exists but URL differs (Missing /api prefix) |
| Indents | `/api/indents/1/status` | `/indents/1/status` | PATCH | ✔ Yes | ✔ Yes | ✔ Yes | ❌ 404 | ❌ No | ❌ P1 - Controller Exists but URL differs (Missing /api prefix) |
| BusinessTransactions | `/api/business-transactions` | `/business-transactions` | GET | ✔ Yes | ✔ Yes | ✔ Yes | ❌ 404 | ❌ No | ❌ P1 - Controller Exists but URL differs (Missing /api prefix) |
| BusinessTransactions | `/api/business-transactions/1` | `/business-transactions/1` | GET | ✔ Yes | ✔ Yes | ✔ Yes | ❌ 404 | ❌ No | ❌ P1 - Controller Exists but URL differs (Missing /api prefix) |
| Analytics | `/api/analytics/summary` | `/analytics/summary` | GET | ✔ Yes | ✔ Yes | ✔ Yes | ❌ 404 | ❌ No | ❌ P1 - Controller Exists but URL differs (Missing /api prefix) |
| Analytics | `/api/analytics/workflow` | `/analytics/workflow` | GET | ✔ Yes | ✔ Yes | ✔ Yes | ❌ 404 | ❌ No | ❌ P1 - Controller Exists but URL differs (Missing /api prefix) |
| Analytics | `/api/analytics/departments` | `/analytics/departments` | GET | ✔ Yes | ✔ Yes | ✔ Yes | ❌ 404 | ❌ No | ❌ P1 - Controller Exists but URL differs (Missing /api prefix) |
| Vendors | `/api/vendors` | `/vendors` | GET | ✔ Yes | ✔ Yes | ✔ Yes | ❌ 404 | ❌ No | ❌ P1 - Controller Exists but URL differs (Missing /api prefix) |
| Units | `/api/units` | `/units` | GET | ✔ Yes | ✔ Yes | ✔ Yes | ❌ 404 | ❌ No | ❌ P1 - Controller Exists but URL differs (Missing /api prefix) |
| Processes | `/api/manufacturing-processes` | `/manufacturing-processes` | GET | ✔ Yes | ✔ Yes | ✔ Yes | ❌ 404 | ❌ No | ❌ P1 - Controller Exists but URL differs (Missing /api prefix) |

## Summary of Findings
- **Broken APIs**: 19
- **Missing Controllers**: 0
- **Wrong URLs**: 19

### Broken APIs
- Auth - `/api/auth/login` (Frontend expects `/api`, Backend lacks global prefix)
- Auth - `/api/auth/refresh` (Frontend expects `/api`, Backend lacks global prefix)
- Users - `/api/users` (Frontend expects `/api`, Backend lacks global prefix)
- Users - `/api/users/1` (Frontend expects `/api`, Backend lacks global prefix)
- Users - `/api/users/1/status` (Frontend expects `/api`, Backend lacks global prefix)
- Users - `/api/users/1/restore` (Frontend expects `/api`, Backend lacks global prefix)
- Roles - `/api/roles` (Frontend expects `/api`, Backend lacks global prefix)
- Permissions - `/api/permissions` (Frontend expects `/api`, Backend lacks global prefix)
- Indents - `/api/indents` (Frontend expects `/api`, Backend lacks global prefix)
- Indents - `/api/indents/1` (Frontend expects `/api`, Backend lacks global prefix)
- Indents - `/api/indents/1/status` (Frontend expects `/api`, Backend lacks global prefix)
- BusinessTransactions - `/api/business-transactions` (Frontend expects `/api`, Backend lacks global prefix)
- BusinessTransactions - `/api/business-transactions/1` (Frontend expects `/api`, Backend lacks global prefix)
- Analytics - `/api/analytics/summary` (Frontend expects `/api`, Backend lacks global prefix)
- Analytics - `/api/analytics/workflow` (Frontend expects `/api`, Backend lacks global prefix)
- Analytics - `/api/analytics/departments` (Frontend expects `/api`, Backend lacks global prefix)
- Vendors - `/api/vendors` (Frontend expects `/api`, Backend lacks global prefix)
- Units - `/api/units` (Frontend expects `/api`, Backend lacks global prefix)
- Processes - `/api/manufacturing-processes` (Frontend expects `/api`, Backend lacks global prefix)

### Missing Controllers
None.

### Wrong URLs
- Auth - `/api/auth/login` (Frontend) vs `/auth/login` (Backend)
- Auth - `/api/auth/refresh` (Frontend) vs `/auth/refresh` (Backend)
- Users - `/api/users` (Frontend) vs `/users` (Backend)
- Users - `/api/users/1` (Frontend) vs `/users/1` (Backend)
- Users - `/api/users/1/status` (Frontend) vs `/users/1/status` (Backend)
- Users - `/api/users/1/restore` (Frontend) vs `/users/1/restore` (Backend)
- Roles - `/api/roles` (Frontend) vs `/roles` (Backend)
- Permissions - `/api/permissions` (Frontend) vs `/permissions` (Backend)
- Indents - `/api/indents` (Frontend) vs `/indents` (Backend)
- Indents - `/api/indents/1` (Frontend) vs `/indents/1` (Backend)
- Indents - `/api/indents/1/status` (Frontend) vs `/indents/1/status` (Backend)
- BusinessTransactions - `/api/business-transactions` (Frontend) vs `/business-transactions` (Backend)
- BusinessTransactions - `/api/business-transactions/1` (Frontend) vs `/business-transactions/1` (Backend)
- Analytics - `/api/analytics/summary` (Frontend) vs `/analytics/summary` (Backend)
- Analytics - `/api/analytics/workflow` (Frontend) vs `/analytics/workflow` (Backend)
- Analytics - `/api/analytics/departments` (Frontend) vs `/analytics/departments` (Backend)
- Vendors - `/api/vendors` (Frontend) vs `/vendors` (Backend)
- Units - `/api/units` (Frontend) vs `/units` (Backend)
- Processes - `/api/manufacturing-processes` (Frontend) vs `/manufacturing-processes` (Backend)

### Exact Fixes
1. **backend/src/main.ts**: Add `app.setGlobalPrefix('api');` to align with Frontend expectations.

### Priority Order
1. **P1**: Fix Global Prefix in Backend (main.ts) - this fixes 19 broken endpoints.
