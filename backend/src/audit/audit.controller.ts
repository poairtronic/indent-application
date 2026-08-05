import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { PrismaService } from '../prisma/prisma.service';

@ApiTags('Audit Logs')
@ApiBearerAuth()
@Controller('audit-logs')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
export class AuditController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @Permissions('audit.view')
  @ApiOperation({ summary: 'List audit logs with pagination and filtering' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'module', required: false, type: String })
  @ApiQuery({ name: 'action', required: false, type: String })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'sortBy', required: false, type: String })
  @ApiQuery({ name: 'sortOrder', required: false, type: String })
  async list(
    @Query('page') page = '1',
    @Query('limit') limit = '50',
    @Query('module') module?: string,
    @Query('action') action?: string,
    @Query('search') search?: string,
    @Query('sortBy') sortBy = 'createdAt',
    @Query('sortOrder') sortOrder = 'desc',
  ) {
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 50;
    const offset = (pageNum - 1) * limitNum;

    const where: any = {};

    if (module) {
      where.module = { contains: module, mode: 'insensitive' };
    }

    if (action) {
      where.action = { contains: action, mode: 'insensitive' };
    }

    if (search) {
      where.OR = [
        { module: { contains: search, mode: 'insensitive' } },
        { action: { contains: search, mode: 'insensitive' } },
        { recordId: { contains: search, mode: 'insensitive' } },
      ];
    }

    const orderBy: any = {};
    if (sortBy === 'user') {
      orderBy.user = { firstName: sortOrder as 'asc' | 'desc' };
    } else {
      orderBy[sortBy] = sortOrder as 'asc' | 'desc';
    }

    const [logs, total] = await this.prisma.$transaction([
      this.prisma.auditLog.findMany({
        where,
        orderBy,
        skip: offset,
        take: limitNum,
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
              employeeCode: true,
            },
          },
        },
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    const items = logs.map((log) => ({
      id: log.id,
      module: log.module,
      recordId: log.recordId,
      action: log.action,
      oldValue: log.oldValue,
      newValue: log.newValue,
      performedBy: log.performedBy,
      user: log.user
        ? {
            firstName: log.user.firstName,
            lastName: log.user.lastName,
            employeeCode: log.user.employeeCode,
          }
        : null,
      ipAddress: log.ipAddress,
      browser: log.browser,
      operatingSystem: log.operatingSystem,
      device: log.device,
      createdAt: log.createdAt,
    }));

    return {
      items,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
    };
  }
}
