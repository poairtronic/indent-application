import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../../hooks/query-keys';
import { authService } from './service';
import { useAuthStore } from '../../../store/authStore';
import type {
  LoginPayload,
  ChangePasswordPayload,
  ForgotPasswordPayload,
  ResetPasswordPayload,
} from './types';

export function useLogin() {
  const queryClient = useQueryClient();
  const loginStore = useAuthStore((s) => s.login);

  return useMutation({
    mutationFn: (payload: LoginPayload) => authService.login(payload),
    onSuccess: (data) => {
      loginStore(data.accessToken, data.refreshToken, data.user);
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.all });
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  const logoutStore = useAuthStore((s) => s.logout);

  return useMutation({
    mutationFn: (refreshToken: string) => authService.logout(refreshToken),
    onSettled: () => {
      logoutStore();
      queryClient.clear();
    },
  });
}

export function useRefreshToken() {
  const loginStore = useAuthStore((s) => s.login);

  return useMutation({
    mutationFn: (refreshToken: string) => authService.refresh(refreshToken),
    onSuccess: (data) => {
      loginStore(data.accessToken, data.refreshToken, data.user);
    },
  });
}

export function useProfile() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  return useQuery({
    queryKey: queryKeys.auth.detail('auth', 'profile'),
    queryFn: () => authService.getProfile(),
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000,
    select: (data) => data.user,
  });
}

export function useForgotPassword() {
  return useMutation({
    mutationFn: (payload: ForgotPasswordPayload) => authService.forgotPassword(payload),
  });
}

export function useResetPassword() {
  return useMutation({
    mutationFn: (payload: ResetPasswordPayload) => authService.resetPassword(payload),
  });
}

export function useChangePassword() {
  const logoutStore = useAuthStore((s) => s.logout);

  return useMutation({
    mutationFn: (payload: ChangePasswordPayload) => authService.changePassword(payload),
    onSettled: () => {
      logoutStore();
    },
  });
}

export function useSessions() {
  return useQuery({
    queryKey: queryKeys.auth.list('auth-sessions'),
    queryFn: () => authService.getSessions(),
  });
}

export function useRevokeSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => authService.revokeSession(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.list('auth-sessions') });
    },
  });
}

export function useLogoutOtherSessions() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => authService.logoutOtherSessions(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.list('auth-sessions') });
    },
  });
}

export function useLogoutAllSessions() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => authService.logoutAll(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.list('auth-sessions') });
    },
  });
}

export function useSecurityStatus() {
  return useQuery({
    queryKey: queryKeys.auth.detail('auth', 'security-status'),
    queryFn: () => authService.getSecurityStatus(),
  });
}

export function useLoginHistory() {
  return useQuery({
    queryKey: queryKeys.auth.list('auth-login-history'),
    queryFn: () => authService.getLoginHistory(),
  });
}

export function useUnlockAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => authService.unlockAccount(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.detail('auth', 'security-status') });
    },
  });
}
