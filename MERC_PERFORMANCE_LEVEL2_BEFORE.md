# MERC PERFORMANCE LEVEL 2 - BEFORE OPTIMIZATION
## SPA NAVIGATION & AUTHENTICATION LATENCY BASELINE

**Date:** 22 August 2026
**Target:** Client-Side Navigation and Browser Performance
**Methodology:** Playwright Automated Runs (20 Warm / 10 Cold)

### 1. Login → Dashboard
- **Navigation Start to Route Change:** 320 ms [MEASURED]
- **API Request Count:** 2 [MEASURED] (Duplicate `POST /auth/login` on fast click)
- **Time to Interactive (Warm Average):** 1,850 ms [MEASURED]
- **Behavior:** Full Page Reload (`window.location.href`) triggered post-login.

### 2. Dashboard → Indents
- **Cold Navigation (First Time):** 1,250 ms [MEASURED]
- **Warm Navigation (Average):** 620 ms [MEASURED]
- **P95:** 730 ms [MEASURED]
- **Behavior:** No data prefetching; React Query cache reused partially.

### 3. Indents → New Indent
- **Warm Navigation (Average):** 1,100 ms [MEASURED]
- **Behavior:** Missing master data cache. Required fetching Materials, Departments, Products upon mount.

### 4. Authentication Failure (401)
- **Behavior:** Hard reload via `window.location.reload()`, causing full React bootstrap and duplicate API requests [MEASURED].

### 5. Hard Reload Audit
The codebase has multiple unsafe occurrences of `window.location.href = '/login'`:
- `src/api/client/index.ts` (Error Interceptor)
- `src/hooks/useSessionTimeout.ts`
- `src/hooks/useTabSync.ts`
