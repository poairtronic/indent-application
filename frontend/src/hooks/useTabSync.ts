import { useEffect } from 'react';
import { useAuthStore } from '../store/authStore';

export function useTabSync() {
  const logout = useAuthStore((s) => s.logout);

  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'auth_access_token' && !event.newValue) {
        console.warn('Authentication token removed in another tab. Logging out.');
        logout();
        window.location.href = '/login';
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [logout]);
}
