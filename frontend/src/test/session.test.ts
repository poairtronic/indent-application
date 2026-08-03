import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useSessionTimeout } from '../hooks/useSessionTimeout';
import { useAuthStore } from '../store/authStore';

vi.mock('../store/authStore', () => {
  const mockLogout = vi.fn();
  const mockAuthStore = vi.fn((selector) => {
    const state = {
      logout: mockLogout,
      isAuthenticated: true,
    };
    return selector(state);
  });
  (mockAuthStore as any).getState = () => ({
    logout: mockLogout,
    isAuthenticated: true,
  });
  (mockAuthStore as any).setState = vi.fn();

  return {
    useAuthStore: mockAuthStore,
  };
});

describe('Session Inactivity Timeout', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should trigger logout when inactivity limit is reached', () => {
    renderHook(() => useSessionTimeout(5000));

    const logoutMock = useAuthStore.getState().logout;

    vi.advanceTimersByTime(4000);
    expect(logoutMock).not.toHaveBeenCalled();

    vi.advanceTimersByTime(2000);
    expect(logoutMock).toHaveBeenCalledTimes(1);
  });
});
