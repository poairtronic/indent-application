import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from '../components/common/ProtectedRoute';

// Loading Fallback Spinner
const LoadingFallback = () => (
  <div className="w-full h-full flex flex-col items-center justify-center p-12 min-h-[400px] font-sans">
    <div className="w-10 h-10 border-4 border-t-accent-primary border-border-default rounded-full animate-spin mb-4" />
    <p className="text-xs text-text-muted font-medium tracking-wide animate-pulse">
      Loading interface components...
    </p>
  </div>
);

const suspended = (Component: React.LazyExoticComponent<React.FC<any>>) => (
  <Suspense fallback={<LoadingFallback />}>
    <Component />
  </Suspense>
);

// Lazy Loaded Layout Components
const AuthLayout = lazy(() =>
  import('../components/layout/AuthLayout').then((m: any) => ({
    default: m.AuthLayout || m.default,
  })),
);
const DashboardLayout = lazy(() =>
  import('../components/layout/DashboardLayout').then((m: any) => ({
    default: m.DashboardLayout || m.default,
  })),
);
const SettingsLayout = lazy(() =>
  import('../components/layout/SettingsLayout').then((m: any) => ({
    default: m.SettingsLayout || m.default,
  })),
);

// Lazy Loaded Page Components
const LoginPage = lazy(() =>
  import('../pages/auth/LoginPage').then((m: any) => ({
    default: m.LoginPage || m.default,
  })),
);
const ForgotPasswordPage = lazy(() =>
  import('../pages/auth/ForgotPasswordPage').then((m: any) => ({
    default: m.ForgotPasswordPage || m.default,
  })),
);
const ResetPasswordPage = lazy(() =>
  import('../pages/auth/ResetPasswordPage').then((m: any) => ({
    default: m.ResetPasswordPage || m.default,
  })),
);
const ChangePasswordPage = lazy(() =>
  import('../pages/auth/ChangePasswordPage').then((m: any) => ({
    default: m.ChangePasswordPage || m.default,
  })),
);
const ProfilePage = lazy(() =>
  import('../pages/auth/ProfilePage').then((m: any) => ({
    default: m.ProfilePage || m.default,
  })),
);
const DashboardPage = lazy(() =>
  import('../pages/DashboardPage').then((m) => ({ default: m.DashboardPage })),
);
const UnauthorizedPage = lazy(() =>
  import('../pages/UnauthorizedPage').then((m) => ({ default: m.UnauthorizedPage })),
);
const AccountLockPage = lazy(() =>
  import('../pages/AccountLockPage').then((m) => ({ default: m.AccountLockPage })),
);
const SessionExpiredPage = lazy(() =>
  import('../pages/SessionExpiredPage').then((m) => ({ default: m.SessionExpiredPage })),
);
const SecurityDashboardPage = lazy(() =>
  import('../pages/SecurityDashboardPage').then((m) => ({ default: m.SecurityDashboardPage })),
);
const SettingsPage = lazy(() =>
  import('../pages/SettingsPage').then((m) => ({ default: m.SettingsPage })),
);
const AuditLogPage = lazy(() =>
  import('../pages/AuditLogPage').then((m) => ({ default: m.AuditLogPage })),
);
const CommunicationPage = lazy(() =>
  import('../modules/communication/CommunicationPage').then((m) => ({
    default: m.CommunicationPage,
  })),
);
const MonitoringDashboardPage = lazy(() =>
  import('../pages/MonitoringDashboardPage').then((m) => ({ default: m.MonitoringDashboardPage })),
);
const SessionManagementPage = lazy(() =>
  import('../pages/SessionManagementPage').then((m) => ({ default: m.SessionManagementPage })),
);
const LoginHistoryPage = lazy(() =>
  import('../pages/LoginHistoryPage').then((m) => ({ default: m.LoginHistoryPage })),
);
const NotFoundPage = lazy(() =>
  import('../pages/NotFoundPage').then((m) => ({ default: m.NotFoundPage })),
);
const ServerErrorPage = lazy(() =>
  import('../pages/ServerErrorPage').then((m) => ({ default: m.ServerErrorPage })),
);
const MaintenancePage = lazy(() =>
  import('../pages/MaintenancePage').then((m) => ({ default: m.MaintenancePage })),
);

