import React from 'react';
import { useAuthStore } from '../../store/authStore';

interface RoleGuardProps {
  roles: string[];
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export const RoleGuard: React.FC<RoleGuardProps> = ({ roles, fallback = null, children }) => {
  const user = useAuthStore((s) => s.user);
  const hasRole = roles.some(
    (r) => user?.role?.roleName?.toUpperCase() === r.toUpperCase(),
  );
  return hasRole ? <>{children}</> : <>{fallback}</>;
};
