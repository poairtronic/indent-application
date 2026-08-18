import { Controller, Get, Query } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { Cache } from '../redis-cache/decorators/cache.decorator';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';

@Controller('materials')
export class MaterialsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @Permissions('materials.view')
  @Cache('master:materials', 3600)
  async list(@Query() query: PaginationQueryDto) {
    const pageNumber = Math.max(1, query.page || 1);
    const pageSize = Math.max(1, query.limit || 10);
    const where = { isDeleted: false };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.material.findMany({
        where,
        include: { unit: true },
        orderBy: { materialName: 'asc' },
        skip: (pageNumber - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.material.count({ where }),
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
