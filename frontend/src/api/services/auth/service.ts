import { BaseService } from '../base.service';
import type {
  LoginPayload,
  LoginResponse,
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

  async login(payload: LoginPayload): Promise<LoginResponse> {
    return this.post<LoginResponse>('/auth/login', payload, { skipAuth: true });
  }

  async logout(refreshToken: string): Promise<void> {
    await this.post('/auth/logout', { refreshToken });
  }

  async refresh(refreshToken: string): Promise<LoginResponse> {
    return this.post<LoginResponse>('/auth/refresh', { refreshToken }, { skipAuth: true });
  }

  async getProfile(): Promise<LoginResponse['user']> {
    return this.get<LoginResponse['user']>('/auth/profile');
  }

  async forgotPassword(payload: ForgotPasswordPayload): Promise<void> {
    await this.post('/auth/forgot-password', payload, { skipAuth: true });
  }

  async resetPassword(payload: ResetPasswordPayload): Promise<void> {
    await this.post('/auth/reset-password', payload, { skipAuth: true });
  }

  async changePassword(payload: ChangePasswordPayload): Promise<void> {
    await this.post('/auth/change-password', payload);
  }

  async getSessions(): Promise<SessionResponse[]> {
    return this.get<SessionResponse[]>('/auth/sessions');
  }

  async revokeSession(id: string): Promise<void> {
    await this.delete(`/auth/session/${id}`);
  }

  async logoutOtherSessions(): Promise<void> {
    await this.post('/auth/logout-other-sessions');
  }

  async logoutAll(): Promise<void> {
    await this.post('/auth/logout-all');
  }

  async getLoginHistory(): Promise<LoginHistoryEntry[]> {
    return this.get<LoginHistoryEntry[]>('/auth/login-history');
  }

  async getSecurityStatus(): Promise<SecurityStatus> {
    return this.get<SecurityStatus>('/auth/security-status');
  }

  async unlockAccount(): Promise<void> {
    await this.post('/auth/unlock-account');
  }
}

export const authService = new AuthService();
