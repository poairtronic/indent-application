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
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const hasAnyPermission = useAuthStore((s) => s.hasAnyPermission);
  const location = useLocation();

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
