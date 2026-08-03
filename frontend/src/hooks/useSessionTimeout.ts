import { useEffect, useRef } from 'react';
import { useAuthStore } from '../store/authStore';

export function useSessionTimeout(timeoutMs = 15 * 60 * 1000) {
  const logout = useAuthStore((s) => s.logout);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const resetTimer = () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      timerRef.current = setTimeout(() => {
        console.warn('Session inactive. Triggering automatic logout.');
        logout();
        window.location.href = '/login';
      }, timeoutMs);
    };

    const activityEvents = ['mousemove', 'keydown', 'mousedown', 'scroll', 'click'];

    if (isAuthenticated) {
      activityEvents.forEach((event) => {
        window.addEventListener(event, resetTimer);
      });
      resetTimer();
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      if (isAuthenticated) {
        activityEvents.forEach((event) => {
          window.removeEventListener(event, resetTimer);
        });
      }
    };
  }, [isAuthenticated, logout, timeoutMs]);
}
