import { create } from 'zustand';

interface UserRole {
  id: string;
  roleName: string;
}

interface UserDepartment {
  id: string;
  departmentCode: string;
  departmentName: string;
}

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  employeeCode: string;
  department: UserDepartment;
  role: UserRole;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  permissions: string[];
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (accessToken: string, refreshToken: string, user: User & { permissions?: string[] }) => void;
  logout: () => void;
  setAccessToken: (token: string) => void;
  setLoading: (loading: boolean) => void;
  hasPermission: (permission: string) => boolean;
  hasAnyPermission: (permissions: string[]) => boolean;
  hasRole: (role: string) => boolean;
}

export const useAuthStore = create<AuthState>((set, get) => {
  const savedUser = localStorage.getItem('auth_user');
  const savedToken = localStorage.getItem('auth_access_token');
  const savedPermissions = localStorage.getItem('auth_permissions');

  return {
    user: savedUser ? JSON.parse(savedUser) : null,
    accessToken: savedToken || null,
    permissions: savedPermissions ? JSON.parse(savedPermissions) : [],
    isAuthenticated: !!savedToken,
    isLoading: false,
    login: (accessToken, refreshToken, user) => {
      const perms = user.permissions ?? [];
      localStorage.setItem('auth_access_token', accessToken);
      localStorage.setItem('auth_refresh_token', refreshToken);
      localStorage.setItem('auth_user', JSON.stringify(user));
      localStorage.setItem('auth_permissions', JSON.stringify(perms));
      set({ accessToken, user, permissions: perms, isAuthenticated: true });
    },
    logout: () => {
      localStorage.removeItem('auth_access_token');
      localStorage.removeItem('auth_refresh_token');
      localStorage.removeItem('auth_user');
      localStorage.removeItem('auth_permissions');
      set({ accessToken: null, user: null, permissions: [], isAuthenticated: false });
    },
    setAccessToken: (accessToken) => {
      localStorage.setItem('auth_access_token', accessToken);
      set({ accessToken, isAuthenticated: true });
    },
    setLoading: (isLoading) => set({ isLoading }),
    hasPermission: (permission) => {
      const { permissions } = get();
      return permissions.some((p) => p.toLowerCase() === permission.toLowerCase());
    },
    hasAnyPermission: (perms) => {
      const { permissions } = get();
      return perms.some((p) => permissions.some((up) => up.toLowerCase() === p.toLowerCase()));
    },
    hasRole: (role) => {
      const { user } = get();
      if (!user) return false;
      return user.role.roleName.toUpperCase() === role.toUpperCase();
    },
  };
});
