import { Test, TestingModule } from '@nestjs/testing';
import { PermissionService } from './permission.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('PermissionService', () => {
  let service: PermissionService;

  const mockPrisma = {
    user: {
      findUnique: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PermissionService, { provide: PrismaService, useValue: mockPrisma }],
    }).compile();

    service = module.get<PermissionService>(PermissionService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findUserPermissions', () => {
    it('should return permission codes for a user', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        role: {
          rolePermissions: [
            { permission: { code: 'users.view' } },
            { permission: { code: 'users.create' } },
          ],
        },
      });

      const result = await service.findUserPermissions('user-1');
      expect(result).toEqual(['users.view', 'users.create']);
    });

    it('should return empty array when user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const result = await service.findUserPermissions('non-existent');
      expect(result).toEqual([]);
    });
  });

  describe('userHasPermission', () => {
    it('should return true when user has permission', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        role: {
          rolePermissions: [{ permission: { code: 'users.view' } }],
        },
      });

      const result = await service.userHasPermission('user-1', 'users.view');
      expect(result).toBe(true);
    });

    it('should return false when user lacks permission', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        role: {
          rolePermissions: [{ permission: { code: 'users.view' } }],
        },
      });

      const result = await service.userHasPermission('user-1', 'indent.create');
      expect(result).toBe(false);
    });

    it('should be case-insensitive', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        role: {
          rolePermissions: [{ permission: { code: 'users.view' } }],
        },
      });

      const result = await service.userHasPermission('user-1', 'USERS.VIEW');
      expect(result).toBe(true);
    });
  });

  describe('userHasAnyPermission', () => {
    it('should return true when user has any of the permissions', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        role: {
          rolePermissions: [{ permission: { code: 'users.view' } }],
        },
      });

      const result = await service.userHasAnyPermission('user-1', ['indent.create', 'users.view']);
      expect(result).toBe(true);
    });

    it('should return false when user has none of the permissions', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        role: {
          rolePermissions: [{ permission: { code: 'users.view' } }],
        },
      });

      const result = await service.userHasAnyPermission('user-1', [
        'indent.create',
        'workflow.approve',
      ]);
      expect(result).toBe(false);
    });
  });

  describe('userHasAllPermissions', () => {
    it('should return true when user has all permissions', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        role: {
          rolePermissions: [
            { permission: { code: 'users.view' } },
            { permission: { code: 'users.create' } },
          ],
        },
      });

      const result = await service.userHasAllPermissions('user-1', ['users.view', 'users.create']);
      expect(result).toBe(true);
    });

    it('should return false when user lacks any permission', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        role: {
          rolePermissions: [{ permission: { code: 'users.view' } }],
        },
      });

      const result = await service.userHasAllPermissions('user-1', ['users.view', 'users.create']);
      expect(result).toBe(false);
    });
  });
});
