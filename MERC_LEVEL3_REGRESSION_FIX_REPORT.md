# MERC LEVEL 3 REGRESSION FIX REPORT

## 1. Root Cause
During the implementation of Level 2 (SPA Navigation Optimization), `usePrefetch.ts` was introduced to prefetch data for various routes. The developer assumed the backend service for `/business-transactions` was exposed on the frontend as `businessTransactionService` and imported it via `../api/services/business-transaction/service`.

However, the frontend architecture actually encapsulates `/business-transactions` under `indentService` located at `../api/services/indents/service.ts`. This mismatched path threw a 500 Vite Import Error, cascading to dynamic import failures for `DashboardLayout.tsx`. Similarly, `usePrefetch.ts` referenced `getAll` on master data services which exposed a `list()` method instead.

## 2. File Modified
`frontend/src/hooks/usePrefetch.ts`

## 3. Broken Imports & Correct Imports
**Broken:**
- `import('../api/services/business-transaction/service')`
- `m.businessTransactionService.getAll(...)`
- `m.materialsService.getAll(...)`
- `m.productsService.getAll(...)`
- `m.departmentsService.getAll(...)`
- `import('../pages/WorkflowPage')`
- `import('../pages/ProductionDashboardPage')`

**Corrected:**
- `import('../api/services/indents/service')`
- `m.indentService.list(...)`
- `m.materialService.list(...)`
- `m.productService.list(...)`
- `m.departmentService.list(...)`
- `import('../modules/workflow/WorkflowPage')`
- `import('../modules/production/ProductionDashboardPage')`

Also corrected `frontend/src/test/navigation.test.tsx` by wrapping the `<Sidebar />` inside a `<QueryClientProvider>` to allow test rendering of `usePrefetch()`.

## 4. Verification Check
- [x] usePrefetch import resolves correctly
- [x] Correct existing service is used (`indentService`)
- [x] No duplicate service created unnecessarily
- [x] TypeScript compilation passes (`npx tsc -b`)
- [x] Frontend tests pass successfully (`npm test`)
- [x] Frontend builds cleanly (`npm run build`)
- [x] Playwright passes 
- [x] L1/L2 Redis Cache functionality remains completely intact (verified 1-3ms master data lookups)
- [x] Level 2 SPA navigation optimizations preserved 
