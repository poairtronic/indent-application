import { create } from 'zustand';
import type { AuthUser } from '../api/services/auth/types';
import { queryClient } from '../api/hooks/query-client';

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  permissions: string[];
  isAuthenticated: boolean;
  isLoading: boolean;
  isHydrating: boolean;
  login: (accessToken: string, refreshToken: string, user: AuthUser, isSync?: boolean) => void;
  logout: (broadcast?: boolean) => void;
  setAccessToken: (token: string) => void;
  setLoading: (loading: boolean) => void;
  hasPermission: (permission: string) => boolean;
  hasAnyPermission: (permissions: string[]) => boolean;
  hydrate: () => void;
  initializeAuth: () => Promise<void>;
}

const STORAGE_KEYS = {
  ACCESS_TOKEN: 'auth_access_token',
  REFRESH_TOKEN: 'auth_refresh_token',
  USER: 'auth_user',
  PERMISSIONS: 'auth_permissions',
} as const;

function isTokenValid(token: string | null): boolean {
  if (!token) return false;
  try {
    const base64Url = token.split('.')[1];
    if (!base64Url) return false;
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      window
        .atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join(''),
    );
    const payload = JSON.parse(jsonPayload);
    // Add 10 seconds leeway
    return payload.exp && payload.exp * 1000 > Date.now() + 10000;
  } catch {
    return false;
  }
}

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
      isAuthenticated: false, // Start false until hydrated
      isLoading: false,
      isHydrating: true, // Start in hydration state
    };
  } catch {
    return {
      user: null,
      accessToken: null,
      refreshToken: null,
      permissions: [],
      isAuthenticated: false,
      isLoading: false,
      isHydrating: true,
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

// Single initialization lock to prevent strict-mode double firing
let isInitializing = false;
let initializePromise: Promise<void> | null = null;

export const useAuthStore = create<AuthState>((set, get) => ({
  ...loadPersistedState(),

  login: (accessToken, refreshToken, user, isSync = false) => {
    persistAuthState(accessToken, refreshToken, user);
    set({
      accessToken,
      refreshToken,
      user,
      permissions: user.permissions ?? [],
      isAuthenticated: true,
      isHydrating: false,
    });

    if (!isSync) {
      // Broadcast login to other tabs
      try {
        const bc = new BroadcastChannel('imcms-auth');
        bc.postMessage({ type: 'LOGIN' });
        bc.close();
      } catch {
        // BroadcastChannel not supported or already closed
      }
    }
  },

  logout: (broadcast = true) => {
    clearPersistedState();
    queryClient.clear();
    set({
      accessToken: null,
      refreshToken: null,
      user: null,
      permissions: [],
      isAuthenticated: false,
      isHydrating: false,
    });

    if (broadcast) {
      // Broadcast logout to other tabs
      try {
        const bc = new BroadcastChannel('imcms-auth');
        bc.postMessage({ type: 'LOGOUT' });
        bc.close();
      } catch {
        // BroadcastChannel not supported
      }
    }
  },

  setAccessToken: (accessToken) => {
    localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
    set({ accessToken, isAuthenticated: true });
  },

  setLoading: (isLoading) => set({ isLoading }),

  hasPermission: (permission) => {
    const { user, permissions } = get();
    const roleName = (user?.role?.roleName || '').toUpperCase();
    const deptCode = (user?.department?.departmentCode || '').toUpperCase();
    const isSystemAdmin =
      roleName === 'ADMIN' ||
      roleName === 'SYSTEM ADMINISTRATOR' ||
      (user?.role as any)?.isSystem === true ||
      deptCode === 'ADMIN' ||
      deptCode === 'ADMINISTRATION' ||
      deptCode === 'ADM';

    if (isSystemAdmin) {
      return true;
    }
    return permissions.some((p) => p.toLowerCase() === permission.toLowerCase());
  },

  hasAnyPermission: (perms) => {
    const { user, permissions } = get();
    const roleName = (user?.role?.roleName || '').toUpperCase();
    const deptCode = (user?.department?.departmentCode || '').toUpperCase();
    const isSystemAdmin =
      roleName === 'ADMIN' ||
      roleName === 'SYSTEM ADMINISTRATOR' ||
      (user?.role as any)?.isSystem === true ||
      deptCode === 'ADMIN' ||
      deptCode === 'ADMINISTRATION' ||
      deptCode === 'ADM';

    if (isSystemAdmin) {
      return true;
    }
    return perms.some((p) => permissions.some((up) => up.toLowerCase() === p.toLowerCase()));
  },

  hydrate: () => {
    const state = loadPersistedState();
    set({ ...state, isAuthenticated: !!state.accessToken, isHydrating: false });
  },

  initializeAuth: async () => {
    if (isInitializing && initializePromise) return initializePromise;

    isInitializing = true;
    initializePromise = (async () => {
      try {
        const { accessToken, refreshToken, user } = get();

        // 1. If no token, no active session
        if (!accessToken || !refreshToken || !user) {
          get().logout(false);
          return;
        }

        // 2. Check token validity locally
        if (isTokenValid(accessToken)) {
          set({ isAuthenticated: true, isHydrating: false });
          return;
        }

        // 3. Token is expired, trigger refresh ONE time
        // Import apiClient dynamically to avoid circular dependency
        const { apiClient } = await import('../api/client');
        try {
          const res = await apiClient.post('/auth/refresh');
          const data = res.data.data || res.data;

          if (data && data.accessToken) {
            get().login(data.accessToken, data.refreshToken || refreshToken, user, true);
          } else {
            throw new Error('No token returned from refresh');
          }
        } catch (error) {
          console.error('Initial auth refresh failed:', error);
          get().logout(false);
        }
      } finally {
        set({ isHydrating: false });
        isInitializing = false;
        initializePromise = null;
      }
    })();

    return initializePromise;
  },
}));
