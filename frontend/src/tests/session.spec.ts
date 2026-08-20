import { describe, it, expect, beforeEach } from 'vitest';
import { useAuthStore } from '../store/authStore';

// Removed zustand mock so getState works normally

describe('Session State Machine (T1-I)', () => {
  beforeEach(() => {
    // Reset state before each test
    const store = useAuthStore.getState();
    if (store && store.logout) {
      store.logout();
    }
  });

  it('should initialize with null user and unauthenticated status', () => {
    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.isAuthenticated).toBe(false);
  });

  it('should update state correctly on login', () => {
    const state = useAuthStore.getState();
    const mockUser = {
      id: '1',
      email: 'test@test.com',
      firstName: 'Test',
      lastName: 'User',
      status: 'ACTIVE',
      isDeleted: false,
      role: { roleName: 'ADMIN', permissions: [] },
      department: { departmentCode: 'IT' },
    };

    state.login('access-token', 'refresh-token', mockUser as any);

    const updatedState = useAuthStore.getState();
    expect(updatedState.user).toEqual(mockUser);
    expect(updatedState.isAuthenticated).toBe(true);
    expect(updatedState.accessToken).toBe('access-token');
  });

  it('should clear state on logout', () => {
    const state = useAuthStore.getState();
    state.login('token', 'token', { id: '1' } as any);

    expect(useAuthStore.getState().isAuthenticated).toBe(true);

    useAuthStore.getState().logout();

    const clearedState = useAuthStore.getState();
    expect(clearedState.user).toBeNull();
    expect(clearedState.isAuthenticated).toBe(false);
    expect(clearedState.accessToken).toBeNull();
  });
});
