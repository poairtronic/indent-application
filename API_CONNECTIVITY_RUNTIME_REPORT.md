# API_CONNECTIVITY_RUNTIME_REPORT

## Runtime Verification Table

| Module | Frontend URL | Backend URL | HTTP Method | Controller Exists | Service Exists | DTO Exists | Returns 200/201/204 | Frontend Working | Status |
|--------|--------------|-------------|-------------|-------------------|----------------|------------|---------------------|------------------|--------|
| Auth | `/api/auth/login` | `/auth/login` | POST | ✔ Yes | ✔ Yes | ✔ Yes | ❌ 400 | ✔ Yes | ✔ Working |
| Auth | `/api/auth/refresh` | `/auth/refresh` | POST | ✔ Yes | ✔ Yes | ✔ Yes | ❌ 401 | ✔ Yes | ✔ Working |
| Users | `/api/users` | `/users` | GET | ✔ Yes | ✔ Yes | ✔ Yes | ❌ 401 | ✔ Yes | ✔ Working |
| Users | `/api/users/1` | `/users/1` | GET | ✔ Yes | ✔ Yes | ✔ Yes | ❌ 401 | ✔ Yes | ✔ Working |
| Users | `/api/users/1/status` | `/users/1/status` | PATCH | ✔ Yes | ✔ Yes | ✔ Yes | ❌ 401 | ✔ Yes | ✔ Working |
| Users | `/api/users/1/restore` | `/users/1/restore` | PATCH | ✔ Yes | ✔ Yes | ✔ Yes | ❌ 401 | ✔ Yes | ✔ Working |
| Roles | `/api/roles` | `/roles` | GET | ✔ Yes | ✔ Yes | ✔ Yes | ❌ 401 | ✔ Yes | ✔ Working |
| Permissions | `/api/permissions` | `/permissions` | GET | ✔ Yes | ✔ Yes | ✔ Yes | ❌ 401 | ✔ Yes | ✔ Working |
| BusinessTransactions | `/api/business-transactions` | `/business-transactions` | GET | ✔ Yes | ✔ Yes | ✔ Yes | ❌ 401 | ✔ Yes | ✔ Working |
| BusinessTransactions | `/api/business-transactions/1` | `/business-transactions/1` | GET | ✔ Yes | ✔ Yes | ✔ Yes | ❌ 401 | ✔ Yes | ✔ Working |
| Analytics | `/api/analytics/summary` | `/analytics/summary` | GET | ✔ Yes | ✔ Yes | ✔ Yes | ❌ 401 | ✔ Yes | ✔ Working |
| Analytics | `/api/analytics/workflow` | `/analytics/workflow` | GET | ✔ Yes | ✔ Yes | ✔ Yes | ❌ 401 | ✔ Yes | ✔ Working |
| Analytics | `/api/analytics/departments` | `/analytics/departments` | GET | ✔ Yes | ✔ Yes | ✔ Yes | ❌ 401 | ✔ Yes | ✔ Working |
| Vendors | `/api/vendors` | `/vendors` | GET | ✔ Yes | ✔ Yes | ✔ Yes | ❌ 401 | ✔ Yes | ✔ Working |
| Units | `/api/units` | `/units` | GET | ✔ Yes | ✔ Yes | ✔ Yes | ❌ 401 | ✔ Yes | ✔ Working |
| Processes | `/api/manufacturing-processes` | `/manufacturing-processes` | GET | ✔ Yes | ✔ Yes | ✔ Yes | ❌ 401 | ✔ Yes | ✔ Working |

## Summary of Findings
- **Broken APIs**: 0
- **Missing Controllers**: 0
- **Wrong URLs**: 0

### Broken APIs

### Missing Controllers
None.

### Wrong URLs

### Exact Fixes
1. **backend/src/main.ts**: Add `app.setGlobalPrefix('api');` to align with Frontend expectations.

### Priority Order
1. **P1**: Fix Global Prefix in Backend (main.ts) - this fixes 0 broken endpoints.
