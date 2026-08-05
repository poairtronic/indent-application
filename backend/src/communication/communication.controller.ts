import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { PrismaService } from '../prisma/prisma.service';
import { CommunicationService } from './communication.service';
import { QueueService } from './queue/queue.service';
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

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
  ) {}

  /**
   * GET /communication/logs
   * Fetches latest outbox transaction logs.
   * Gated: audit.view permission
   */
  @Get('logs')
  @Permissions('audit.view')
  async getEmailLogs(
    @Query('page') page = '1',
    @Query('limit') limit = '50',
    @Query('status') status?: string,
  ) {
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 50;
    const offset = (pageNum - 1) * limitNum;

    const where: any = {};
    if (status) {
      where.status = status;
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
      subject: dto.subject || 'IMCMS SMTP Integration Test Confirmation',
      templateName: 'welcome',
      templateContext: {
        name: 'IMCMS Integration Administrator',
        employeeCode: 'ADMIN-SMTP-TEST',
        department: 'System Infrastructure Group',
        role: 'Administrator',
        loginUrl: 'http://localhost:3000/login',
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
    const redisStatus = await this.queueService.checkRedisHealth();
    return {
      status: redisStatus === 'UP' ? 'UP' : 'DEGRADED',
      redis: redisStatus,
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
