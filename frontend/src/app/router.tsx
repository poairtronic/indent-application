import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { ProtectedRoute } from '../components/common/ProtectedRoute';
import { LoginPage } from '../pages/auth/LoginPage';
import { ForgotPasswordPage } from '../pages/auth/ForgotPasswordPage';
import { ResetPasswordPage } from '../pages/auth/ResetPasswordPage';
import { ChangePasswordPage } from '../pages/auth/ChangePasswordPage';
import { ProfilePage } from '../pages/auth/ProfilePage';
import { DashboardPage } from '../pages/DashboardPage';
import { UnauthorizedPage } from '../pages/UnauthorizedPage';
import { DashboardLayout } from '../components/layout/DashboardLayout';

const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return !isAuthenticated ? <>{children}</> : <Navigate to="/dashboard" replace />;
};

export const AppRouter: React.FC = () => {
  return (
    <Routes>
      <Route
        path="/login"
        element={
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        }
      />
      <Route
        path="/forgot-password"
        element={
          <PublicRoute>
            <ForgotPasswordPage />
          </PublicRoute>
        }
      />
      <Route
        path="/reset-password"
        element={
          <PublicRoute>
            <ResetPasswordPage />
          </PublicRoute>
        }
      />

      <Route path="/unauthorized" element={<UnauthorizedPage />} />

      <Route
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<DashboardPage />} />

        <Route
          path="/profile"
          element={
            <ProfilePage />
          }
        />
        <Route
          path="/change-password"
          element={
            <ChangePasswordPage />
          }
        />

        <Route
          path="/indents"
          element={
            <ProtectedRoute permissions={['indent.view']}>
              <div className="text-white p-8 text-center text-xl">Indents Module (Coming Soon)</div>
            </ProtectedRoute>
          }
        />
        <Route
          path="/cost-sheets"
          element={
            <ProtectedRoute permissions={['costsheet.view']}>
              <div className="text-white p-8 text-center text-xl">Cost Sheets Module (Coming Soon)</div>
            </ProtectedRoute>
          }
        />
        <Route
          path="/workflow"
          element={
            <ProtectedRoute permissions={['workflow.view']}>
              <div className="text-white p-8 text-center text-xl">Workflow Module (Coming Soon)</div>
            </ProtectedRoute>
          }
        />
        <Route
          path="/production"
          element={
            <ProtectedRoute permissions={['production.view']}>
              <div className="text-white p-8 text-center text-xl">Production Module (Coming Soon)</div>
            </ProtectedRoute>
          }
        />
        <Route
          path="/inventory"
          element={
            <ProtectedRoute permissions={['inventory.view']}>
              <div className="text-white p-8 text-center text-xl">Inventory Module (Coming Soon)</div>
            </ProtectedRoute>
          }
        />
        <Route
          path="/materials"
          element={
            <ProtectedRoute permissions={['materials.view']}>
              <div className="text-white p-8 text-center text-xl">Materials Module (Coming Soon)</div>
            </ProtectedRoute>
          }
        />
        <Route
          path="/products"
          element={
            <ProtectedRoute permissions={['products.view']}>
              <div className="text-white p-8 text-center text-xl">Products Module (Coming Soon)</div>
            </ProtectedRoute>
          }
        />
        <Route
          path="/vendors"
          element={
            <ProtectedRoute permissions={['vendors.view']}>
              <div className="text-white p-8 text-center text-xl">Vendors Module (Coming Soon)</div>
            </ProtectedRoute>
          }
        />
        <Route
          path="/reports"
          element={
            <ProtectedRoute permissions={['reports.view']}>
              <div className="text-white p-8 text-center text-xl">Reports Module (Coming Soon)</div>
            </ProtectedRoute>
          }
        />
        <Route
          path="/analytics"
          element={
            <ProtectedRoute permissions={['analytics.view']}>
              <div className="text-white p-8 text-center text-xl">Analytics Module (Coming Soon)</div>
            </ProtectedRoute>
          }
        />
        <Route
          path="/users"
          element={
            <ProtectedRoute permissions={['users.view']}>
              <div className="text-white p-8 text-center text-xl">Users Module (Coming Soon)</div>
            </ProtectedRoute>
          }
        />
        <Route
          path="/roles"
          element={
            <ProtectedRoute permissions={['roles.view']}>
              <div className="text-white p-8 text-center text-xl">Roles Module (Coming Soon)</div>
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute permissions={['settings.manage']}>
              <div className="text-white p-8 text-center text-xl">Settings (Coming Soon)</div>
            </ProtectedRoute>
          }
        />
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};
