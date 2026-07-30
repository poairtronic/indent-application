import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class PermissionService {
  constructor(private readonly prisma: PrismaService) {}

  async findUserPermissions(userId: string): Promise<string[]> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        role: {
          include: {
            rolePermissions: {
              include: {
                permission: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      return [];
    }

    return user.role.rolePermissions.map((rp) => rp.permission.code);
  }

  async userHasPermission(userId: string, permissionCode: string): Promise<boolean> {
    const permissions = await this.findUserPermissions(userId);
    return permissions.some((p) => p.toLowerCase() === permissionCode.toLowerCase());
  }

  async userHasAnyPermission(userId: string, permissionCodes: string[]): Promise<boolean> {
    const permissions = await this.findUserPermissions(userId);
    return permissionCodes.some((required) =>
      permissions.some((up) => up.toLowerCase() === required.toLowerCase()),
    );
  }

  async userHasAllPermissions(userId: string, permissionCodes: string[]): Promise<boolean> {
    const permissions = await this.findUserPermissions(userId);
    return permissionCodes.every((required) =>
      permissions.some((up) => up.toLowerCase() === required.toLowerCase()),
    );
  }
}
