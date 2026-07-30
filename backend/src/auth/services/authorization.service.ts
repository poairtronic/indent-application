import { Injectable, ForbiddenException } from '@nestjs/common';
import { PermissionService } from './permission.service';

@Injectable()
export class AuthorizationService {
  constructor(private readonly permissionService: PermissionService) {}

  async authorize(userId: string, permissionCode: string): Promise<void> {
    const hasPermission = await this.permissionService.userHasPermission(userId, permissionCode);
    if (!hasPermission) {
      throw new ForbiddenException(`Missing required permission: ${permissionCode}`);
    }
  }

  async authorizeAny(userId: string, permissionCodes: string[]): Promise<void> {
    const hasAny = await this.permissionService.userHasAnyPermission(userId, permissionCodes);
    if (!hasAny) {
      throw new ForbiddenException(
        `Missing any of the required permissions: ${permissionCodes.join(', ')}`,
      );
    }
  }

  async authorizeAll(userId: string, permissionCodes: string[]): Promise<void> {
    const hasAll = await this.permissionService.userHasAllPermissions(userId, permissionCodes);
    if (!hasAll) {
      throw new ForbiddenException(
        `Missing one or more required permissions: ${permissionCodes.join(', ')}`,
      );
    }
  }
}
