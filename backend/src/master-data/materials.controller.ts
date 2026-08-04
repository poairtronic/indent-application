import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';

@Controller('materials')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class MaterialsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @Permissions('materials.view')
  async list(@Query('page') page = '1', @Query('limit') limit = '10') {
    const pageNumber = Math.max(1, Number(page) || 1);
    const pageSize = Math.max(1, Number(limit) || 10);
    const where = { isDeleted: false };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.material.findMany({ where, include: { unit: true }, orderBy: { materialName: 'asc' }, skip: (pageNumber - 1) * pageSize, take: pageSize }),
      this.prisma.material.count({ where }),
    ]);
    return { items, total, page: pageNumber, limit: pageSize, totalPages: Math.ceil(total / pageSize) };
  }
}
