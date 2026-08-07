import { create } from 'zustand';
import type { AuthUser } from '../api/services/auth/types';

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  permissions: string[];
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (accessToken: string, refreshToken: string, user: AuthUser) => void;
  logout: () => void;
  setAccessToken: (token: string) => void;
  setLoading: (loading: boolean) => void;
  hasPermission: (permission: string) => boolean;
  hasAnyPermission: (permissions: string[]) => boolean;
}

const STORAGE_KEYS = {
  ACCESS_TOKEN: 'auth_access_token',
  REFRESH_TOKEN: 'auth_refresh_token',
  USER: 'auth_user',
  PERMISSIONS: 'auth_permissions',
} as const;

function loadPersistedState() {
  try {
    const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
    const refreshToken = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
    const userJson = localStorage.getItem(STORAGE_KEYS.USER);
    const permsJson = localStorage.getItem(STORAGE_KEYS.PERMISSIONS);

    const user = userJson ? JSON.parse(userJson) : null;
    const permissions = permsJson ? JSON.parse(permsJson) : [];

    return {
      user: user as AuthUser | null,
      accessToken: token,
      refreshToken,
      permissions: permissions as string[],
      isAuthenticated: !!token,
      isLoading: false,
    };
  } catch {
    return {
      user: null,
      accessToken: null,
      refreshToken: null,
      permissions: [],
      isAuthenticated: false,
      isLoading: false,
    };
  }
}

function persistAuthState(accessToken: string, refreshToken: string, user: AuthUser) {
  localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
  localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
  localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
  localStorage.setItem(STORAGE_KEYS.PERMISSIONS, JSON.stringify(user.permissions ?? []));
}

function clearPersistedState() {
  localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
  localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
  localStorage.removeItem(STORAGE_KEYS.USER);
  localStorage.removeItem(STORAGE_KEYS.PERMISSIONS);
}

export const useAuthStore = create<AuthState>((set, get) => ({
  ...loadPersistedState(),

  login: (accessToken, refreshToken, user) => {
    persistAuthState(accessToken, refreshToken, user);
    set({
      accessToken,
      refreshToken,
      user,
      permissions: user.permissions ?? [],
      isAuthenticated: true,
    });

    // Broadcast login to other tabs
    try {
      const bc = new BroadcastChannel('imcms-auth');
      bc.postMessage({ type: 'LOGIN', accessToken, refreshToken, user });
      bc.close();
    } catch {
      // BroadcastChannel not supported or already closed
    }
  },

  logout: () => {
    clearPersistedState();
    set({
      accessToken: null,
      refreshToken: null,
      user: null,
      permissions: [],
      isAuthenticated: false,
    });

    // Broadcast logout to other tabs
    try {
      const bc = new BroadcastChannel('imcms-auth');
      bc.postMessage({ type: 'LOGOUT' });
      bc.close();
    } catch {
      // BroadcastChannel not supported
    }
  },

  setAccessToken: (accessToken) => {
    localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
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
}));
