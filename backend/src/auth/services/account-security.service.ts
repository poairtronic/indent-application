import { Injectable, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

const MAX_FAILED_ATTEMPTS = 5;
const LOCK_DURATION_MINUTES = 30;

@Injectable()
export class AccountSecurityService {
  constructor(private readonly prisma: PrismaService) {}

  async checkAccountLocked(userId: string): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || user.isDeleted) return;

    if (user.status === 'INACTIVE' || user.status === 'SUSPENDED') {
      throw new ForbiddenException('Your account has been suspended. Contact administrator.');
    }

    if (user.lockedUntil && user.lockedUntil > new Date()) {
      const remainingMs = user.lockedUntil.getTime() - Date.now();
      const remainingMin = Math.ceil(remainingMs / 60000);
      throw new ForbiddenException(`Account is locked. Try again in ${remainingMin} minute(s).`);
    }

    if (user.lockedUntil && user.lockedUntil <= new Date()) {
      await this.resetFailedAttempts(userId);
    }
  }

  async recordFailedAttempt(userId: string): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) return;

    const newCount = user.failedLoginAttempts + 1;

    if (newCount >= MAX_FAILED_ATTEMPTS) {
      const lockedUntil = new Date();
      lockedUntil.setMinutes(lockedUntil.getMinutes() + LOCK_DURATION_MINUTES);

      await this.prisma.user.update({
        where: { id: userId },
        data: {
          failedLoginAttempts: newCount,
          lockedAt: new Date(),
          lockedUntil,
        },
      });

      await this.prisma.activityLog.create({
        data: {
          userId,
          activity: 'ACCOUNT_LOCKED',
          module: 'SECURITY',
          description: JSON.stringify({
            reason: `Account locked after ${newCount} failed login attempts`,
            lockedUntil: lockedUntil.toISOString(),
          }),
        },
      });
    } else {
      await this.prisma.user.update({
        where: { id: userId },
        data: { failedLoginAttempts: newCount },
      });
    }
  }

  async resetFailedAttempts(userId: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        failedLoginAttempts: 0,
        lockedAt: null,
        lockedUntil: null,
      },
    });
  }

  async unlockAccount(userId: string, adminUserId?: string): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    await this.resetFailedAttempts(userId);

    await this.prisma.activityLog.create({
      data: {
        userId,
        activity: 'ACCOUNT_UNLOCKED',
        module: 'SECURITY',
        description: JSON.stringify({
          unlockedBy: adminUserId || userId,
          reason: adminUserId ? 'Unlocked by administrator' : 'Automatic unlock after timeout',
        }),
      },
    });
  }

  async getSecurityStatus(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        status: true,
        lastLogin: true,
        failedLoginAttempts: true,
        lockedAt: true,
        lockedUntil: true,
        lastPasswordChange: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    const isLocked = !!(user.lockedUntil && user.lockedUntil > new Date());
    const passwordAgeDays = user.lastPasswordChange
      ? Math.floor((Date.now() - user.lastPasswordChange.getTime()) / (1000 * 60 * 60 * 24))
      : null;

    return {
      userId: user.id,
      accountStatus: user.status,
      isLocked,
      lockedAt: user.lockedAt,
      lockedUntil: user.lockedUntil,
      lastLogin: user.lastLogin,
      failedLoginAttempts: user.failedLoginAttempts,
      remainingAttempts: Math.max(0, MAX_FAILED_ATTEMPTS - user.failedLoginAttempts),
      maxFailedAttempts: MAX_FAILED_ATTEMPTS,
      lockDurationMinutes: LOCK_DURATION_MINUTES,
      passwordAgeDays,
      accountCreatedAt: user.createdAt,
      lastUpdatedAt: user.updatedAt,
    };
  }

  async recordPasswordChange(userId: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { lastPasswordChange: new Date() },
    });
  }
}
