import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../../hooks/query-keys';
import { authService } from './service';
import type {
  LoginPayload,
  ChangePasswordPayload,
  ForgotPasswordPayload,
  ResetPasswordPayload,
} from './types';

export function useLogin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: LoginPayload) => authService.login(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.all });
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (refreshToken: string) => authService.logout(refreshToken),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.all });
    },
  });
}

export function useProfile() {
  return useQuery({
    queryKey: queryKeys.auth.detail('auth', 'profile'),
    queryFn: () => authService.getProfile(),
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
  return useMutation({
    mutationFn: (payload: ChangePasswordPayload) => authService.changePassword(payload),
  });
}

export function useSessions() {
  return useQuery({
    queryKey: queryKeys.auth.list('auth'),
    queryFn: () => authService.getSessions(),
  });
}

export function useRevokeSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => authService.revokeSession(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.list('auth') });
    },
  });
}

export function useSecurityStatus() {
  return useQuery({
    queryKey: queryKeys.auth.detail('auth', 'security'),
    queryFn: () => authService.getSecurityStatus(),
  });
}

export function useLoginHistory() {
  return useQuery({
    queryKey: queryKeys.auth.list('auth'),
    queryFn: () => authService.getLoginHistory(),
  });
}
