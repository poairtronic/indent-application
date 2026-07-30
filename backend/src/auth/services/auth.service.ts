import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PasswordService } from './password.service';
import { TokenService } from './token.service';
import { LoginDto } from '../dto/login.dto';
import { ForgotPasswordDto } from '../dto/forgot-password.dto';
import { ResetPasswordDto } from '../dto/reset-password.dto';
import { ChangePasswordDto } from '../dto/change-password.dto';
import { AuthResponse } from '../interfaces/auth-response.interface';
import * as crypto from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly passwordService: PasswordService,
    private readonly tokenService: TokenService,
  ) {}

  async login(loginDto: LoginDto): Promise<AuthResponse> {
    const user = await this.prisma.user.findUnique({
      where: { email: loginDto.email },
      include: {
        department: true,
        role: true,
      },
    });

    if (!user || user.isDeleted) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (user.status !== 'ACTIVE') {
      throw new UnauthorizedException('Your account is inactive');
    }

    const isPasswordValid = await this.passwordService.compare(
      loginDto.password,
      user.password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const accessToken = await this.tokenService.generateAccessToken(
      user.id,
      user.email,
    );
    const refreshToken = await this.tokenService.generateRefreshToken(
      user.id,
      user.email,
    );

    await this.tokenService.saveRefreshToken(user.id, refreshToken);

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
      },
    };
  }

  async logout(userId: string, refreshToken: string): Promise<void> {
    await this.tokenService.revokeRefreshToken(refreshToken);
  }

  async refresh(userId: string, refreshToken: string): Promise<AuthResponse> {
    const payload = await this.tokenService.verifyRefreshToken(refreshToken);
    
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      include: {
        department: true,
        role: true,
      },
    });

    if (!user || user.isDeleted || user.status !== 'ACTIVE') {
      throw new UnauthorizedException('User is inactive or not found');
    }

    await this.tokenService.revokeRefreshToken(refreshToken);

    const newAccessToken = await this.tokenService.generateAccessToken(
      user.id,
      user.email,
    );
    const newRefreshToken = await this.tokenService.generateRefreshToken(
      user.id,
      user.email,
    );

    await this.tokenService.saveRefreshToken(user.id, newRefreshToken);

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

    console.log(`[STUB] Password Reset Link: http://localhost:5173/reset-password?token=${token}`);
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

    const hashedPassword = await this.passwordService.hash(
      resetPasswordDto.password,
    );

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: user.id },
        data: { password: hashedPassword },
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
  }

  async changePassword(
    userId: string,
    changePasswordDto: ChangePasswordDto,
  ): Promise<void> {
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

    const hashedNewPassword = await this.passwordService.hash(
      changePasswordDto.newPassword,
    );

    await this.prisma.user.update({
      where: { id: user.id },
      data: { password: hashedNewPassword },
    });

    await this.tokenService.revokeAllRefreshTokensForUser(user.id);
  }
}
