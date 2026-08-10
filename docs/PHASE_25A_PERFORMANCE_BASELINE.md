# PHASE 25A - ENTERPRISE FRONTEND PERFORMANCE BASELINE

## Build Telemetry
- **Build Command:** `npm run build` (`tsc -b && vite build`)
- **Compilation Time:** ~10.16 seconds
- **Total JS Files:** 118 chunks
- **Total JS Bundle Size:** 997.14 kB
- **Initial Entry JS Chunk (`assets/index-xTDgtvDt.js`):** 308.06 kB
- **Global CSS Size (`assets/index-jCOcYkXN.css`):** 87.73 kB

## Top 10 Largest Chunks
1. `assets/index-xTDgtvDt.js` — 308.06 kB (Initial Entry Chunk)
2. `assets/schemas-BOy4MSGn.js` — 105.20 kB (Zod schemas & validation)
3. `assets/axios-CutilcvQ.js` — 44.97 kB (HTTP client library)
4. `assets/IndentDetailsPage-Q19r70aE.js` — 24.72 kB
5. `assets/ReportDetailPage-DDIFU4kN.js` — 24.26 kB
6. `assets/useQuery-dJmD0F0c.js` — 23.85 kB (React Query hooks helper)
7. `assets/CostSheetDetailsPage-LNYx_-Qh.js` — 23.17 kB
8. `assets/IndentForm-DJj4cz6U.js` — 23.07 kB
9. `assets/DashboardPage-B5AJQpFt.js` — 20.29 kB
10. `assets/UsersPage-BNhIxzvn.js` — 19.82 kB

## Major Initial Dependencies
- `react-dom` + `react` (React 19 framework core)
- `@tanstack/react-query` (Server state caching)
- `zustand` (Local store state)
- `react-router-dom` (Routing engine)
- `lucide-react` (Icon assets - imported via wildcard)

## Eagerly Loaded Layouts and Shell Components
- `AuthLayout`
- `DashboardLayout` (Sidebars, Headers)
- `SettingsLayout`
- `Header` (Breadcrumbs, Theme switcher)
- `Sidebar` (Favorites, menu items list)
- `NotificationDrawer` (Suppression criteria, relative timestamps)
- `CommandPalette` (Global navigation keyboard shortcut launcher)
