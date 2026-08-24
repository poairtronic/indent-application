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
import { Prisma } from '@prisma/client';

@Injectable()
export class ProcessesService {
  constructor(private readonly prisma: PrismaService) {}

  private mapToProcessResponse(process: any): ProcessResponseDto {
    return {
      id: process.id,
      processName: process.processName,
      description: process.description ?? null,
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

  private async assertNameAvailable(processName: string, excludeId?: string): Promise<void> {
    const existing = await this.prisma.manufacturingProcess.findFirst({
      where: {
        processName: { equals: processName.trim(), mode: 'insensitive' },
        isDeleted: false,
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
    });
    if (existing) {
      throw new ConflictException(PROCESS_MESSAGES.DUPLICATE_NAME);
    }
  }

  async createProcess(
    dto: CreateProcessDto,
    performingUserId?: string,
  ): Promise<ProcessResponseDto> {
    await this.assertNameAvailable(dto.processName);

    const newProcess = await this.prisma.manufacturingProcess.create({
      data: {
        processName: dto.processName.trim(),
        description: dto.description?.trim() || null,
        status: dto.status,
        createdBy: performingUserId,
      },
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

    if (query.status) {
      where.status = query.status;
    }

    if (query.search) {
      const searchTerm = query.search.trim();
      where.processName = { contains: searchTerm, mode: 'insensitive' };
    }

    const [processes, total] = await Promise.all([
      this.prisma.manufacturingProcess.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ processName: 'asc' }],
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
    });

    if (!currentProcess) {
      throw new NotFoundException(PROCESS_MESSAGES.NOT_FOUND);
    }

    if (dto.processName && dto.processName.trim() !== currentProcess.processName) {
      await this.assertNameAvailable(dto.processName, id);
    }

    const updatedProcess = await this.prisma.manufacturingProcess.update({
      where: { id },
      data: {
        ...(dto.processName && { processName: dto.processName.trim() }),
        ...(dto.description !== undefined && { description: dto.description?.trim() || null }),
        ...(dto.status && { status: dto.status }),
        updatedBy: performingUserId,
      },
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
    });

    if (!currentProcess) {
      throw new NotFoundException(PROCESS_MESSAGES.NOT_FOUND);
    }

    await this.assertNameAvailable(currentProcess.processName, id);

    const restoredProcess = await this.prisma.manufacturingProcess.update({
      where: { id },
      data: {
        isDeleted: false,
        deletedAt: null,
        updatedBy: performingUserId,
      },
    });

    const response = this.mapToProcessResponse(restoredProcess);
    await this.createAuditLog('RESTORE', id, null, response, performingUserId);

    return response;
  }
}
