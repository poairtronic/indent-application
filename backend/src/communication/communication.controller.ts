import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { PrismaService } from '../prisma/prisma.service';
import { CommunicationService } from './communication.service';
import { CommunicationConfig } from './config/communication.config';
import { QueueService } from './queue/queue.service';
import { NodemailerProvider } from './providers/nodemailer.provider';
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
    private readonly queueService: QueueService,
    private readonly nodemailerProvider: NodemailerProvider,
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
   * Dispatches a test layout email to verify SMTP transporter configurations.
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
   * GET /communication/health
   * Connectivity diagnostics for SMTP and Redis.
   */
  @Get('health')
  @Permissions('settings.manage')
  async getHealth() {
    const [redisStatus, smtpStatus] = await Promise.all([
      this.queueService.checkRedisHealth(),
      this.nodemailerProvider.verifySmtp(),
    ]);

    // Overall status: UP only if both are healthy. SMTP degraded = DEGRADED overall.
    // SMTP failure does NOT kill core business APIs — it only degrades the notification subsystem.
    let overall: string = 'UP';
    if (redisStatus !== 'UP' || smtpStatus !== 'ok') {
      overall = 'DEGRADED';
    }
    if (redisStatus === 'DOWN' && smtpStatus === 'unavailable') {
      overall = 'DOWN';
    }

    return {
      status: overall,
      redis: redisStatus,
      smtp: smtpStatus,
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
