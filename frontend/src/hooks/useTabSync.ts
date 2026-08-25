import { useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { queryClient } from '../api/hooks/query-client';

export function useTabSync() {
  const logout = useAuthStore((s) => s.logout);
  const hydrate = useAuthStore((s) => s.hydrate);

  useEffect(() => {
    // BroadcastChannel for same-origin multi-tab sync
    let bc: BroadcastChannel | null = null;

    try {
      bc = new BroadcastChannel('imcms-auth');
      bc.onmessage = (event: MessageEvent) => {
        if (event.data?.type === 'LOGOUT') {
          // Apply a logout received from another tab locally only. Rebroadcasting
          // it creates a cross-tab echo that can arrive after a fresh login and
          // clear the new session.
          logout(false);
        } else if (event.data?.type === 'LOGIN') {
          hydrate();
          queryClient.invalidateQueries();
        }
      };
    } catch {
      // BroadcastChannel not supported, fall back to storage events
    }

    // Fallback: storage event for browsers without BroadcastChannel
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'auth_access_token') {
        if (!event.newValue) {
          logout(false);
        } else {
          // A crude fallback for login across tabs if broadcast channel isn't supported
          hydrate();
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      bc?.close();
    };
  }, [logout, hydrate]);
}
