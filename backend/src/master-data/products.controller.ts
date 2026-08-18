import { Controller, Get, Query } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { Cache } from '../redis-cache/decorators/cache.decorator';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';

@Controller('products')
export class ProductsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @Permissions('products.view')
  @Cache('master:products', 3600)
  async list(@Query() query: PaginationQueryDto) {
    const pageNumber = Math.max(1, query.page || 1);
    const pageSize = Math.max(1, query.limit || 10);
    const where = { isDeleted: false };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.product.findMany({
        where,
        orderBy: { productName: 'asc' },
        skip: (pageNumber - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.product.count({ where }),
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
