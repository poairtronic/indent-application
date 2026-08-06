import React from 'react';
import { useAuthStore } from '../../store/authStore';

interface RoleGuardProps {
  permissions: string[];
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export const RoleGuard: React.FC<RoleGuardProps> = ({ permissions, fallback = null, children }) => {
  const hasAnyPermission = useAuthStore((s) => s.hasAnyPermission);
  const hasAccess = hasAnyPermission(permissions);
  return hasAccess ? <>{children}</> : <>{fallback}</>;
};
