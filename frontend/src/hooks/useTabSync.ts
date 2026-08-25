import { useEffect } from 'react';
import { useAuthStore } from '../store/authStore';

export function useTabSync() {
  const logout = useAuthStore((s) => s.logout);
  const login = useAuthStore((s) => s.login);

  useEffect(() => {
    // BroadcastChannel for same-origin multi-tab sync
    let bc: BroadcastChannel | null = null;

    try {
      bc = new BroadcastChannel('imcms-auth');
      bc.onmessage = (event: MessageEvent) => {
        if (event.data?.type === 'LOGOUT') {
          logout();
        } else if (event.data?.type === 'LOGIN') {
          login(event.data.accessToken, event.data.refreshToken, event.data.user, true);
        }
      };
    } catch {
      // BroadcastChannel not supported, fall back to storage events
    }

    // Fallback: storage event for browsers without BroadcastChannel
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'auth_access_token') {
        if (!event.newValue) {
          logout();
        } else {
          // A crude fallback for login across tabs if broadcast channel isn't supported
          const token = localStorage.getItem('auth_access_token');
          const refresh = localStorage.getItem('auth_refresh_token');
          const userStr = localStorage.getItem('auth_user');
          if (token && refresh && userStr) {
            try {
              const user = JSON.parse(userStr);
              login(token, refresh, user, true);
            } catch {
              // Ignore parse errors
            }
          }
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
