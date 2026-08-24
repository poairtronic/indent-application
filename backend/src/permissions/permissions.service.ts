import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { UpdatePermissionDto } from './dto/update-permission.dto';

@Injectable()
export class PermissionsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreatePermissionDto) {
    const existing = await this.prisma.permission.findUnique({
      where: { code: dto.code },
    });
    if (existing) {
      throw new ConflictException(`Permission '${dto.code}' already exists`);
    }

    const result = await this.prisma.permission.create({
      data: {
        module: dto.module,
        action: dto.action,
        code: dto.code,
        description: dto.description,
      },
    });
    return result;
  }

  async findAll(module?: string) {
    const where: any = { isDeleted: false };
    if (module) {
      where.module = module;
    }

    return this.prisma.permission.findMany({
      where,
      orderBy: [{ module: 'asc' }, { code: 'asc' }],
    });
  }

  async findOne(id: string) {
    const permission = await this.prisma.permission.findFirst({
      where: { id, isDeleted: false },
    });
    if (!permission) {
      throw new NotFoundException(`Permission with ID '${id}' not found`);
    }
    return permission;
  }

  async update(id: string, dto: UpdatePermissionDto) {
    const permission = await this.prisma.permission.findFirst({
      where: { id, isDeleted: false },
    });
    if (!permission) {
      throw new NotFoundException(`Permission with ID '${id}' not found`);
    }

    if (dto.code && dto.code !== permission.code) {
      const existing = await this.prisma.permission.findUnique({
        where: { code: dto.code },
      });
      if (existing) {
        throw new ConflictException(`Permission '${dto.code}' already exists`);
      }
    }

    const result = await this.prisma.permission.update({
      where: { id },
      data: {
        module: dto.module,
        action: dto.action,
        code: dto.code,
        description: dto.description,
      },
    });
    return result;
  }

  async remove(id: string) {
    const permission = await this.prisma.permission.findFirst({
      where: { id, isDeleted: false },
    });
    if (!permission) {
      throw new NotFoundException(`Permission with ID '${id}' not found`);
    }

    await this.prisma.permission.update({
      where: { id },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
      },
    });
  }

  async getModules() {
    const modules = await this.prisma.permission.findMany({
      where: { isDeleted: false },
      select: { module: true },
      distinct: ['module'],
      orderBy: { module: 'asc' },
    });
    return modules.map((m) => m.module);
  }

  async findByModule(module: string) {
    return this.prisma.permission.findMany({
      where: { module, isDeleted: false },
      orderBy: { code: 'asc' },
    });
  }
}
