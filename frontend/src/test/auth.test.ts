import { describe, it, expect, beforeEach } from 'vitest';
import { useAuthStore } from '../store/authStore';

describe('Auth Store', () => {
  beforeEach(() => {
    useAuthStore.setState({
      user: null,
      accessToken: null,
      permissions: [],
      isAuthenticated: false,
      isLoading: false,
    });
    localStorage.clear();
  });

  it('should initialize as unauthenticated', () => {
    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(false);
    expect(state.user).toBeNull();
    expect(state.permissions).toEqual([]);
  });

  it('should log in correctly and store tokens', () => {
    const mockUser = {
      id: 'user-uuid',
      email: 'test@indent.com',
      firstName: 'Test',
      lastName: 'User',
      employeeCode: 'TST001',
      department: { id: 'dept-id', departmentCode: 'DSGN', departmentName: 'Design' },
      role: { id: 'role-id', roleName: 'Design Engineer' },
      permissions: ['indent.create', 'indent.view'],
    };

    useAuthStore.getState().login('access-token-123', 'refresh-token-456', mockUser);

    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(true);
    expect(state.accessToken).toBe('access-token-123');
    expect(state.user).toEqual(mockUser);
    expect(state.permissions).toEqual(['indent.create', 'indent.view']);
  });

  it('should verify permissions correctly', () => {
    useAuthStore.setState({
      permissions: ['indent.create', 'indent.view'],
    });

    const hasCreate = useAuthStore.getState().hasPermission('indent.create');
    const hasEdit = useAuthStore.getState().hasPermission('indent.edit');
    const hasAny = useAuthStore.getState().hasAnyPermission(['indent.edit', 'indent.view']);

    expect(hasCreate).toBe(true);
    expect(hasEdit).toBe(false);
    expect(hasAny).toBe(true);
  });

  it('should clear stores on logout', () => {
    useAuthStore.setState({
      isAuthenticated: true,
      accessToken: 'token',
      user: {} as any,
    });

    useAuthStore.getState().logout();

    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(false);
    expect(state.accessToken).toBeNull();
    expect(state.user).toBeNull();
  });
});