// Modules
const UsersPage = lazy(() =>
  import('../modules/users/UsersPage').then((m) => ({ default: m.UsersPage })),
);
const RolesPage = lazy(() =>
  import('../modules/roles/RolesPage').then((m) => ({ default: m.RolesPage })),
);
const PermissionsPage = lazy(() =>
  import('../modules/permissions/PermissionsPage').then((m) => ({ default: m.PermissionsPage })),
);
const DepartmentsPage = lazy(() =>
  import('../modules/departments/DepartmentsPage').then((m) => ({ default: m.DepartmentsPage })),
);
const ProcessesPage = lazy(() =>
  import('../modules/processes/ProcessesPage').then((m) => ({ default: m.ProcessesPage })),
);
const UnitsPage = lazy(() =>
  import('../modules/units/UnitsPage').then((m) => ({ default: m.UnitsPage })),
);
const VendorsPage = lazy(() =>
  import('../modules/vendors/VendorsPage').then((m) => ({ default: m.VendorsPage })),
);
const ProductsMasterPage = lazy(() =>
  import('../modules/products/ProductsMasterPage').then((m) => ({ default: m.ProductsMasterPage })),
);
const MaterialsPage = lazy(() =>
  import('../modules/materials/MaterialsPage').then((m) => ({ default: m.MaterialsPage })),
);
const WorkflowPage = lazy(() =>
  import('../modules/workflow/WorkflowPage').then((m) => ({ default: m.WorkflowPage })),
);
const ProductionDashboardPage = lazy(() =>
  import('../modules/production/ProductionDashboardPage').then((m) => ({
    default: m.ProductionDashboardPage,
  })),
);
const MasterDataDashboardPage = lazy(() =>
  import('../modules/dashboard/MasterDataDashboardPage').then((m) => ({
    default: m.MasterDataDashboardPage,
  })),
);

// Indent Module Pages
const IndentDashboardPage = lazy(() =>
  import('../modules/indent/IndentDashboardPage').then((m) => ({ default: m.IndentDashboardPage })),
);
const IndentFormPage = lazy(() =>
  import('../modules/indent/IndentFormPage').then((m) => ({ default: m.IndentFormPage })),
);
const IndentDetailsPage = lazy(() =>
  import('../modules/indent/IndentDetailsPage').then((m) => ({ default: m.IndentDetailsPage })),
);

// Costing Module Pages
const CostSheetDashboardPage = lazy(() =>
  import('../modules/costing/CostSheetDashboardPage').then((m) => ({
    default: m.CostSheetDashboardPage,
  })),
);
const CostSheetDetailsPage = lazy(() =>
  import('../modules/costing/CostSheetDetailsPage').then((m) => ({
    default: m.CostSheetDetailsPage,
  })),
);

// Notification Module Pages
const NotificationsPage = lazy(() =>
  import('../modules/notifications/NotificationsPage').then((m) => ({
    default: m.NotificationsPage,
  })),
);

// Reports Module Pages
const ReportsDashboardPage = lazy(() =>
  import('../modules/reports/ReportsDashboardPage').then((m) => ({
    default: m.ReportsDashboardPage,
  })),
);
const ReportDetailPage = lazy(() =>
  import('../modules/reports/ReportDetailPage').then((m) => ({
    default: m.ReportDetailPage,
  })),
);

// Analytics Pages
const AnalyticsSummaryPage = lazy(() =>
  import('../modules/analytics/pages/SummaryPage').then((m) => ({ default: m.SummaryPage })),
);
const AnalyticsWorkflowPage = lazy(() =>
  import('../modules/analytics/pages/WorkflowPage').then((m) => ({ default: m.WorkflowPage })),
);
const AnalyticsDepartmentsPage = lazy(() =>
  import('../modules/analytics/pages/DepartmentsPage').then((m) => ({
    default: m.DepartmentsPage,
  })),
);
const AnalyticsCostsPage = lazy(() =>
  import('../modules/analytics/pages/CostsPage').then((m) => ({ default: m.CostsPage })),
);
const AnalyticsProductsPage = lazy(() =>
  import('../modules/analytics/pages/ProductsPage').then((m) => ({ default: m.ProductsPage })),
);
const AnalyticsVendorsPage = lazy(() =>
  import('../modules/analytics/pages/VendorsPage').then((m) => ({ default: m.VendorsPage })),
);

