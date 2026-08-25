import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { logSecurityDenial } from '../../utils/securityLogger';

interface ProtectedRouteProps {
  children: React.ReactNode;
  permissions?: string[];
  fallbackPath?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  permissions,
  fallbackPath = '/unauthorized',
}) => {
  const isHydrating = useAuthStore((s) => s.isHydrating);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const hasAnyPermission = useAuthStore((s) => s.hasAnyPermission);
  const location = useLocation();

  if (isHydrating) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="flex flex-col items-center space-y-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="text-sm text-gray-500 dark:text-gray-400">Verifying session...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    const returnUrl = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?returnUrl=${returnUrl}`} replace />;
  }

  if (permissions && permissions.length > 0) {
    const hasAccess = hasAnyPermission(permissions);
    if (!hasAccess) {
      logSecurityDenial(permissions.join(', '), location.pathname, 'ROUTE_ACCESS');
      return <Navigate to={fallbackPath} replace />;
    }
  }

  return <>{children}</>;
};
