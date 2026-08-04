export interface LoginPayload {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
}

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  employeeCode: string;
  department: { id: string; departmentCode: string; departmentName: string };
  role: { id: string; roleName: string };
  permissions: string[];
}

export interface ForgotPasswordPayload {
  email: string;
}

export interface ResetPasswordPayload {
  token: string;
  password: string;
}

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
}

export interface RefreshTokenPayload {
  refreshToken: string;
}

export interface SessionResponse {
  id: string;
  deviceInfo: string;
  ipAddress: string;
  lastActive: string;
  createdAt: string;
}

export interface LoginHistoryEntry {
  id: string;
  email: string;
  ipAddress: string;
  deviceInfo: string;
  success: boolean;
  createdAt: string;
}

export interface SecurityStatus {
  isLocked: boolean;
  failedAttempts: number;
  lastFailedAt: string | null;
}
