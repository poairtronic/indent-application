import { create } from 'zustand';
import { apiClient } from '../lib/axios';

export interface Session {
  id: string;
  userId: string;
  sessionToken: string;
  ipAddress: string | null;
  browser: string | null;
  operatingSystem: string | null;
  device: string | null;
  country: string | null;
  city: string | null;
  status: string;
  loginAt: string;
  logoutAt: string | null;
  lastActivity: string | null;
  expiresAt: string;
}

export interface LoginEntry {
  id: string;
  activity: string;
  timestamp: string;
  ipAddress: string | null;
  browser: string | null;
  operatingSystem: string | null;
  device: string | null;
  success: boolean | null;
  failureReason: string | null;
}

export interface SecurityStatus {
  userId: string;
  accountStatus: string;
  isLocked: boolean;
  lockedAt: string | null;
  lockedUntil: string | null;
  lastLogin: string | null;
  failedLoginAttempts: number;
  remainingAttempts: number;
  maxFailedAttempts: number;
  lockDurationMinutes: number;
  passwordAgeDays: number | null;
  accountCreatedAt: string;
  lastUpdatedAt: string;
}

interface SecurityState {
  sessions: Session[];
  loginHistory: LoginEntry[];
  securityStatus: SecurityStatus | null;
  isLoading: boolean;
  error: string | null;
  fetchSessions: () => Promise<void>;
  fetchLoginHistory: () => Promise<void>;
  fetchSecurityStatus: () => Promise<void>;
  revokeSession: (sessionId: string) => Promise<void>;
  logoutOtherSessions: () => Promise<void>;
  logoutAllSessions: () => Promise<void>;
  unlockAccount: () => Promise<void>;
}

export const useSecurityStore = create<SecurityState>((set, get) => ({
  sessions: [],
  loginHistory: [],
  securityStatus: null,
  isLoading: false,
  error: null,

  fetchSessions: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.get('/auth/sessions');
      set({ sessions: response.data.data ?? [], isLoading: false });
    } catch (err: any) {
      set({
        error: err.response?.data?.message || 'Failed to fetch sessions',
        isLoading: false,
      });
    }
  },

  fetchLoginHistory: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.get('/auth/login-history');
      set({ loginHistory: response.data.data ?? [], isLoading: false });
    } catch (err: any) {
      set({
        error: err.response?.data?.message || 'Failed to fetch login history',
        isLoading: false,
      });
    }
  },

  fetchSecurityStatus: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.get('/auth/security-status');
      set({ securityStatus: response.data.data ?? null, isLoading: false });
    } catch (err: any) {
      set({
        error: err.response?.data?.message || 'Failed to fetch security status',
        isLoading: false,
      });
    }
  },

  revokeSession: async (sessionId: string) => {
    set({ isLoading: true, error: null });
    try {
      await apiClient.delete(`/auth/session/${sessionId}`);
      await get().fetchSessions();
    } catch (err: any) {
      set({
        error: err.response?.data?.message || 'Failed to revoke session',
        isLoading: false,
      });
    }
  },

  logoutOtherSessions: async () => {
    set({ isLoading: true, error: null });
    try {
      await apiClient.post('/auth/logout-other-sessions');
      await get().fetchSessions();
    } catch (err: any) {
      set({
        error: err.response?.data?.message || 'Failed to logout other sessions',
        isLoading: false,
      });
    }
  },

  logoutAllSessions: async () => {
    set({ isLoading: true, error: null });
    try {
      await apiClient.post('/auth/logout-all');
      set({ sessions: [], isLoading: false });
    } catch (err: any) {
      set({
        error: err.response?.data?.message || 'Failed to logout all sessions',
        isLoading: false,
      });
    }
  },

  unlockAccount: async () => {
    set({ isLoading: true, error: null });
    try {
      await apiClient.post('/auth/unlock-account');
      await get().fetchSecurityStatus();
    } catch (err: any) {
      set({
        error: err.response?.data?.message || 'Failed to unlock account',
        isLoading: false,
      });
    }
  },
}));
