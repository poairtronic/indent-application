import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto, UpdateProductDto } from './dto/product.dto';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { Cache } from '../redis-cache/decorators/cache.decorator';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';

import { RedisCacheService } from '../redis-cache/redis-cache.service';

@Controller('products')
export class ProductsController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cacheService: RedisCacheService,
  ) {}

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

  @Post()
  @Permissions('products.create')
  async create(@Body() createProductDto: CreateProductDto) {
    const product = await this.prisma.product.create({
      data: {
        ...createProductDto,
        status: createProductDto.status || 'ACTIVE',
      },
    });
    await this.cacheService.invalidateByPattern('master:products:*');
    return product;
  }

  @Put(':id')
  @Permissions('products.update')
  async update(@Param('id') id: string, @Body() updateProductDto: UpdateProductDto) {
    try {
      const product = await this.prisma.product.update({
        where: { id },
        data: updateProductDto,
      });
      await this.cacheService.invalidateByPattern('master:products:*');
      return product;
    } catch {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }
  }

  @Delete(':id')
  @Permissions('products.delete')
  async remove(@Param('id') id: string) {
    try {
      const product = await this.prisma.product.update({
        where: { id },
        data: {
          isDeleted: true,
          deletedAt: new Date(),
        },
      });
      await this.cacheService.invalidateByPattern('master:products:*');
      return product;
    } catch {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }
  }
}
