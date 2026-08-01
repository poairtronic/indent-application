/**
 * Phase 15B - Analytics Module Entry Point
 * Exports all dashboards pages for integration into the AppRouter.
 */

export { SummaryPage } from './pages/SummaryPage';
export { WorkflowPage } from './pages/WorkflowPage';
export { DepartmentsPage } from './pages/DepartmentsPage';
export { CostsPage } from './pages/CostsPage';
export { ProductsPage } from './pages/ProductsPage';
export { VendorsPage } from './pages/VendorsPage';
export * from './types/analytics.types';
export * from './services/analytics.service';
export * from './hooks/useAnalytics';
export * from './components/AnalyticsLayout';
export * from './components/AnalyticsCards';
export * from './components/AnalyticsCharts';
export * from './components/AnalyticsFilters';
