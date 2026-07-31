import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { PrismaService } from '../prisma/prisma.service';
import { PasswordService } from '../auth/services/password.service';
import { NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { UserStatus } from '@prisma/client';

describe('UsersService', () => {
  let service: UsersService;
  let prismaMock: any;
  let passwordMock: any;

  const mockUser = {
    id: 'user-uuid-1',
    employeeCode: 'EMP-1001',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    phone: '+1234567890',
    password: 'hashedpassword',
    departmentId: 'dept-uuid-1',
    roleId: 'role-uuid-1',
    status: UserStatus.ACTIVE,
    isDeleted: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    department: { departmentName: 'Engineering' },
    role: { roleName: 'Design Engineer' },
  };

  beforeEach(async () => {
    prismaMock = {
      user: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      department: {
        findUnique: jest.fn(),
      },
      role: {
        findUnique: jest.fn(),
      },
      userSession: {
        updateMany: jest.fn(),
      },
      refreshToken: {
        updateMany: jest.fn(),
      },
      auditLog: {
        create: jest.fn(),
      },
    };

    passwordMock = {
      hash: jest.fn().mockResolvedValue('hashedpassword'),
      compare: jest.fn().mockResolvedValue(true),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: PasswordService, useValue: passwordMock },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createUser', () => {
    const createDto = {
      employeeCode: 'EMP-1001',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      password: 'Password123!',
      departmentId: 'dept-uuid-1',
      roleId: 'role-uuid-1',
    };

    it('should successfully create a new user', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);
      prismaMock.department.findUnique.mockResolvedValue({
        id: 'dept-uuid-1',
        status: 'ACTIVE',
        isDeleted: false,
      });
      prismaMock.role.findUnique.mockResolvedValue({ id: 'role-uuid-1', isDeleted: false });
      prismaMock.user.create.mockResolvedValue(mockUser);

      const result = await service.createUser(createDto, 'performer-id');

      expect(result.email).toEqual('john.doe@example.com');
      expect(prismaMock.user.create).toHaveBeenCalled();
      expect(prismaMock.auditLog.create).toHaveBeenCalled();
    });

    it('should throw ConflictException if email exists', async () => {
      prismaMock.user.findUnique.mockResolvedValue(mockUser);

      await expect(service.createUser(createDto)).rejects.toThrow(ConflictException);
    });

    it('should throw BadRequestException if department is missing or inactive', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);
      prismaMock.department.findUnique.mockResolvedValue(null);

      await expect(service.createUser(createDto)).rejects.toThrow(BadRequestException);
    });
  });

  describe('findUserById', () => {
    it('should return user details if found', async () => {
      prismaMock.user.findFirst.mockResolvedValue(mockUser);

      const result = await service.findUserById('user-uuid-1');

      expect(result.id).toBe('user-uuid-1');
    });

    it('should throw NotFoundException if user not found', async () => {
      prismaMock.user.findFirst.mockResolvedValue(null);

      await expect(service.findUserById('invalid-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('softDeleteUser', () => {
    it('should soft delete user and revoke active sessions', async () => {
      prismaMock.user.findFirst.mockResolvedValue(mockUser);
      prismaMock.user.update.mockResolvedValue({ ...mockUser, isDeleted: true });

      const result = await service.softDeleteUser('user-uuid-1', 'performer-id');

      expect(result.message).toBeDefined();
      expect(prismaMock.user.update).toHaveBeenCalled();
      expect(prismaMock.userSession.updateMany).toHaveBeenCalled();
    });
  });
});
