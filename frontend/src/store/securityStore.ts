import { create } from 'zustand';
import { authService } from '../api/services/auth/service';
import type {
  SessionResponse as Session,
  LoginHistoryEntry,
  SecurityStatus,
} from '../api/services/auth/types';

export type { Session };

interface SecurityState {
  sessions: Session[];
  loginHistory: LoginHistoryEntry[];
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
      const sessions = await authService.getSessions();
      set({ sessions, isLoading: false });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to fetch sessions';
      set({ error: message, isLoading: false });
    }
  },

  fetchLoginHistory: async () => {
    set({ isLoading: true, error: null });
    try {
      const loginHistory = await authService.getLoginHistory();
      set({ loginHistory, isLoading: false });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to fetch login history';
      set({ error: message, isLoading: false });
    }
  },

  fetchSecurityStatus: async () => {
    set({ isLoading: true, error: null });
    try {
      const securityStatus = await authService.getSecurityStatus();
      set({ securityStatus, isLoading: false });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to fetch security status';
      set({ error: message, isLoading: false });
    }
  },

  revokeSession: async (sessionId: string) => {
    set({ isLoading: true, error: null });
    try {
      await authService.revokeSession(sessionId);
      await get().fetchSessions();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to revoke session';
      set({ error: message, isLoading: false });
    }
  },

  logoutOtherSessions: async () => {
    set({ isLoading: true, error: null });
    try {
      await authService.logoutOtherSessions();
      await get().fetchSessions();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to logout other sessions';
      set({ error: message, isLoading: false });
    }
  },

  logoutAllSessions: async () => {
    set({ isLoading: true, error: null });
    try {
      await authService.logoutAll();
      set({ sessions: [], isLoading: false });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to logout all sessions';
      set({ error: message, isLoading: false });
    }
  },

  unlockAccount: async () => {
    set({ isLoading: true, error: null });
    try {
      await authService.unlockAccount();
      await get().fetchSecurityStatus();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to unlock account';
      set({ error: message, isLoading: false });
    }
  },
}));
