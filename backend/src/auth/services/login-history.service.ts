import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class LoginHistoryService {
  constructor(private readonly prisma: PrismaService) {}

  async recordLogin(data: {
    userId: string;
    ipAddress: string;
    browser: string;
    operatingSystem: string;
    device: string;
    success: boolean;
    failureReason?: string;
  }) {
    const description = JSON.stringify({
      ipAddress: data.ipAddress,
      browser: data.browser,
      operatingSystem: data.operatingSystem,
      device: data.device,
      success: data.success,
      failureReason: data.failureReason || null,
    });

    return this.prisma.activityLog.create({
      data: {
        userId: data.userId,
        activity: data.success ? 'LOGIN_SUCCESS' : 'LOGIN_FAILED',
        module: 'AUTH',
        description,
      },
    });
  }

  async recordLogout(userId: string, sessionId?: string) {
    const description = JSON.stringify({
      sessionId: sessionId || null,
      timestamp: new Date().toISOString(),
    });

    return this.prisma.activityLog.create({
      data: {
        userId,
        activity: 'LOGOUT',
        module: 'AUTH',
        description,
      },
    });
  }

  async getLoginHistory(userId: string, limit = 50) {
    const logs = await this.prisma.activityLog.findMany({
      where: {
        userId,
        module: 'AUTH',
        activity: { in: ['LOGIN_SUCCESS', 'LOGIN_FAILED', 'LOGOUT'] },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return logs.map((log) => {
      let details: any = {};
      try {
        details = JSON.parse(log.description);
      } catch {
        details = { raw: log.description };
      }
      return {
        id: log.id,
        activity: log.activity,
        timestamp: log.createdAt,
        ipAddress: details.ipAddress || null,
        browser: details.browser || null,
        operatingSystem: details.operatingSystem || null,
        device: details.device || null,
        success: details.success,
        failureReason: details.failureReason || null,
      };
    });
  }

  async getRecentLoginHistory(userId: string, limit = 10) {
    return this.getLoginHistory(userId, limit);
  }
}
