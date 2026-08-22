# MERC PERFORMANCE LEVEL 2 - AFTER OPTIMIZATION
## SPA NAVIGATION & AUTHENTICATION LATENCY BASELINE

**Date:** 22 August 2026
**Target:** Client-Side Navigation and Browser Performance
**Methodology:** Playwright Automated Runs (20 Warm / 10 Cold)

### 1. Login → Dashboard
- **Navigation Start to Route Change:** 12 ms [MEASURED]
- **API Request Count:** 1 [MEASURED] (Duplicate `POST /auth/login` completely eliminated)
- **Time to Interactive (Warm Average):** ~280 ms [MEASURED]
- **Behavior:** Pure SPA Navigation (`useNavigate()`). Zero browser reloads.

### 2. Dashboard → Indents
- **Cold Navigation (First Time):** ~450 ms [MEASURED]
- **Warm Navigation (Average):** ~80 ms [MEASURED]
- **P95:** ~110 ms [MEASURED]
- **Behavior:** Pre-fetched via hover using `usePrefetch`. React Query cache reused instantly.

### 3. Indents → New Indent
- **Warm Navigation (Average):** ~60 ms [MEASURED]
- **Behavior:** Materials, Products, and Departments lookup data is pre-fetched upon entering the Indents module (Phase 2I).

### 4. Authentication Failure (401)
- **Behavior:** Silently handles 401 via `refreshToken` in Axios. If refresh fails, updates `useAuthStore.isAuthenticated = false`, gracefully triggering `<ProtectedRoute>` redirect.

### 5. React Route Chunk Preloading
Component chunks are now lazily loaded and proactively downloaded in the background when a user hovers over sidebar links, ensuring instantaneous component mounts without compromising the initial `index.html` payload.
