/**
 * Phase 15B - Consolidated Analytics Hooks
 * Re-exports from enterprise API services layer (Single Responsibility Principle)
 */

export {
  useAnalyticsSummary,
  useWorkflowAnalytics,
  useDepartmentAnalytics,
  useCostAnalytics,
  useProductAnalytics,
  useVendorAnalytics,
  useVendorProcessAllocations,
  useKpis,
  useInsights,
  useDashboardOverview,
} from '../../../api/services/analytics/hooks';
