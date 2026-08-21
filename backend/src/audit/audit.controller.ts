import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { PrismaService } from '../prisma/prisma.service';
import { AuditQueryDto } from './dto/audit-query.dto';

@ApiTags('Audit Logs')
@ApiBearerAuth()
@Controller('audit-logs')
export class AuditController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @Permissions('audit.view')
  @ApiOperation({ summary: 'List audit logs with pagination and filtering' })
  async list(@Query() query: AuditQueryDto) {
    const pageNum = query.page || 1;
    const limitNum = query.limit || 50;
    const offset = (pageNum - 1) * limitNum;
    const module = query.module;
    const action = query.action;
    const search = query.search;
    const sortBy = query.sortBy || 'createdAt';
    const sortOrder = query.sortOrder || 'desc';

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
        select: {
          id: true,
          module: true,
          recordId: true,
          action: true,
          oldValue: true,
          newValue: true,
          performedBy: true,
          ipAddress: true,
          browser: true,
          operatingSystem: true,
          device: true,
          createdAt: true,
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
