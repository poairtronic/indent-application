export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  employeeCode: string;
  department: {
    id: string;
    departmentCode: string;
    departmentName: string;
  };
  role: {
    id: string;
    roleName: string;
  };
  permissions: string[];
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RefreshTokenPayload {
  refreshToken: string;
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

export interface SessionResponse {
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

export interface LoginHistoryEntry {
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
