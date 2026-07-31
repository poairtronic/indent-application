import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PasswordService } from '../auth/services/password.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserQueryDto } from './dto/user-query.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { UpdateUserStatusDto } from './dto/update-user-status.dto';
import { USER_MESSAGES } from './constants/user-messages.constants';
import { UserStatus, Prisma } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly passwordService: PasswordService,
  ) {}

  private mapToUserResponse(user: any): UserResponseDto {
    return {
      id: user.id,
      employeeCode: user.employeeCode,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone ?? null,
      departmentId: user.departmentId,
      departmentName: user.department?.departmentName ?? undefined,
      roleId: user.roleId,
      roleName: user.role?.roleName ?? undefined,
      status: user.status,
      profileImage: user.profileImage ?? null,
      lastLogin: user.lastLogin ?? null,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
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
          module: 'User',
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

  async createUser(dto: CreateUserDto, performingUserId?: string): Promise<UserResponseDto> {
    const existingEmail = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });
    if (existingEmail) {
      throw new ConflictException(USER_MESSAGES.EMAIL_EXISTS);
    }

    const existingEmpCode = await this.prisma.user.findUnique({
      where: { employeeCode: dto.employeeCode },
    });
    if (existingEmpCode) {
      throw new ConflictException(USER_MESSAGES.EMPLOYEE_CODE_EXISTS);
    }

    const department = await this.prisma.department.findUnique({
      where: { id: dto.departmentId },
    });
    if (!department || department.isDeleted || department.status !== 'ACTIVE') {
      throw new BadRequestException(USER_MESSAGES.INVALID_DEPARTMENT);
    }

    const role = await this.prisma.role.findUnique({
      where: { id: dto.roleId },
    });
    if (!role || role.isDeleted) {
      throw new BadRequestException(USER_MESSAGES.INVALID_ROLE);
    }

    const hashedPassword = await this.passwordService.hash(dto.password);

    const newUser = await this.prisma.user.create({
      data: {
        employeeCode: dto.employeeCode,
        firstName: dto.firstName,
        lastName: dto.lastName,
        email: dto.email.toLowerCase(),
        phone: dto.phone,
        password: hashedPassword,
        departmentId: dto.departmentId,
        roleId: dto.roleId,
        status: dto.status ?? UserStatus.ACTIVE,
        profileImage: dto.profileImage,
        createdBy: performingUserId,
      },
      include: {
        department: true,
        role: true,
      },
    });

    const response = this.mapToUserResponse(newUser);
    await this.createAuditLog('CREATE', newUser.id, null, response, performingUserId);

    return response;
  }

  async findAllUsers(query: UserQueryDto): Promise<{
    items: UserResponseDto[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const page = Math.max(1, query.page ?? 1);
    const limit = Math.max(1, Math.min(100, query.limit ?? 10));
    const skip = (page - 1) * limit;

    const where: Prisma.UserWhereInput = {
      isDeleted: false,
    };

    if (query.status) {
      where.status = query.status;
    }

    if (query.departmentId) {
      where.departmentId = query.departmentId;
    }

    if (query.roleId) {
      where.roleId = query.roleId;
    }

    if (query.search) {
      const searchTerm = query.search.trim();
      where.OR = [
        { firstName: { contains: searchTerm, mode: 'insensitive' } },
        { lastName: { contains: searchTerm, mode: 'insensitive' } },
        { email: { contains: searchTerm, mode: 'insensitive' } },
        { employeeCode: { contains: searchTerm, mode: 'insensitive' } },
      ];
    }

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          department: true,
          role: true,
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    const items = users.map((u) => this.mapToUserResponse(u));
    const totalPages = Math.ceil(total / limit);

    return {
      items,
      total,
      page,
      limit,
      totalPages,
    };
  }

  async findUserById(id: string): Promise<UserResponseDto> {
    const user = await this.prisma.user.findFirst({
      where: { id, isDeleted: false },
      include: {
        department: true,
        role: true,
      },
    });

    if (!user) {
      throw new NotFoundException(USER_MESSAGES.NOT_FOUND);
    }

    return this.mapToUserResponse(user);
  }

  async getUserProfile(userId: string): Promise<UserResponseDto> {
    return this.findUserById(userId);
  }

  async updateUser(
    id: string,
    dto: UpdateUserDto,
    performingUserId?: string,
  ): Promise<UserResponseDto> {
    const currentUser = await this.prisma.user.findFirst({
      where: { id, isDeleted: false },
      include: { department: true, role: true },
    });

    if (!currentUser) {
      throw new NotFoundException(USER_MESSAGES.NOT_FOUND);
    }

    if (dto.email && dto.email.toLowerCase() !== currentUser.email) {
      const existingEmail = await this.prisma.user.findUnique({
        where: { email: dto.email.toLowerCase() },
      });
      if (existingEmail) {
        throw new ConflictException(USER_MESSAGES.EMAIL_EXISTS);
      }
    }

    if (dto.departmentId && dto.departmentId !== currentUser.departmentId) {
      const department = await this.prisma.department.findUnique({
        where: { id: dto.departmentId },
      });
      if (!department || department.isDeleted || department.status !== 'ACTIVE') {
        throw new BadRequestException(USER_MESSAGES.INVALID_DEPARTMENT);
      }
    }

    if (dto.roleId && dto.roleId !== currentUser.roleId) {
      const role = await this.prisma.role.findUnique({
        where: { id: dto.roleId },
      });
      if (!role || role.isDeleted) {
        throw new BadRequestException(USER_MESSAGES.INVALID_ROLE);
      }
    }

    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: {
        ...(dto.firstName && { firstName: dto.firstName }),
        ...(dto.lastName && { lastName: dto.lastName }),
        ...(dto.email && { email: dto.email.toLowerCase() }),
        ...(dto.phone !== undefined && { phone: dto.phone }),
        ...(dto.departmentId && { departmentId: dto.departmentId }),
        ...(dto.roleId && { roleId: dto.roleId }),
        ...(dto.status && { status: dto.status }),
        ...(dto.profileImage !== undefined && { profileImage: dto.profileImage }),
        updatedBy: performingUserId,
      },
      include: {
        department: true,
        role: true,
      },
    });

    const oldResponse = this.mapToUserResponse(currentUser);
    const newResponse = this.mapToUserResponse(updatedUser);

    if (dto.roleId && dto.roleId !== currentUser.roleId) {
      await this.createAuditLog(
        'ROLE_CHANGE',
        id,
        { roleId: currentUser.roleId },
        { roleId: dto.roleId },
        performingUserId,
      );
    }

    if (dto.departmentId && dto.departmentId !== currentUser.departmentId) {
      await this.createAuditLog(
        'DEPARTMENT_CHANGE',
        id,
        { departmentId: currentUser.departmentId },
        { departmentId: dto.departmentId },
        performingUserId,
      );
    }

    await this.createAuditLog('UPDATE', id, oldResponse, newResponse, performingUserId);

    return newResponse;
  }

  async updateUserStatus(
    id: string,
    dto: UpdateUserStatusDto,
    performingUserId?: string,
  ): Promise<UserResponseDto> {
    const currentUser = await this.prisma.user.findFirst({
      where: { id, isDeleted: false },
      include: { department: true, role: true },
    });

    if (!currentUser) {
      throw new NotFoundException(USER_MESSAGES.NOT_FOUND);
    }

    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: {
        status: dto.status,
        updatedBy: performingUserId,
      },
      include: {
        department: true,
        role: true,
      },
    });

    if (dto.status === UserStatus.INACTIVE || dto.status === UserStatus.SUSPENDED) {
      await this.prisma.userSession.updateMany({
        where: { userId: id, status: 'ACTIVE' },
        data: { status: 'REVOKED', logoutAt: new Date() },
      });

      await this.prisma.refreshToken.updateMany({
        where: { userId: id, revokedAt: null },
        data: { revokedAt: new Date(), isDeleted: true },
      });
    }

    const newResponse = this.mapToUserResponse(updatedUser);
    await this.createAuditLog(
      'STATUS_CHANGE',
      id,
      { status: currentUser.status },
      { status: dto.status },
      performingUserId,
    );

    return newResponse;
  }

  async softDeleteUser(id: string, performingUserId?: string): Promise<{ message: string }> {
    const currentUser = await this.prisma.user.findFirst({
      where: { id, isDeleted: false },
    });

    if (!currentUser) {
      throw new NotFoundException(USER_MESSAGES.NOT_FOUND);
    }

    await this.prisma.user.update({
      where: { id },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
        status: UserStatus.INACTIVE,
        deletedBy: performingUserId,
      },
    });

    await this.prisma.userSession.updateMany({
      where: { userId: id, status: 'ACTIVE' },
      data: { status: 'REVOKED', logoutAt: new Date() },
    });

    await this.prisma.refreshToken.updateMany({
      where: { userId: id, revokedAt: null },
      data: { revokedAt: new Date(), isDeleted: true },
    });

    await this.createAuditLog('DELETE', id, { status: currentUser.status }, null, performingUserId);

    return { message: USER_MESSAGES.DELETED_SUCCESS };
  }

  async restoreUser(id: string, performingUserId?: string): Promise<UserResponseDto> {
    const currentUser = await this.prisma.user.findFirst({
      where: { id, isDeleted: true },
      include: { department: true, role: true },
    });

    if (!currentUser) {
      throw new NotFoundException(USER_MESSAGES.NOT_FOUND);
    }

    const restoredUser = await this.prisma.user.update({
      where: { id },
      data: {
        isDeleted: false,
        deletedAt: null,
        status: UserStatus.ACTIVE,
        updatedBy: performingUserId,
      },
      include: {
        department: true,
        role: true,
      },
    });

    const response = this.mapToUserResponse(restoredUser);
    await this.createAuditLog('RESTORE', id, null, response, performingUserId);

    return response;
  }
}
