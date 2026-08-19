import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisCacheService } from '../redis-cache/redis-cache.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';

@Injectable()
export class RolesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cacheService: RedisCacheService,
  ) {}

  async create(dto: CreateRoleDto) {
    const existing = await this.prisma.role.findUnique({
      where: { roleName: dto.roleName },
    });
    if (existing) {
      throw new ConflictException(`Role '${dto.roleName}' already exists`);
    }

    const role = await this.prisma.role.create({
      data: {
        roleName: dto.roleName,
        description: dto.description,
        isSystem: dto.isSystem ?? false,
      },
    });

    if (dto.permissionIds?.length) {
      await this.prisma.rolePermission.createMany({
        data: dto.permissionIds.map((permissionId) => ({
          roleId: role.id,
          permissionId,
        })),
        skipDuplicates: true,
      });
    }

    return this.findOne(role.id);
  }

  async findAll() {
    const roles = await this.prisma.role.findMany({
      where: { isDeleted: false },
      include: {
        _count: { select: { users: true } },
        rolePermissions: {
          include: { permission: true },
          where: { isDeleted: false },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return roles.map((r) => ({
      ...r,
      permissions: r.rolePermissions.map((rp) => rp.permission),
      userCount: r._count.users,
      rolePermissions: undefined,
      _count: undefined,
    }));
  }

  async findOne(id: string) {
    const role = await this.prisma.role.findFirst({
      where: { id, isDeleted: false },
      include: {
        _count: { select: { users: true } },
        rolePermissions: {
          include: { permission: true },
          where: { isDeleted: false },
        },
      },
    });

    if (!role) {
      throw new NotFoundException(`Role with ID '${id}' not found`);
    }

    return {
      ...role,
      permissions: role.rolePermissions.map((rp) => rp.permission),
      userCount: role._count.users,
      rolePermissions: undefined,
      _count: undefined,
    };
  }

  async update(id: string, dto: UpdateRoleDto) {
    const role = await this.prisma.role.findFirst({
      where: { id, isDeleted: false },
    });
    if (!role) {
      throw new NotFoundException(`Role with ID '${id}' not found`);
    }

    if (dto.roleName && dto.roleName !== role.roleName) {
      const existing = await this.prisma.role.findUnique({
        where: { roleName: dto.roleName },
      });
      if (existing) {
        throw new ConflictException(`Role '${dto.roleName}' already exists`);
      }
    }

    await this.prisma.role.update({
      where: { id },
      data: {
        roleName: dto.roleName,
        description: dto.description,
        isSystem: dto.isSystem,
      },
    });

    if (dto.permissionIds !== undefined) {
      await this.prisma.rolePermission.deleteMany({
        where: { roleId: id, isDeleted: false },
      });

      if (dto.permissionIds.length > 0) {
        await this.prisma.rolePermission.createMany({
          data: dto.permissionIds.map((permissionId) => ({
            roleId: id,
            permissionId,
          })),
          skipDuplicates: true,
        });
      }
    }

    return this.findOne(id);
  }

  async remove(id: string) {
    const role = await this.prisma.role.findFirst({
      where: { id, isDeleted: false },
    });
    if (!role) {
      throw new NotFoundException(`Role with ID '${id}' not found`);
    }

    if (role.isSystem) {
      throw new ConflictException('System roles cannot be deleted');
    }

    await this.prisma.role.update({
      where: { id },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
      },
    });
  }

  async getPermissions(id: string) {
    const role = await this.prisma.role.findFirst({
      where: { id, isDeleted: false },
    });
    if (!role) {
      throw new NotFoundException(`Role with ID '${id}' not found`);
    }

    const rolePermissions = await this.prisma.rolePermission.findMany({
      where: { roleId: id, isDeleted: false },
      include: { permission: true },
    });

    return rolePermissions.map((rp) => rp.permission);
  }

  async assignPermissions(id: string, permissionIds: string[]) {
    const role = await this.prisma.role.findFirst({
      where: { id, isDeleted: false },
    });
    if (!role) {
      throw new NotFoundException(`Role with ID '${id}' not found`);
    }

    await this.prisma.rolePermission.deleteMany({
      where: { roleId: id, isDeleted: false },
    });

    if (permissionIds.length > 0) {
      await this.prisma.rolePermission.createMany({
        data: permissionIds.map((permissionId) => ({
          roleId: id,
          permissionId,
        })),
        skipDuplicates: true,
      });
    }

    // Invalidate JWT session cache for all users with this role
    // so they pick up the new permissions on next request
    try {
      const usersWithRole = await this.prisma.user.findMany({
        where: { roleId: id, isDeleted: false },
        select: { id: true },
      });
      await Promise.all(
        usersWithRole.map((u) => this.cacheService.del(`user:session:${u.id}`)),
      );
    } catch {
      // Best-effort cache invalidation; stale entries expire in ≤5 min
    }

    return this.findOne(id);
  }
}
