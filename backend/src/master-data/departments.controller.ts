import { Controller, Get, Query } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';

@Controller('departments')
export class DepartmentsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @Permissions(
    'departments.view',
    'indent.view',
    'indent.create',
    'inventory.view',
    'production.view',
    'costsheet.view',
    'reports.view',
    'notifications.view',
  )
  async list(@Query() query: PaginationQueryDto) {
    if (!query.page && !query.limit) {
      return this.prisma.department.findMany({
        where: { isDeleted: false },
        orderBy: { departmentName: 'asc' },
      });
    }

    const pageNumber = Math.max(1, query.page || 1);
    const pageSize = Math.max(1, query.limit || 10);
    const where = { isDeleted: false };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.department.findMany({
        where,
        orderBy: { departmentName: 'asc' },
        skip: (pageNumber - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.department.count({ where }),
    ]);

    return {
      items,
      total,
      page: pageNumber,
      limit: pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }
}
