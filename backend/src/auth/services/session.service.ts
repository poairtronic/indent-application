import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { observabilityEventBus } from '../../observability/observability-event-bus';

@Injectable()
export class SessionService {
  constructor(private readonly prisma: PrismaService) {}

  async createSession(data: {
    userId: string;
    sessionToken: string;
    refreshToken: string;
    ipAddress: string;
    browser: string;
    operatingSystem: string;
    device: string;
    country?: string;
    city?: string;
  }) {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    return this.prisma.userSession.create({
      data: {
        userId: data.userId,
        sessionToken: data.sessionToken,
        refreshToken: data.refreshToken,
        ipAddress: data.ipAddress,
        browser: data.browser,
        operatingSystem: data.operatingSystem,
        device: data.device,
        country: data.country,
        city: data.city,
        status: 'ACTIVE',
        expiresAt,
      },
    });
  }

  async getUserSessions(userId: string) {
    return this.prisma.userSession.findMany({
      where: { userId, isDeleted: false },
      orderBy: { loginAt: 'desc' },
    });
  }

  async getActiveSessions(userId: string) {
    return this.prisma.userSession.findMany({
      where: {
        userId,
        isDeleted: false,
        status: 'ACTIVE',
        logoutAt: null,
      },
      orderBy: { loginAt: 'desc' },
    });
  }

  async getSessionById(sessionId: string) {
    const session = await this.prisma.userSession.findFirst({
      where: { id: sessionId, isDeleted: false },
    });
    if (!session) {
      throw new NotFoundException('Session not found');
    }
    return session;
  }

  async revokeSession(sessionId: string, userId: string) {
    const session = await this.getSessionById(sessionId);
    if (session.userId !== userId) {
      throw new ForbiddenException('You can only revoke your own sessions');
    }
    const result = await this.prisma.userSession.update({
      where: { id: sessionId },
      data: {
        status: 'REVOKED',
        logoutAt: new Date(),
        isDeleted: true,
        deletedAt: new Date(),
      },
    });
    observabilityEventBus.emit('auth.event', {
      action: 'session_revocation',
      employeeCode: userId,
      success: true,
    });
    return result;
  }

  async revokeOtherSessions(currentSessionId: string, userId: string) {
    const result = await this.prisma.userSession.updateMany({
      where: {
        userId,
        id: { not: currentSessionId },
        isDeleted: false,
        status: 'ACTIVE',
      },
      data: {
        status: 'REVOKED',
        logoutAt: new Date(),
        isDeleted: true,
        deletedAt: new Date(),
      },
    });
    observabilityEventBus.emit('auth.event', {
      action: 'session_revocation',
      employeeCode: userId,
      success: true,
    });
    return result;
  }

  async revokeAllSessions(userId: string) {
    const result = await this.prisma.userSession.updateMany({
      where: { userId, isDeleted: false, status: 'ACTIVE' },
      data: {
        status: 'REVOKED',
        logoutAt: new Date(),
        isDeleted: true,
        deletedAt: new Date(),
      },
    });
    observabilityEventBus.emit('auth.event', {
      action: 'session_revocation',
      employeeCode: userId,
      success: true,
    });
    return result;
  }

  async updateLastActivity(sessionToken: string) {
    return this.prisma.userSession.updateMany({
      where: { sessionToken, isDeleted: false },
      data: { lastActivity: new Date() },
    });
  }

  async expireSessions() {
    return this.prisma.userSession.updateMany({
      where: {
        status: 'ACTIVE',
        expiresAt: { lt: new Date() },
      },
      data: {
        status: 'EXPIRED',
        logoutAt: new Date(),
      },
    });
  }
}
