import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { PrismaService } from '../prisma/prisma.service';
import { CommunicationService } from './communication.service';
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

class TestEmailDto {
  @IsString()
  @IsNotEmpty()
  to: string;

  @IsString()
  @IsOptional()
  subject?: string;
}

@Controller('admin/communication')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
export class CommunicationController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly communicationService: CommunicationService,
  ) {}

  /**
   * GET /admin/communication/logs
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
      data: logs,
      meta: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    };
  }

  /**
   * POST /admin/communication/test
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
      messageId: result.messageId,
    };
  }
}
