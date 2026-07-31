import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProcessDto } from './dto/create-process.dto';
import { UpdateProcessDto } from './dto/update-process.dto';
import { ProcessQueryDto } from './dto/process-query.dto';
import { ProcessResponseDto } from './dto/process-response.dto';
import { PROCESS_MESSAGES } from './constants/process-messages.constants';
import { Prisma, ProductStatus } from '@prisma/client';

@Injectable()
export class ProcessesService {
  constructor(private readonly prisma: PrismaService) {}

  private mapToProcessResponse(process: any): ProcessResponseDto {
    return {
      id: process.id,
      productId: process.productId,
      productCode: process.product?.productCode ?? undefined,
      processCode: process.processCode,
      processName: process.processName,
      description: process.description ?? null,
      sequence: process.sequence,
      estimatedHours: Number(process.estimatedHours),
      status: process.status,
      createdAt: process.createdAt,
      updatedAt: process.updatedAt,
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
          module: 'ManufacturingProcess',
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

  private async validateProduct(productId: string): Promise<void> {
    const product = await this.prisma.product.findUnique({ where: { id: productId } });
    if (!product || product.isDeleted || product.status !== ProductStatus.ACTIVE) {
      throw new BadRequestException(PROCESS_MESSAGES.INVALID_PRODUCT);
    }
  }

  private async assertCodeAvailable(
    productId: string,
    processCode: string,
    excludeId?: string,
  ): Promise<void> {
    const existing = await this.prisma.manufacturingProcess.findFirst({
      where: {
        productId,
        processCode,
        isDeleted: false,
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
    });
    if (existing) {
      throw new ConflictException(PROCESS_MESSAGES.DUPLICATE_CODE);
    }
  }

  private async assertSequenceAvailable(
    productId: string,
    sequence: number,
    excludeId?: string,
  ): Promise<void> {
    const existing = await this.prisma.manufacturingProcess.findFirst({
      where: {
        productId,
        sequence,
        isDeleted: false,
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
    });
    if (existing) {
      throw new ConflictException(PROCESS_MESSAGES.SEQUENCE_CONFLICT);
    }
  }

  async createProcess(
    dto: CreateProcessDto,
    performingUserId?: string,
  ): Promise<ProcessResponseDto> {
    await this.validateProduct(dto.productId);
    await this.assertCodeAvailable(dto.productId, dto.processCode);
    await this.assertSequenceAvailable(dto.productId, dto.sequence);

    const newProcess = await this.prisma.manufacturingProcess.create({
      data: {
        productId: dto.productId,
        processCode: dto.processCode,
        processName: dto.processName,
        description: dto.description,
        sequence: dto.sequence,
        estimatedHours: dto.estimatedHours,
        status: dto.status,
        createdBy: performingUserId,
      },
      include: { product: true },
    });

    const response = this.mapToProcessResponse(newProcess);
    await this.createAuditLog('CREATE', newProcess.id, null, response, performingUserId);

    return response;
  }

  async findAllProcesses(query: ProcessQueryDto): Promise<{
    items: ProcessResponseDto[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const page = Math.max(1, query.page ?? 1);
    const limit = Math.max(1, Math.min(100, query.limit ?? 10));
    const skip = (page - 1) * limit;

    const where: Prisma.ManufacturingProcessWhereInput = {
      isDeleted: false,
    };

    if (query.productId) {
      where.productId = query.productId;
    }

    if (query.status) {
      where.status = query.status;
    }

    if (query.search) {
      const searchTerm = query.search.trim();
      where.OR = [
        { processCode: { contains: searchTerm, mode: 'insensitive' } },
        { processName: { contains: searchTerm, mode: 'insensitive' } },
      ];
    }

    const [processes, total] = await Promise.all([
      this.prisma.manufacturingProcess.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ sequence: 'asc' }, { createdAt: 'desc' }],
        include: { product: true },
      }),
      this.prisma.manufacturingProcess.count({ where }),
    ]);

    const items = processes.map((p) => this.mapToProcessResponse(p));
    const totalPages = Math.ceil(total / limit);

    return {
      items,
      total,
      page,
      limit,
      totalPages,
    };
  }

  async findProcessById(id: string): Promise<ProcessResponseDto> {
    const process = await this.prisma.manufacturingProcess.findFirst({
      where: { id, isDeleted: false },
      include: { product: true },
    });

    if (!process) {
      throw new NotFoundException(PROCESS_MESSAGES.NOT_FOUND);
    }

    return this.mapToProcessResponse(process);
  }

  async updateProcess(
    id: string,
    dto: UpdateProcessDto,
    performingUserId?: string,
  ): Promise<ProcessResponseDto> {
    const currentProcess = await this.prisma.manufacturingProcess.findFirst({
      where: { id, isDeleted: false },
      include: { product: true },
    });

    if (!currentProcess) {
      throw new NotFoundException(PROCESS_MESSAGES.NOT_FOUND);
    }

    if (dto.productId && dto.productId !== currentProcess.productId) {
      await this.validateProduct(dto.productId);
      await this.assertCodeAvailable(
        dto.productId,
        dto.processCode ?? currentProcess.processCode,
        id,
      );
      await this.assertSequenceAvailable(
        dto.productId,
        dto.sequence ?? currentProcess.sequence,
        id,
      );
    } else {
      if (dto.processCode && dto.processCode !== currentProcess.processCode) {
        await this.assertCodeAvailable(currentProcess.productId, dto.processCode, id);
      }
      if (dto.sequence !== undefined && dto.sequence !== currentProcess.sequence) {
        await this.assertSequenceAvailable(currentProcess.productId, dto.sequence, id);
      }
    }

    const updatedProcess = await this.prisma.manufacturingProcess.update({
      where: { id },
      data: {
        ...(dto.productId && { productId: dto.productId }),
        ...(dto.processCode && { processCode: dto.processCode }),
        ...(dto.processName && { processName: dto.processName }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.sequence !== undefined && { sequence: dto.sequence }),
        ...(dto.estimatedHours !== undefined && { estimatedHours: dto.estimatedHours }),
        ...(dto.status && { status: dto.status }),
        updatedBy: performingUserId,
      },
      include: { product: true },
    });

    const oldResponse = this.mapToProcessResponse(currentProcess);
    const newResponse = this.mapToProcessResponse(updatedProcess);
    await this.createAuditLog('UPDATE', id, oldResponse, newResponse, performingUserId);

    return newResponse;
  }

  async softDeleteProcess(id: string, performingUserId?: string): Promise<{ message: string }> {
    const currentProcess = await this.prisma.manufacturingProcess.findFirst({
      where: { id, isDeleted: false },
    });

    if (!currentProcess) {
      throw new NotFoundException(PROCESS_MESSAGES.NOT_FOUND);
    }

    const [indentReferences, costReferences] = await Promise.all([
      this.prisma.indentProcess.count({ where: { processId: id, isDeleted: false } }),
      this.prisma.processCost.count({ where: { processId: id, isDeleted: false } }),
    ]);

    if (indentReferences > 0 || costReferences > 0) {
      throw new BadRequestException(PROCESS_MESSAGES.IN_USE_DELETE);
    }

    await this.prisma.manufacturingProcess.update({
      where: { id },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
        deletedBy: performingUserId,
      },
    });

    await this.createAuditLog(
      'DELETE',
      id,
      { status: currentProcess.status },
      null,
      performingUserId,
    );

    return { message: PROCESS_MESSAGES.DELETED_SUCCESS };
  }

  async restoreProcess(id: string, performingUserId?: string): Promise<ProcessResponseDto> {
    const currentProcess = await this.prisma.manufacturingProcess.findFirst({
      where: { id, isDeleted: true },
      include: { product: true },
    });

    if (!currentProcess) {
      throw new NotFoundException(PROCESS_MESSAGES.NOT_FOUND);
    }

    const restoredProcess = await this.prisma.manufacturingProcess.update({
      where: { id },
      data: {
        isDeleted: false,
        deletedAt: null,
        updatedBy: performingUserId,
      },
      include: { product: true },
    });

    const response = this.mapToProcessResponse(restoredProcess);
    await this.createAuditLog('RESTORE', id, null, response, performingUserId);

    return response;
  }
}
