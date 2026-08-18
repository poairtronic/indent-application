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
import { Permissions } from '../auth/decorators/permissions.decorator';
import { Cache } from '../redis-cache/decorators/cache.decorator';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { CreateMaterialDto, UpdateMaterialDto } from './dto/material.dto';

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

  @Post()
  @Permissions('materials.create')
  async create(@Body() createMaterialDto: CreateMaterialDto) {
    const minStock = createMaterialDto.minStock ? createMaterialDto.minStock.toString() : '0';
    const maxStock = createMaterialDto.maxStock ? createMaterialDto.maxStock.toString() : '0';
    return this.prisma.material.create({
      data: {
        ...createMaterialDto,
        minimumStock: minStock,
        maximumStock: maxStock,
        currentStock: '0',
        category: createMaterialDto.category || 'UNCATEGORIZED',
        status: createMaterialDto.status || 'ACTIVE',
      },
    });
  }

  @Put(':id')
  @Permissions('materials.update')
  async update(@Param('id') id: string, @Body() updateMaterialDto: UpdateMaterialDto) {
    const data: any = { ...updateMaterialDto };
    if (data.minStock !== undefined) {
      data.minimumStock = data.minStock.toString();
      delete data.minStock;
    }
    if (data.maxStock !== undefined) {
      data.maximumStock = data.maxStock.toString();
      delete data.maxStock;
    }

    try {
      return await this.prisma.material.update({
        where: { id },
        data,
      });
    } catch {
      throw new NotFoundException(`Material with ID ${id} not found`);
    }
  }

  @Delete(':id')
  @Permissions('materials.delete')
  async remove(@Param('id') id: string) {
    try {
      return await this.prisma.material.update({
        where: { id },
        data: {
          isDeleted: true,
          deletedAt: new Date(),
        },
      });
    } catch {
      throw new NotFoundException(`Material with ID ${id} not found`);
    }
  }
}
