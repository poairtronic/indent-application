# API_CONNECTIVITY_RUNTIME_REPORT

## Runtime Verification Table

| Module | Frontend URL | Backend URL | HTTP Method | Controller Exists | Service Exists | DTO Exists | Returns 200/201/204 | Frontend Working | Status |
|--------|--------------|-------------|-------------|-------------------|----------------|------------|---------------------|------------------|--------|
| Auth | `/api/auth/login` | `/auth/login` | POST | ❌ No | ✔ Yes | ✔ Yes | ❌ Network Error | ❌ No | ❌ P0 Critical - Controller Missing |
| Auth | `/api/auth/refresh` | `/auth/refresh` | POST | ❌ No | ✔ Yes | ✔ Yes | ❌ Network Error | ❌ No | ❌ P0 Critical - Controller Missing |
| Users | `/api/users` | `/users` | GET | ❌ No | ✔ Yes | ✔ Yes | ❌ Network Error | ❌ No | ❌ P0 Critical - Controller Missing |
| Users | `/api/users/1` | `/users/1` | GET | ❌ No | ✔ Yes | ✔ Yes | ❌ Network Error | ❌ No | ❌ P0 Critical - Controller Missing |
| Users | `/api/users/1/status` | `/users/1/status` | PATCH | ❌ No | ✔ Yes | ✔ Yes | ❌ Network Error | ❌ No | ❌ P0 Critical - Controller Missing |
| Users | `/api/users/1/restore` | `/users/1/restore` | PATCH | ❌ No | ✔ Yes | ✔ Yes | ❌ Network Error | ❌ No | ❌ P0 Critical - Controller Missing |
| Roles | `/api/roles` | `/roles` | GET | ❌ No | ✔ Yes | ✔ Yes | ❌ Network Error | ❌ No | ❌ P0 Critical - Controller Missing |
| Permissions | `/api/permissions` | `/permissions` | GET | ❌ No | ✔ Yes | ✔ Yes | ❌ Network Error | ❌ No | ❌ P0 Critical - Controller Missing |
| Indents | `/api/indents` | `/indents` | GET | ❌ No | ✔ Yes | ✔ Yes | ❌ Network Error | ❌ No | ❌ P0 Critical - Controller Missing |
| Indents | `/api/indents/1` | `/indents/1` | GET | ❌ No | ✔ Yes | ✔ Yes | ❌ Network Error | ❌ No | ❌ P0 Critical - Controller Missing |
| Indents | `/api/indents/1/status` | `/indents/1/status` | PATCH | ❌ No | ✔ Yes | ✔ Yes | ❌ Network Error | ❌ No | ❌ P0 Critical - Controller Missing |
| BusinessTransactions | `/api/business-transactions` | `/business-transactions` | GET | ❌ No | ✔ Yes | ✔ Yes | ❌ Network Error | ❌ No | ❌ P0 Critical - Controller Missing |
| BusinessTransactions | `/api/business-transactions/1` | `/business-transactions/1` | GET | ❌ No | ✔ Yes | ✔ Yes | ❌ Network Error | ❌ No | ❌ P0 Critical - Controller Missing |
| Analytics | `/api/analytics/summary` | `/analytics/summary` | GET | ❌ No | ✔ Yes | ✔ Yes | ❌ Network Error | ❌ No | ❌ P0 Critical - Controller Missing |
| Analytics | `/api/analytics/workflow` | `/analytics/workflow` | GET | ❌ No | ✔ Yes | ✔ Yes | ❌ Network Error | ❌ No | ❌ P0 Critical - Controller Missing |
| Analytics | `/api/analytics/departments` | `/analytics/departments` | GET | ❌ No | ✔ Yes | ✔ Yes | ❌ Network Error | ❌ No | ❌ P0 Critical - Controller Missing |
| Vendors | `/api/vendors` | `/vendors` | GET | ❌ No | ✔ Yes | ✔ Yes | ❌ Network Error | ❌ No | ❌ P0 Critical - Controller Missing |
| Units | `/api/units` | `/units` | GET | ❌ No | ✔ Yes | ✔ Yes | ❌ Network Error | ❌ No | ❌ P0 Critical - Controller Missing |
| Processes | `/api/manufacturing-processes` | `/manufacturing-processes` | GET | ❌ No | ✔ Yes | ✔ Yes | ❌ Network Error | ❌ No | ❌ P0 Critical - Controller Missing |

## Summary of Findings
- **Broken APIs**: 19
- **Missing Controllers**: 19
- **Wrong URLs**: 0

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
- Auth - `/auth/login`
- Auth - `/auth/refresh`
- Users - `/users`
- Users - `/users/1`
- Users - `/users/1/status`
- Users - `/users/1/restore`
- Roles - `/roles`
- Permissions - `/permissions`
- Indents - `/indents`
- Indents - `/indents/1`
- Indents - `/indents/1/status`
- BusinessTransactions - `/business-transactions`
- BusinessTransactions - `/business-transactions/1`
- Analytics - `/analytics/summary`
- Analytics - `/analytics/workflow`
- Analytics - `/analytics/departments`
- Vendors - `/vendors`
- Units - `/units`
- Processes - `/manufacturing-processes`

### Wrong URLs

### Exact Fixes
1. **backend/src/main.ts**: Add `app.setGlobalPrefix('api');` to align with Frontend expectations.

### Priority Order
1. **P1**: Fix Global Prefix in Backend (main.ts) - this fixes 0 broken endpoints.