export const AppRouter: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      {/* Public Auth Routes */}
      <Route
        element={
          <Suspense fallback={<LoadingFallback />}>
            <AuthLayout />
          </Suspense>
        }
      >
        <Route path="/login" element={suspended(LoginPage)} />
        <Route path="/forgot-password" element={suspended(ForgotPasswordPage)} />
        <Route path="/reset-password" element={suspended(ResetPasswordPage)} />
      </Route>

      <Route path="/account-locked" element={suspended(AccountLockPage)} />
      <Route path="/session-expired" element={suspended(SessionExpiredPage)} />
      <Route path="/unauthorized" element={suspended(UnauthorizedPage)} />
      <Route path="/500" element={suspended(ServerErrorPage)} />
      <Route path="/maintenance" element={suspended(MaintenancePage)} />

      {/* Protected App Routes */}
      <Route
        element={
          <ProtectedRoute>
            <Suspense fallback={<LoadingFallback />}>
              <DashboardLayout />
            </Suspense>
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={suspended(DashboardPage)} />

        {/* Nested Settings Route Group */}
        <Route
          element={
            <Suspense fallback={<LoadingFallback />}>
              <SettingsLayout />
            </Suspense>
          }
        >
          <Route path="/profile" element={suspended(ProfilePage)} />
          <Route path="/change-password" element={suspended(ChangePasswordPage)} />
          <Route path="/security" element={suspended(SecurityDashboardPage)} />
          <Route path="/sessions" element={suspended(SessionManagementPage)} />
          <Route path="/login-history" element={suspended(LoginHistoryPage)} />
          <Route
            path="/settings"
            element={
              <ProtectedRoute permissions={['settings.manage']}>
                {suspended(SettingsPage)}
              </ProtectedRoute>
            }
          />
          <Route
            path="/audit-logs"
            element={
              <ProtectedRoute permissions={['audit.view']}>
                {suspended(AuditLogPage)}
              </ProtectedRoute>
            }
          />
          <Route
            path="/communication"
            element={
              <ProtectedRoute permissions={['audit.view']}>
                {suspended(CommunicationPage)}
              </ProtectedRoute>
            }
          />
          <Route
            path="/monitoring"
            element={
              <ProtectedRoute permissions={['settings.manage']}>
                {suspended(MonitoringDashboardPage)}
              </ProtectedRoute>
            }
          />
        </Route>

        {/* Business Modules */}
        <Route path="/indents">
          <Route
            index
            element={
              <ProtectedRoute permissions={['indent.view']}>
                {suspended(IndentDashboardPage)}
              </ProtectedRoute>
            }
          />
          <Route
            path="create"
            element={
              <ProtectedRoute permissions={['indent.create']}>
                {suspended(IndentFormPage)}
              </ProtectedRoute>
            }
          />
          <Route
            path=":id"
            element={
              <ProtectedRoute permissions={['indent.view']}>
                {suspended(IndentDetailsPage)}
              </ProtectedRoute>
            }
          />
          <Route
            path=":id/edit"
            element={
              <ProtectedRoute permissions={['indent.edit']}>
                {suspended(IndentFormPage)}
              </ProtectedRoute>
            }
          />
        </Route>
        <Route path="/cost-sheets">
          <Route
            index
            element={
              <ProtectedRoute permissions={['costsheet.view']}>
                {suspended(CostSheetDashboardPage)}
              </ProtectedRoute>
            }
          />
          <Route
            path=":id"
            element={
              <ProtectedRoute permissions={['costsheet.view']}>
                {suspended(CostSheetDetailsPage)}
              </ProtectedRoute>
            }
          />
        </Route>
        <Route
          path="/notifications"
          element={
            <ProtectedRoute permissions={['notifications.view']}>
              {suspended(NotificationsPage)}
            </ProtectedRoute>
          }
        />
        <Route
          path="/workflow"
          element={
            <ProtectedRoute permissions={['workflow.view']}>
              {suspended(WorkflowPage)}
            </ProtectedRoute>
          }
        />
        <Route
          path="/production"
          element={
            <ProtectedRoute permissions={['production.view']}>
              {suspended(ProductionDashboardPage)}
            </ProtectedRoute>
          }
        />
        <Route
          path="/materials"
          element={
            <ProtectedRoute permissions={['materials.view']}>
              {suspended(MaterialsPage)}
            </ProtectedRoute>
          }
        />
        <Route
          path="/products"
          element={
            <ProtectedRoute permissions={['products.view']}>
              {suspended(ProductsMasterPage)}
            </ProtectedRoute>
          }
        />
        <Route
          path="/reports"
          element={
            <ProtectedRoute permissions={['reports.view']}>
              {suspended(ReportsDashboardPage)}
            </ProtectedRoute>
          }
        />
        <Route
          path="/reports/:category/:reportId"
          element={
            <ProtectedRoute permissions={['reports.view']}>
              {suspended(ReportDetailPage)}
            </ProtectedRoute>
          }
        />
        <Route
          path="/roles"
          element={
            <ProtectedRoute permissions={['roles.view']}>{suspended(RolesPage)}</ProtectedRoute>
          }
        />
        <Route
          path="/permissions"
          element={
            <ProtectedRoute permissions={['permissions.view']}>
              {suspended(PermissionsPage)}
            </ProtectedRoute>
          }
        />

        {/* Master Data Modules */}
        <Route
          path="/manufacturing-processes"
          element={
            <ProtectedRoute permissions={['manufacturing-processes.view']}>
              {suspended(ProcessesPage)}
            </ProtectedRoute>
          }
        />
        <Route
          path="/units"
          element={
            <ProtectedRoute permissions={['units.view']}>{suspended(UnitsPage)}</ProtectedRoute>
          }
        />
        <Route
          path="/vendors"
          element={
            <ProtectedRoute permissions={['vendors.view']}>{suspended(VendorsPage)}</ProtectedRoute>
          }
        />
        <Route
          path="/users"
          element={
            <ProtectedRoute permissions={['users.view']}>{suspended(UsersPage)}</ProtectedRoute>
          }
        />
        <Route
          path="/departments"
          element={
            <ProtectedRoute permissions={['departments.view']}>
              {suspended(DepartmentsPage)}
            </ProtectedRoute>
          }
        />
        <Route
          path="/master-data"
          element={
            <ProtectedRoute permissions={['users.view']}>
              {suspended(MasterDataDashboardPage)}
            </ProtectedRoute>
          }
        />

        {/* Analytics Module */}
        <Route
          path="/analytics"
          element={
            <ProtectedRoute permissions={['analytics.view']}>
              {suspended(AnalyticsSummaryPage)}
            </ProtectedRoute>
          }
        />
        <Route
          path="/analytics/workflow"
          element={
            <ProtectedRoute permissions={['analytics.view']}>
              {suspended(AnalyticsWorkflowPage)}
            </ProtectedRoute>
          }
        />
        <Route
          path="/analytics/departments"
          element={
            <ProtectedRoute permissions={['analytics.view']}>
              {suspended(AnalyticsDepartmentsPage)}
            </ProtectedRoute>
          }
        />
        <Route
          path="/analytics/costs"
          element={
            <ProtectedRoute permissions={['analytics.view']}>
              {suspended(AnalyticsCostsPage)}
            </ProtectedRoute>
          }
        />
        <Route
          path="/analytics/products"
          element={
            <ProtectedRoute permissions={['analytics.view']}>
              {suspended(AnalyticsProductsPage)}
            </ProtectedRoute>
          }
        />
        <Route
          path="/analytics/vendors"
          element={
            <ProtectedRoute permissions={['analytics.view']}>
              {suspended(AnalyticsVendorsPage)}
            </ProtectedRoute>
          }
        />
      </Route>

      <Route path="*" element={suspended(NotFoundPage)} />
    </Routes>
  );
};
