import { useEffect } from 'react';
import { useAuthStore } from '../store/authStore';

export function useTabSync() {
  const logout = useAuthStore((s) => s.logout);

  useEffect(() => {
    // BroadcastChannel for same-origin multi-tab sync
    let bc: BroadcastChannel | null = null;

    try {
      bc = new BroadcastChannel('imcms-auth');
      bc.onmessage = (event: MessageEvent) => {
        if (event.data?.type === 'LOGOUT') {
          logout();
          if (window.location.pathname !== '/login') {
            window.location.href = '/login';
          }
        }
      };
    } catch {
      // BroadcastChannel not supported, fall back to storage events
    }

    // Fallback: storage event for browsers without BroadcastChannel
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'auth_access_token' && !event.newValue) {
        logout();
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      bc?.close();
    };
  }, [logout]);
}
