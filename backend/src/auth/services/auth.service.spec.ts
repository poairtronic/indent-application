import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PasswordService } from './password.service';
import { TokenService } from './token.service';
import { SessionService } from './session.service';
import { LoginHistoryService } from './login-history.service';
import { AccountSecurityService } from './account-security.service';
import { PrismaService } from '../../prisma/prisma.service';
import { CommunicationEventBus } from '../../communication/events/communication-event.bus';
import { UnauthorizedException } from '@nestjs/common';

describe('AuthService', () => {
  let service: AuthService;
  let mockPrisma: any;

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    refreshToken: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    passwordResetToken: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    $transaction: jest.fn((promises) => Promise.all(promises)),
  };

  const mockPasswordService = {
    hash: jest.fn().mockResolvedValue('hashed_password'),
    compare: jest.fn(),
  };

  const mockTokenService = {
    generateAccessToken: jest.fn().mockResolvedValue('access_token'),
    generateRefreshToken: jest.fn().mockResolvedValue('refresh_token'),
    saveRefreshToken: jest.fn().mockResolvedValue(undefined),
    hashToken: jest.fn().mockReturnValue('hashed_refresh_token'),
    verifyRefreshToken: jest.fn(),
    revokeRefreshToken: jest.fn().mockResolvedValue(undefined),
    revokeAllRefreshTokensForUser: jest.fn().mockResolvedValue(undefined),
  };

  const mockSessionService = {
    createSession: jest.fn().mockResolvedValue({ id: 'session_id' }),
    revokeAllSessions: jest.fn().mockResolvedValue(undefined),
    revokeSessionByToken: jest.fn().mockResolvedValue(undefined),
  };

  const mockLoginHistoryService = {
    recordLogin: jest.fn().mockResolvedValue(undefined),
    recordLogout: jest.fn().mockResolvedValue(undefined),
  };

  const mockAccountSecurityService = {
    checkAccountLocked: jest.fn().mockResolvedValue(undefined),
    recordFailedAttempt: jest.fn().mockResolvedValue(undefined),
    resetFailedAttempts: jest.fn().mockResolvedValue(undefined),
  };

  const mockEventBus = {
    emit: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: PasswordService, useValue: mockPasswordService },
        { provide: TokenService, useValue: mockTokenService },
        { provide: SessionService, useValue: mockSessionService },
        { provide: LoginHistoryService, useValue: mockLoginHistoryService },
        { provide: AccountSecurityService, useValue: mockAccountSecurityService },
        { provide: CommunicationEventBus, useValue: mockEventBus },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    mockPrisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('login', () => {
    const mockUser = {
      id: 'user_id',
      email: 'test@example.com',
      password: 'hashed_password',
      status: 'ACTIVE',
      isDeleted: false,
      employeeCode: 'EMP123',
      department: { id: 'dept_id', departmentCode: 'DEPT', departmentName: 'Dept' },
      role: {
        id: 'role_id',
        roleName: 'Role',
        rolePermissions: [{ permission: { code: 'users.view' } }],
      },
    };

    const deviceInfo = {
      ipAddress: '127.0.0.1',
      browser: 'Chrome',
      operatingSystem: 'Windows 10',
      device: 'Desktop',
    };

    it('should login successfully with correct credentials', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.user.update.mockResolvedValue({ ...mockUser, lastLogin: new Date() });
      mockPasswordService.compare.mockResolvedValue(true);

      const result = await service.login(
        {
          email: 'test@example.com',
          password: 'password123',
        },
        deviceInfo,
      );

      expect(result).toHaveProperty('accessToken', 'access_token');
      expect(result).toHaveProperty('refreshToken', 'refresh_token');
      expect(result.user.email).toEqual(mockUser.email);
      expect(mockAccountSecurityService.checkAccountLocked).toHaveBeenCalledWith(
        mockUser.id,
        mockUser,
      );
      expect(mockAccountSecurityService.resetFailedAttempts).toHaveBeenCalledWith(mockUser.id);
      expect(mockSessionService.createSession).toHaveBeenCalledWith({
        userId: mockUser.id,
        sessionToken: 'hashed_refresh_token',
        refreshToken: 'hashed_refresh_token',
        ...deviceInfo,
      });
      expect(mockLoginHistoryService.recordLogin).toHaveBeenCalledWith({
        userId: mockUser.id,
        ...deviceInfo,
        success: true,
      });
    });

    it('should throw UnauthorizedException if user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.login({ email: 'test@example.com', password: 'password123' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if user inactive', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        ...mockUser,
        status: 'INACTIVE',
      });

      await expect(
        service.login({ email: 'test@example.com', password: 'password123' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for wrong password', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPasswordService.compare.mockResolvedValue(false);

      await expect(
        service.login({ email: 'test@example.com', password: 'password123' }, deviceInfo),
      ).rejects.toThrow(UnauthorizedException);
      expect(mockAccountSecurityService.recordFailedAttempt).toHaveBeenCalledWith(mockUser.id);
      expect(mockLoginHistoryService.recordLogin).toHaveBeenCalledWith({
        userId: mockUser.id,
        ...deviceInfo,
        success: false,
        failureReason: 'Invalid password',
      });
    });

    it('should throw UnauthorizedException if user is deleted', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        ...mockUser,
        isDeleted: true,
      });

      await expect(
        service.login({ email: 'test@example.com', password: 'password123' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if account is locked', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockAccountSecurityService.checkAccountLocked.mockRejectedValue(
        new UnauthorizedException('Account locked'),
      );

      await expect(
        service.login({ email: 'test@example.com', password: 'password123' }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('refresh', () => {
    const mockUser = {
      id: 'user_id',
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      employeeCode: 'EMP001',
      status: 'ACTIVE',
      isDeleted: false,
      department: { id: 'dept_id', departmentCode: 'ENG', departmentName: 'Engineering' },
      role: { id: 'role_id', roleName: 'Engineer', rolePermissions: [] },
    };

    it('should refresh token pair and revoke only the specific session', async () => {
      mockTokenService.verifyRefreshToken.mockResolvedValue({
        sub: 'user_id',
        email: 'test@example.com',
      });
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.refresh('user_id', 'old_refresh_token');

      expect(result).toBeDefined();
      expect(result.accessToken).toBe('access_token');
      expect(result.refreshToken).toBe('refresh_token');
      expect(mockTokenService.revokeRefreshToken).toHaveBeenCalledWith('old_refresh_token');
      expect(mockSessionService.revokeSessionByToken).toHaveBeenCalledWith(
        'hashed_refresh_token',
        'user_id',
      );
      expect(mockSessionService.revokeAllSessions).not.toHaveBeenCalled();
      expect(mockSessionService.createSession).toHaveBeenCalled();
    });

    it('should reject refresh if token verification fails (expired or invalid)', async () => {
      mockTokenService.verifyRefreshToken.mockRejectedValue(
        new UnauthorizedException('Token expired'),
      );

      await expect(service.refresh('user_id', 'expired_token')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should reject refresh if token is marked as revoked in DB', async () => {
      mockTokenService.verifyRefreshToken.mockResolvedValue({ sub: 'user_id' });
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockSessionService.revokeSessionByToken.mockRejectedValue(
        new UnauthorizedException('Token revoked'),
      );

      await expect(service.refresh('user_id', 'revoked_token')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});
