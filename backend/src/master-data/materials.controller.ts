import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
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

import { RedisCacheService } from '../redis-cache/redis-cache.service';
import { DocumentNumberService } from '../common/services/document-number.service';

@Controller('materials')
export class MaterialsController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cacheService: RedisCacheService,
    private readonly documentNumberService: DocumentNumberService,
  ) {}

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
    const { maxStock, densityKgPerDm3, materialCode, ...rest } = createMaterialDto;
    const maximumStock = maxStock ? maxStock.toString() : '0';
    const finalMaterialCode =
      materialCode && materialCode.startsWith('AGIPL-MAT-')
        ? materialCode
        : await this.documentNumberService.generateMaterialNumber();

    const material = await this.prisma.material.create({
      data: {
        ...rest,
        materialCode: finalMaterialCode,
        densityKgPerDm3: densityKgPerDm3 !== undefined ? densityKgPerDm3.toString() : null,
        maximumStock,
        currentStock: '0',
        category: createMaterialDto.category || 'UNCATEGORIZED',
        status: createMaterialDto.status || 'ACTIVE',
      },
    });
    await this.cacheService.invalidateByPattern('master:materials:*');
    return material;
  }

  @Put(':id')
  @Permissions('materials.update')
  async update(@Param('id') id: string, @Body() updateMaterialDto: UpdateMaterialDto) {
    return this.performUpdate(id, updateMaterialDto);
  }

  @Patch(':id')
  @Permissions('materials.update')
  async partialUpdate(@Param('id') id: string, @Body() updateMaterialDto: UpdateMaterialDto) {
    return this.performUpdate(id, updateMaterialDto);
  }

  private async performUpdate(id: string, updateMaterialDto: UpdateMaterialDto) {
    const data: any = { ...updateMaterialDto };
    if (data.densityKgPerDm3 !== undefined) {
      data.densityKgPerDm3 = data.densityKgPerDm3 !== null ? data.densityKgPerDm3.toString() : null;
    }
    if (data.maxStock !== undefined) {
      data.maximumStock = data.maxStock.toString();
      delete data.maxStock;
    }

    try {
      const material = await this.prisma.material.update({
        where: { id },
        data,
      });
      await this.cacheService.invalidateByPattern('master:materials:*');
      return material;
    } catch {
      throw new NotFoundException(`Material with ID ${id} not found`);
    }
  }

  @Delete(':id')
  @Permissions('materials.delete')
  async remove(@Param('id') id: string) {
    try {
      const material = await this.prisma.material.update({
        where: { id },
        data: {
          isDeleted: true,
          deletedAt: new Date(),
        },
      });
      await this.cacheService.invalidateByPattern('master:materials:*');
      return material;
    } catch {
      throw new NotFoundException(`Material with ID ${id} not found`);
    }
  }
}
