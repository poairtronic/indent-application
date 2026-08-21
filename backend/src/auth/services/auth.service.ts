import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { observabilityEventBus } from '../../observability/observability-event-bus';
import { PasswordService } from './password.service';
import { TokenService } from './token.service';
import { SessionService } from './session.service';
import { CommunicationConfig } from '../../communication/config/communication.config';
import { LoginHistoryService } from './login-history.service';
import { AccountSecurityService } from './account-security.service';
import { LoginDto } from '../dto/login.dto';
import { ForgotPasswordDto } from '../dto/forgot-password.dto';
import { ResetPasswordDto } from '../dto/reset-password.dto';
import { ChangePasswordDto } from '../dto/change-password.dto';
import { AuthResponse } from '../interfaces/auth-response.interface';
import * as crypto from 'crypto';
import {
  CommunicationEventBus,
  CommunicationEventType,
} from '../../communication/events/communication-event.bus';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly passwordService: PasswordService,
    private readonly tokenService: TokenService,
    private readonly sessionService: SessionService,
    private readonly loginHistoryService: LoginHistoryService,
    private readonly accountSecurityService: AccountSecurityService,
    private readonly eventBus: CommunicationEventBus,
  ) {}

  async login(
    loginDto: LoginDto,
    deviceInfo?: { ipAddress: string; browser: string; operatingSystem: string; device: string },
  ): Promise<AuthResponse> {
    try {
      const result = await this.executeLogin(loginDto, deviceInfo);
      observabilityEventBus.emit('auth.event', {
        action: 'login',
        employeeCode: result.user.employeeCode,
        success: true,
      });
      return result;
    } catch (err: any) {
      observabilityEventBus.emit('auth.event', {
        action: 'login',
        employeeCode: loginDto.email,
        success: false,
        error: err.message || String(err),
      });
      throw err;
    }
  }

  private async executeLogin(
    loginDto: LoginDto,
    deviceInfo?: { ipAddress: string; browser: string; operatingSystem: string; device: string },
  ): Promise<AuthResponse> {
    const user = await this.prisma.user.findUnique({
      where: { email: loginDto.email },
      include: {
        department: true,
        role: {
          include: {
            rolePermissions: {
              include: { permission: true },
              where: { isDeleted: false },
            },
          },
        },
      },
    });

    if (!user || user.isDeleted) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (user.status !== 'ACTIVE') {
      throw new UnauthorizedException('Your account is inactive');
    }

    await this.accountSecurityService.checkAccountLocked(user.id, user);

    const isPasswordValid = await this.passwordService.compare(loginDto.password, user.password);

    if (!isPasswordValid) {
      await this.accountSecurityService.recordFailedAttempt(user.id);
      await this.loginHistoryService.recordLogin({
        userId: user.id,
        ipAddress: deviceInfo?.ipAddress || 'unknown',
        browser: deviceInfo?.browser || 'unknown',
        operatingSystem: deviceInfo?.operatingSystem || 'unknown',
        device: deviceInfo?.device || 'unknown',
        success: false,
        failureReason: 'Invalid password',
      });
      throw new UnauthorizedException('Invalid email or password');
    }

    await this.accountSecurityService.resetFailedAttempts(user.id);

    const accessToken = await this.tokenService.generateAccessToken(user.id, user.email);
    const refreshToken = await this.tokenService.generateRefreshToken(user.id, user.email);

    const hashedToken = this.tokenService.hashToken(refreshToken);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const description = JSON.stringify({
      ipAddress: deviceInfo?.ipAddress || 'unknown',
      browser: deviceInfo?.browser || 'unknown',
      operatingSystem: deviceInfo?.operatingSystem || 'unknown',
      device: deviceInfo?.device || 'unknown',
      success: true,
    });

    // Safely consolidate independent post-login database operations in a single atomic transaction
    await this.prisma.$transaction([
      this.prisma.refreshToken.create({
        data: {
          userId: user.id,
          token: hashedToken,
          expiresAt,
        },
      }),
      this.prisma.userSession.create({
        data: {
          userId: user.id,
          sessionToken: hashedToken,
          refreshToken: hashedToken,
          ipAddress: deviceInfo?.ipAddress || 'unknown',
          browser: deviceInfo?.browser || 'unknown',
          operatingSystem: deviceInfo?.operatingSystem || 'unknown',
          device: deviceInfo?.device || 'unknown',
          status: 'ACTIVE',
          expiresAt,
        },
      }),
      this.prisma.user.update({
        where: { id: user.id },
        data: {
          failedLoginAttempts: 0,
          lockedAt: null,
          lockedUntil: null,
          lastLogin: new Date(),
        },
      }),
      this.prisma.activityLog.create({
        data: {
          userId: user.id,
          activity: 'LOGIN_SUCCESS',
          module: 'AUTH',
          description,
        },
      }),
    ]);

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        employeeCode: user.employeeCode,
        department: {
          id: user.department.id,
          departmentCode: user.department.departmentCode,
          departmentName: user.department.departmentName,
        },
        role: {
          id: user.role.id,
          roleName: user.role.roleName,
        },
        permissions: user.role.rolePermissions.map((rp) => rp.permission.code),
      },
    };
  }

  async logout(
    userId: string,
    refreshToken: string,
    _deviceInfo?: { ipAddress: string; browser: string; operatingSystem: string; device: string },
  ): Promise<void> {
    await this.sessionService.revokeAllSessions(userId);
    await this.tokenService.revokeRefreshToken(refreshToken);
    await this.loginHistoryService.recordLogout(userId);
    observabilityEventBus.emit('auth.event', {
      action: 'logout',
      employeeCode: userId,
      success: true,
    });
  }

  async refresh(userId: string, refreshToken: string): Promise<AuthResponse> {
    try {
      const result = await this.executeRefresh(userId, refreshToken);
      observabilityEventBus.emit('auth.event', {
        action: 'refresh',
        employeeCode: userId,
        success: true,
      });
      return result;
    } catch (err: any) {
      observabilityEventBus.emit('auth.event', {
        action: 'refresh',
        employeeCode: userId,
        success: false,
        error: err.message || String(err),
      });
      throw err;
    }
  }

  private async executeRefresh(userId: string, refreshToken: string): Promise<AuthResponse> {
    const payload = await this.tokenService.verifyRefreshToken(refreshToken);

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      include: {
        department: true,
        role: {
          include: {
            rolePermissions: {
              include: { permission: true },
              where: { isDeleted: false },
            },
          },
        },
      },
    });

    if (!user || user.isDeleted || user.status !== 'ACTIVE') {
      throw new UnauthorizedException('User is inactive or not found');
    }

    const hashedOldToken = this.tokenService.hashToken(refreshToken);
    await this.tokenService.revokeRefreshToken(refreshToken);

    await this.sessionService.revokeSessionByToken(hashedOldToken, user.id);

    const newAccessToken = await this.tokenService.generateAccessToken(user.id, user.email);
    const newRefreshToken = await this.tokenService.generateRefreshToken(user.id, user.email);

    await this.tokenService.saveRefreshToken(user.id, newRefreshToken);

    const hashedNewToken = this.tokenService.hashToken(newRefreshToken);
    await this.sessionService.createSession({
      userId: user.id,
      sessionToken: hashedNewToken,
      refreshToken: hashedNewToken,
      ipAddress: 'unknown',
      browser: 'unknown',
      operatingSystem: 'unknown',
      device: 'unknown',
    });

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        employeeCode: user.employeeCode,
        department: {
          id: user.department.id,
          departmentCode: user.department.departmentCode,
          departmentName: user.department.departmentName,
        },
        role: {
          id: user.role.id,
          roleName: user.role.roleName,
        },
        permissions: user.role.rolePermissions.map((rp) => rp.permission.code),
      },
    };
  }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { email: forgotPasswordDto.email },
    });

    if (!user || user.isDeleted || user.status !== 'ACTIVE') {
      return;
    }

    const token = crypto.randomUUID();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1);

    await this.prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        token,
        expiresAt,
      },
    });

    const frontendUrl = CommunicationConfig.getFrontendUrl();
    console.info(`[STUB] Password Reset Link: ${frontendUrl}/reset-password?token=${token}`);

    this.eventBus.emit(CommunicationEventType.PASSWORD_RESET, {
      email: user.email,
      name: user.firstName,
      resetUrl: `${frontendUrl}/reset-password?token=${token}`,
    });
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto): Promise<void> {
    const resetToken = await this.prisma.passwordResetToken.findUnique({
      where: { token: resetPasswordDto.token },
    });

    if (
      !resetToken ||
      resetToken.isDeleted ||
      resetToken.usedAt !== null ||
      new Date() > resetToken.expiresAt
    ) {
      throw new BadRequestException('Invalid or expired password reset token');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: resetToken.userId },
    });

    if (!user || user.isDeleted || user.status !== 'ACTIVE') {
      throw new BadRequestException('Associated user not found or inactive');
    }

    const hashedPassword = await this.passwordService.hash(resetPasswordDto.password);

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: user.id },
        data: {
          password: hashedPassword,
          lastPasswordChange: new Date(),
        },
      }),
      this.prisma.passwordResetToken.update({
        where: { token: resetToken.token },
        data: {
          usedAt: new Date(),
          isDeleted: true,
          deletedAt: new Date(),
        },
      }),
    ]);

    await this.tokenService.revokeAllRefreshTokensForUser(user.id);
    await this.sessionService.revokeAllSessions(user.id);

    await this.prisma.activityLog.create({
      data: {
        userId: user.id,
        activity: 'PASSWORD_RESET',
        module: 'SECURITY',
        description: 'Password reset completed via token',
      },
    });

    const frontendUrl = CommunicationConfig.getFrontendUrl();
    const loginUrl = `${frontendUrl}/login`;
    this.eventBus.emit(CommunicationEventType.PASSWORD_CHANGED, {
      email: user.email,
      name: `${user.firstName} ${user.lastName}`,
      changeDate: new Date().toLocaleString(),
      loginUrl,
      securityUrl: `${frontendUrl}/security-logs`,
    });
  }

  async changePassword(userId: string, changePasswordDto: ChangePasswordDto): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || user.isDeleted || user.status !== 'ACTIVE') {
      throw new UnauthorizedException('User not found or inactive');
    }

    const isCurrentPasswordValid = await this.passwordService.compare(
      changePasswordDto.currentPassword,
      user.password,
    );

    if (!isCurrentPasswordValid) {
      throw new BadRequestException('Incorrect current password');
    }

    const hashedNewPassword = await this.passwordService.hash(changePasswordDto.newPassword);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedNewPassword,
        lastPasswordChange: new Date(),
      },
    });

    await this.tokenService.revokeAllRefreshTokensForUser(user.id);
    await this.sessionService.revokeAllSessions(user.id);
    await this.accountSecurityService.resetFailedAttempts(user.id);

    await this.prisma.activityLog.create({
      data: {
        userId,
        activity: 'PASSWORD_CHANGE',
        module: 'SECURITY',
        description: 'Password changed successfully',
      },
    });
  }
}
