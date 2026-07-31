import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUnitDto } from './dto/create-unit.dto';
import { UpdateUnitDto } from './dto/update-unit.dto';
import { UnitQueryDto } from './dto/unit-query.dto';
import { UnitResponseDto } from './dto/unit-response.dto';
import { UNIT_MESSAGES } from './constants/unit-messages.constants';
import { Prisma } from '@prisma/client';

@Injectable()
export class UnitsService {
  constructor(private readonly prisma: PrismaService) {}

  private mapToUnitResponse(unit: any): UnitResponseDto {
    return {
      id: unit.id,
      unitCode: unit.unitCode,
      unitName: unit.unitName,
      symbol: unit.symbol,
      createdAt: unit.createdAt,
      updatedAt: unit.updatedAt,
    };
  }

  private async createAuditLog(
    action: string,
    recordId: string,
    oldValue: any | null,
    newValue: any | null,
    performedBy?: string,
  ): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          module: 'Unit',
          recordId,
          action,
          oldValue: oldValue ? JSON.parse(JSON.stringify(oldValue)) : Prisma.JsonNull,
          newValue: newValue ? JSON.parse(JSON.stringify(newValue)) : Prisma.JsonNull,
          performedBy: performedBy ?? null,
        },
      });
    } catch {
      // Audit failure logging catch to ensure execution integrity
    }
  }

  private async assertCodeAvailable(unitCode: string, excludeId?: string): Promise<void> {
    const existing = await this.prisma.unit.findFirst({
      where: {
        unitCode,
        isDeleted: false,
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
    });
    if (existing) {
      throw new ConflictException(UNIT_MESSAGES.DUPLICATE_CODE);
    }
  }

  async createUnit(dto: CreateUnitDto, performingUserId?: string): Promise<UnitResponseDto> {
    await this.assertCodeAvailable(dto.unitCode);

    const newUnit = await this.prisma.unit.create({
      data: {
        unitCode: dto.unitCode,
        unitName: dto.unitName,
        symbol: dto.symbol,
        createdBy: performingUserId,
      },
    });

    const response = this.mapToUnitResponse(newUnit);
    await this.createAuditLog('CREATE', newUnit.id, null, response, performingUserId);

    return response;
  }

  async findAllUnits(query: UnitQueryDto): Promise<{
    items: UnitResponseDto[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const page = Math.max(1, query.page ?? 1);
    const limit = Math.max(1, Math.min(100, query.limit ?? 10));
    const skip = (page - 1) * limit;

    const where: Prisma.UnitWhereInput = {
      isDeleted: false,
    };

    if (query.search) {
      const searchTerm = query.search.trim();
      where.OR = [
        { unitCode: { contains: searchTerm, mode: 'insensitive' } },
        { unitName: { contains: searchTerm, mode: 'insensitive' } },
        { symbol: { contains: searchTerm, mode: 'insensitive' } },
      ];
    }

    const [units, total] = await Promise.all([
      this.prisma.unit.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.unit.count({ where }),
    ]);

    const items = units.map((u) => this.mapToUnitResponse(u));
    const totalPages = Math.ceil(total / limit);

    return {
      items,
      total,
      page,
      limit,
      totalPages,
    };
  }

  async findUnitById(id: string): Promise<UnitResponseDto> {
    const unit = await this.prisma.unit.findFirst({
      where: { id, isDeleted: false },
    });

    if (!unit) {
      throw new NotFoundException(UNIT_MESSAGES.NOT_FOUND);
    }

    return this.mapToUnitResponse(unit);
  }

  async updateUnit(
    id: string,
    dto: UpdateUnitDto,
    performingUserId?: string,
  ): Promise<UnitResponseDto> {
    const currentUnit = await this.prisma.unit.findFirst({
      where: { id, isDeleted: false },
    });

    if (!currentUnit) {
      throw new NotFoundException(UNIT_MESSAGES.NOT_FOUND);
    }

    if (dto.unitCode && dto.unitCode !== currentUnit.unitCode) {
      await this.assertCodeAvailable(dto.unitCode, id);
    }

    const updatedUnit = await this.prisma.unit.update({
      where: { id },
      data: {
        ...(dto.unitCode && { unitCode: dto.unitCode }),
        ...(dto.unitName && { unitName: dto.unitName }),
        ...(dto.symbol && { symbol: dto.symbol }),
        updatedBy: performingUserId,
      },
    });

    const oldResponse = this.mapToUnitResponse(currentUnit);
    const newResponse = this.mapToUnitResponse(updatedUnit);
    await this.createAuditLog('UPDATE', id, oldResponse, newResponse, performingUserId);

    return newResponse;
  }

  async softDeleteUnit(id: string, performingUserId?: string): Promise<{ message: string }> {
    const currentUnit = await this.prisma.unit.findFirst({
      where: { id, isDeleted: false },
    });

    if (!currentUnit) {
      throw new NotFoundException(UNIT_MESSAGES.NOT_FOUND);
    }

    const [materialReferences, indentItemReferences, amrItemReferences] = await Promise.all([
      this.prisma.material.count({ where: { unitId: id, isDeleted: false } }),
      this.prisma.indentItem.count({ where: { unitId: id, isDeleted: false } }),
      this.prisma.additionalMaterialItem.count({ where: { unitId: id, isDeleted: false } }),
    ]);

    if (materialReferences > 0 || indentItemReferences > 0 || amrItemReferences > 0) {
      throw new BadRequestException(UNIT_MESSAGES.IN_USE_DELETE);
    }

    await this.prisma.unit.update({
      where: { id },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
        deletedBy: performingUserId,
      },
    });

    await this.createAuditLog('DELETE', id, null, null, performingUserId);

    return { message: UNIT_MESSAGES.DELETED_SUCCESS };
  }

  async restoreUnit(id: string, performingUserId?: string): Promise<UnitResponseDto> {
    const currentUnit = await this.prisma.unit.findFirst({
      where: { id, isDeleted: true },
    });

    if (!currentUnit) {
      throw new NotFoundException(UNIT_MESSAGES.NOT_FOUND);
    }

    const restoredUnit = await this.prisma.unit.update({
      where: { id },
      data: {
        isDeleted: false,
        deletedAt: null,
        updatedBy: performingUserId,
      },
    });

    const response = this.mapToUnitResponse(restoredUnit);
    await this.createAuditLog('RESTORE', id, null, response, performingUserId);

    return response;
  }
}
