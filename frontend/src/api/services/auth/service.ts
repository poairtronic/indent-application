import { BaseService } from '../base.service';
import type {
  AuthResponse,
  LoginPayload,
  ForgotPasswordPayload,
  ResetPasswordPayload,
  ChangePasswordPayload,
  SessionResponse,
  LoginHistoryEntry,
  SecurityStatus,
} from './types';

class AuthService extends BaseService {
  constructor() {
    super({ basePath: '/auth' });
  }

  async login(payload: LoginPayload): Promise<AuthResponse> {
    return this.post<AuthResponse>('/auth/login', payload, { skipAuth: true });
  }

  async logout(refreshToken: string): Promise<{ message: string }> {
    return this.post<{ message: string }>('/auth/logout', { refreshToken });
  }

  async refresh(refreshToken: string): Promise<AuthResponse> {
    return this.post<AuthResponse>('/auth/refresh', { refreshToken }, { skipAuth: true });
  }

  async getProfile(): Promise<{ user: AuthResponse['user'] }> {
    return this.get<{ user: AuthResponse['user'] }>('/auth/profile');
  }

  async forgotPassword(payload: ForgotPasswordPayload): Promise<{ message: string }> {
    return this.post<{ message: string }>('/auth/forgot-password', payload, { skipAuth: true });
  }

  async resetPassword(payload: ResetPasswordPayload): Promise<{ message: string }> {
    return this.post<{ message: string }>('/auth/reset-password', payload, { skipAuth: true });
  }

  async changePassword(payload: ChangePasswordPayload): Promise<{ message: string }> {
    return this.post<{ message: string }>('/auth/change-password', payload);
  }

  async getSessions(): Promise<SessionResponse[]> {
    return this.get<SessionResponse[]>('/auth/sessions');
  }

  async revokeSession(id: string): Promise<{ message: string }> {
    return this.delete<{ message: string }>(`/auth/session/${id}`);
  }

  async logoutOtherSessions(): Promise<{ message: string }> {
    return this.post<{ message: string }>('/auth/logout-other-sessions');
  }

  async logoutAll(): Promise<{ message: string }> {
    return this.post<{ message: string }>('/auth/logout-all');
  }

  async getLoginHistory(): Promise<LoginHistoryEntry[]> {
    return this.get<LoginHistoryEntry[]>('/auth/login-history');
  }

  async getSecurityStatus(): Promise<SecurityStatus> {
    return this.get<SecurityStatus>('/auth/security-status');
  }

  async unlockAccount(): Promise<{ message: string }> {
    return this.post<{ message: string }>('/auth/unlock-account');
  }
}

export const authService = new AuthService();
