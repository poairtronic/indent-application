import { Controller, Get, Query } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { Cache } from '../redis-cache/decorators/cache.decorator';

@Controller('departments')
export class DepartmentsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @Permissions('departments.view')
  @Cache('master:departments', 86400)
  async list(@Query('page') page?: string, @Query('limit') limit?: string) {
    const items = await this.prisma.department.findMany({
      where: { isDeleted: false },
      orderBy: { departmentName: 'asc' },
    });
    if (!page && !limit) return items;
    const pageNumber = Math.max(1, Number(page) || 1);
    const pageSize = Math.max(1, Number(limit) || 10);
    return {
      items: items.slice((pageNumber - 1) * pageSize, pageNumber * pageSize),
      total: items.length,
      page: pageNumber,
      limit: pageSize,
      totalPages: Math.ceil(items.length / pageSize),
    };
  }
}
