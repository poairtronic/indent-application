import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma/prisma.service';
import { jwtConstants } from '../constants/auth.constants';
import { JwtPayload } from '../interfaces/jwt-payload.interface';
import * as crypto from 'crypto';

@Injectable()
export class TokenService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  async generateAccessToken(userId: string, email: string): Promise<string> {
    const payload: JwtPayload = { sub: userId, email };
    return this.jwtService.sign(payload, {
      secret: jwtConstants.secret,
      expiresIn: jwtConstants.accessTokenExpiresIn,
    });
  }

  async generateRefreshToken(userId: string, email: string): Promise<string> {
    const payload: JwtPayload = { sub: userId, email };
    return this.jwtService.sign(payload, {
      secret: jwtConstants.refreshSecret,
      expiresIn: jwtConstants.refreshTokenExpiresIn,
    });
  }

  hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  async saveRefreshToken(userId: string, token: string): Promise<void> {
    const hashedToken = this.hashToken(token);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    await this.prisma.refreshToken.create({
      data: {
        userId,
        token: hashedToken,
        expiresAt,
      },
    });
  }

  async verifyRefreshToken(token: string): Promise<JwtPayload> {
    try {
      const payload = this.jwtService.verify<JwtPayload>(token, {
        secret: jwtConstants.refreshSecret,
      });

      const hashedToken = this.hashToken(token);
      const dbToken = await this.prisma.refreshToken.findUnique({
        where: { token: hashedToken },
      });

      if (
        !dbToken ||
        dbToken.isDeleted ||
        dbToken.revokedAt !== null ||
        new Date() > dbToken.expiresAt
      ) {
        throw new UnauthorizedException('Invalid or expired refresh token');
      }

      return payload;
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async revokeRefreshToken(token: string): Promise<void> {
    const hashedToken = this.hashToken(token);
    const dbToken = await this.prisma.refreshToken.findUnique({
      where: { token: hashedToken },
    });

    if (dbToken) {
      await this.prisma.refreshToken.update({
        where: { token: hashedToken },
        data: { revokedAt: new Date(), isDeleted: true, deletedAt: new Date() },
      });
    }
  }

  async revokeAllRefreshTokensForUser(userId: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { userId, isDeleted: false },
      data: { revokedAt: new Date(), isDeleted: true, deletedAt: new Date() },
    });
  }
}
