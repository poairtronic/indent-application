import { useMemo } from 'react';
import { useAuthStore } from '../store/authStore';

export function usePermission() {
  const permissions = useAuthStore((s) => s.permissions);
  const hasPermission = useAuthStore((s) => s.hasPermission);
  const hasAnyPermission = useAuthStore((s) => s.hasAnyPermission);

  return useMemo(
    () => ({
      permissions,
      can: hasPermission,
      canAny: hasAnyPermission,
    }),
    [permissions, hasPermission, hasAnyPermission],
  );
}
