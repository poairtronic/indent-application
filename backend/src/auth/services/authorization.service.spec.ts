import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException } from '@nestjs/common';
import { AuthorizationService } from './authorization.service';
import { PermissionService } from './permission.service';

describe('AuthorizationService', () => {
  let service: AuthorizationService;

  const mockPermissionService = {
    userHasPermission: jest.fn(),
    userHasAnyPermission: jest.fn(),
    userHasAllPermissions: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthorizationService,
        { provide: PermissionService, useValue: mockPermissionService },
      ],
    }).compile();

    service = module.get<AuthorizationService>(AuthorizationService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('authorize', () => {
    it('should not throw when user has permission', async () => {
      mockPermissionService.userHasPermission.mockResolvedValue(true);

      await expect(service.authorize('user-1', 'users.view')).resolves.toBeUndefined();
    });

    it('should throw ForbiddenException when user lacks permission', async () => {
      mockPermissionService.userHasPermission.mockResolvedValue(false);

      await expect(service.authorize('user-1', 'users.view')).rejects.toThrow(ForbiddenException);
    });
  });

  describe('authorizeAny', () => {
    it('should not throw when user has any permission', async () => {
      mockPermissionService.userHasAnyPermission.mockResolvedValue(true);

      await expect(
        service.authorizeAny('user-1', ['users.view', 'users.create']),
      ).resolves.toBeUndefined();
    });

    it('should throw ForbiddenException when user has none', async () => {
      mockPermissionService.userHasAnyPermission.mockResolvedValue(false);

      await expect(service.authorizeAny('user-1', ['users.view', 'users.create'])).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('authorizeAll', () => {
    it('should not throw when user has all permissions', async () => {
      mockPermissionService.userHasAllPermissions.mockResolvedValue(true);

      await expect(
        service.authorizeAll('user-1', ['users.view', 'users.create']),
      ).resolves.toBeUndefined();
    });

    it('should throw ForbiddenException when user lacks any', async () => {
      mockPermissionService.userHasAllPermissions.mockResolvedValue(false);

      await expect(service.authorizeAll('user-1', ['users.view', 'users.create'])).rejects.toThrow(
        ForbiddenException,
      );
    });
  });
});
