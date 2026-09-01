import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { PrismaService } from '../prisma/prisma.service';
import { CommunicationService } from './communication.service';
import { CommunicationConfig } from './config/communication.config';
import { PostgresQueueService } from './queue/postgres-queue.service';
import { EmailProviderFactory } from './providers/email-provider.factory';
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

import { CommunicationQueryDto } from '../common/dto/pagination-query.dto';

class TestEmailDto {
  @IsString()
  @IsNotEmpty()
  to: string;

  @IsString()
  @IsOptional()
  subject?: string;
}

@Controller('communication')
export class CommunicationController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly communicationService: CommunicationService,
    private readonly queueService: PostgresQueueService,
    private readonly emailProviderFactory: EmailProviderFactory,
  ) {}

  /**
   * GET /communication/logs
   * Fetches latest outbox transaction logs.
   * Gated: audit.view permission
   */
  @Get('logs')
  @Permissions('audit.view')
  async getEmailLogs(@Query() query: CommunicationQueryDto) {
    const pageNum = query.page || 1;
    const limitNum = query.limit || 50;
    const offset = (pageNum - 1) * limitNum;

    const where: any = {};
    if (query.status) {
      where.status = query.status;
    }

    const [logs, total] = await this.prisma.$transaction([
      this.prisma.emailLog.findMany({
        where,
        orderBy: { sentAt: 'desc' },
        skip: offset,
        take: limitNum,
        include: {
          user: {
            select: { firstName: true, lastName: true, employeeCode: true },
          },
        },
      }),
      this.prisma.emailLog.count({ where }),
    ]);

    return {
      items: logs,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
    };
  }

  /**
   * POST /communication/test
   * Dispatches a test layout email to verify email provider configurations.
   * Gated: settings.manage permission
   */
  @Post('test')
  @Permissions('settings.manage')
  async sendTestEmail(@Body() dto: TestEmailDto) {
    const result = await this.communicationService.sendEmail({
      to: dto.to,
      subject: dto.subject || 'MERC SMTP Integration Test Confirmation',
      templateName: 'welcome',
      templateContext: {
        name: 'Test User',
        employeeCode: 'ADMIN-SMTP-TEST',
        department: 'System Infrastructure Group',
        roleName: 'System Administrator',
        loginUrl: `${CommunicationConfig.getFrontendUrl()}/login`,
        supportEmail: CommunicationConfig.getAppMailConfig().supportEmail,
      },
    });

    return {
      success: true,
      message: 'Test email queue request completed successfully.',
      jobId: result.jobId,
    };
  }

  /**
   * POST /communication/retry-failed
   * Re-queues all failed, retrying, and dead-letter email jobs for immediate processing.
   * Gated: settings.manage permission
   */
  @Post('retry-failed')
  @Permissions('settings.manage')
  async retryFailedEmails() {
    const updatedJobs = await this.prisma.emailJob.updateMany({
      where: {
        status: { in: ['DEAD_LETTER', 'PROCESSING'] },
      },
      data: {
        status: 'PENDING',
        attempts: 0,
        availableAt: new Date(),
        lastError: null,
        lockedAt: null,
        lockedBy: null,
      },
    });

    // Also reset PENDING jobs that have delayed availableAt due to backoff
    const resetBackoffJobs = await this.prisma.emailJob.updateMany({
      where: {
        status: 'PENDING',
        availableAt: { gt: new Date() },
      },
      data: {
        availableAt: new Date(),
        attempts: 0,
        lastError: null,
        lockedAt: null,
        lockedBy: null,
      },
    });

    const updatedLogs = await this.prisma.emailLog.updateMany({
      where: {
        status: { in: ['DEAD_LETTER', 'FAILED', 'RETRYING'] },
      },
      data: {
        status: 'QUEUED',
        errorMessage: null,
      },
    });

    const totalJobs = updatedJobs.count + resetBackoffJobs.count;

    return {
      success: true,
      message: `Re-queued ${totalJobs} email jobs and ${updatedLogs.count} email logs for processing.`,
      jobsRequeued: totalJobs,
      logsRequeued: updatedLogs.count,
    };
  }

  /**
   * GET /communication/health
   * Connectivity diagnostics for active email provider and Redis.
   */
  @Get('health')
  @Permissions('settings.manage')
  async getHealth() {
    const [redisStatus, providerHealth] = await Promise.all([
      this.queueService.checkRedisHealth(),
      this.emailProviderFactory.verifyActiveProvider(),
    ]);

    let overall: string = 'UP';
    if (redisStatus !== 'UP' || providerHealth.status !== 'ok') {
      overall = 'DEGRADED';
    }
    if (redisStatus === 'DOWN' && providerHealth.status === 'unavailable') {
      overall = 'DOWN';
    }

    return {
      status: overall,
      redis: redisStatus,
      provider: providerHealth.provider,
      smtp: providerHealth.status,
      providerStatus: providerHealth.status,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * GET /communication/queue
   * Diagnostic summary statistics for active and dead queues.
   */
  @Get('queue')
  @Permissions('settings.manage')
  async getQueueStatus() {
    const stats = await this.queueService.getQueueStats();
    return {
      mailQueue: {
        active: stats.active,
        waiting: stats.waiting,
        delayed: stats.delayed,
        failed: stats.failed,
      },
      deadQueue: {
        total: stats.dead,
      },
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * GET /communication/metrics
   * Queue performance and throughput statistics.
   */
  @Get('metrics')
  @Permissions('settings.manage')
  async getMetrics() {
    const stats = await this.queueService.getQueueStats();
    const totalProcessed = stats.completed + stats.failed;
    const successRate = totalProcessed > 0 ? (stats.completed / totalProcessed) * 100 : 100;

    return {
      throughput: {
        totalProcessed,
        completed: stats.completed,
        failed: stats.failed,
        successRatePercentage: Math.round(successRate * 100) / 100,
      },
      timestamp: new Date().toISOString(),
    };
  }
}
