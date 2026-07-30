import { useMemo } from 'react';
import { useAuthStore } from '../store/authStore';
import { ROLE_LABELS } from '../constants/roles';

export function useRole() {
  const user = useAuthStore((s) => s.user);
  const hasRole = useAuthStore((s) => s.hasRole);

  return useMemo(() => {
    const roleName = user?.role?.roleName ?? null;
    return {
      roleName,
      roleLabel: roleName ? ROLE_LABELS[roleName.toUpperCase()] ?? roleName : null,
      is: hasRole,
    };
  }, [user, hasRole]);
}
