import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

interface ProtectedRouteProps {
  children: React.ReactNode;
  permissions?: string[];
  roles?: string[];
  fallbackPath?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  permissions,
  roles,
  fallbackPath = '/unauthorized',
}) => {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const hasAnyPermission = useAuthStore((s) => s.hasAnyPermission);
  const user = useAuthStore((s) => s.user);
  const location = useLocation();

  if (!isAuthenticated) {
    const returnUrl = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?returnUrl=${returnUrl}`} replace />;
  }

  if (roles && roles.length > 0) {
    const hasRole = roles.some((r) => user?.role?.roleName?.toUpperCase() === r.toUpperCase());
    if (!hasRole) {
      return <Navigate to={fallbackPath} replace />;
    }
  }

  if (permissions && permissions.length > 0) {
    const hasAccess = hasAnyPermission(permissions);
    if (!hasAccess) {
      return <Navigate to={fallbackPath} replace />;
    }
  }

  return <>{children}</>;
};
