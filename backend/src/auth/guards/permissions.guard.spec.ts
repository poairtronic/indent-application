import { ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PermissionsGuard } from './permissions.guard';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';
import { IS_PUBLIC_KEY } from '../../common/decorators/public.decorator';

describe('PermissionsGuard', () => {
  let guard: PermissionsGuard;
  let reflector: Reflector;
  let mockContext: any;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new PermissionsGuard(reflector);

    mockContext = {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: jest.fn().mockReturnThis(),
      getRequest: jest.fn(),
    };
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  it('should allow access for public routes', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockImplementation((key: string) => {
      if (key === IS_PUBLIC_KEY) return true;
      return undefined;
    });

    expect(guard.canActivate(mockContext)).toBe(true);
  });

  it('should allow access when no permissions are required', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockImplementation((key: string) => {
      if (key === IS_PUBLIC_KEY) return false;
      if (key === PERMISSIONS_KEY) return [];
      return undefined;
    });

    expect(guard.canActivate(mockContext)).toBe(true);
  });

  it('should allow access when user has required permission', () => {
    mockContext.switchToHttp().getRequest.mockReturnValue({
      user: { permissions: ['users.create', 'users.view'] },
    });

    jest.spyOn(reflector, 'getAllAndOverride').mockImplementation((key: string) => {
      if (key === IS_PUBLIC_KEY) return false;
      if (key === PERMISSIONS_KEY) return ['users.create'];
      return undefined;
    });

    expect(guard.canActivate(mockContext)).toBe(true);
  });

  it('should allow access when user has any of the required permissions', () => {
    mockContext.switchToHttp().getRequest.mockReturnValue({
      user: { permissions: ['users.view'] },
    });

    jest.spyOn(reflector, 'getAllAndOverride').mockImplementation((key: string) => {
      if (key === IS_PUBLIC_KEY) return false;
      if (key === PERMISSIONS_KEY) return ['users.create', 'users.view'];
      return undefined;
    });

    expect(guard.canActivate(mockContext)).toBe(true);
  });

  it('should throw ForbiddenException when user lacks required permission', () => {
    mockContext.switchToHttp().getRequest.mockReturnValue({
      user: { permissions: ['users.view'] },
    });

    jest.spyOn(reflector, 'getAllAndOverride').mockImplementation((key: string) => {
      if (key === IS_PUBLIC_KEY) return false;
      if (key === PERMISSIONS_KEY) return ['indent.create'];
      return undefined;
    });

    expect(() => guard.canActivate(mockContext)).toThrow(ForbiddenException);
  });

  it('should throw ForbiddenException when no user found', () => {
    mockContext.switchToHttp().getRequest.mockReturnValue({});

    jest.spyOn(reflector, 'getAllAndOverride').mockImplementation((key: string) => {
      if (key === IS_PUBLIC_KEY) return false;
      if (key === PERMISSIONS_KEY) return ['users.view'];
      return undefined;
    });

    expect(() => guard.canActivate(mockContext)).toThrow(ForbiddenException);
  });

  it('should match permissions case-insensitively', () => {
    mockContext.switchToHttp().getRequest.mockReturnValue({
      user: { permissions: ['USERS.VIEW'] },
    });

    jest.spyOn(reflector, 'getAllAndOverride').mockImplementation((key: string) => {
      if (key === IS_PUBLIC_KEY) return false;
      if (key === PERMISSIONS_KEY) return ['users.view'];
      return undefined;
    });

    expect(guard.canActivate(mockContext)).toBe(true);
  });

  it('should allow access when user has permission and multiple are required', () => {
    mockContext.switchToHttp().getRequest.mockReturnValue({
      user: { permissions: ['users.view', 'users.create', 'users.delete'] },
    });

    jest.spyOn(reflector, 'getAllAndOverride').mockImplementation((key: string) => {
      if (key === IS_PUBLIC_KEY) return false;
      if (key === PERMISSIONS_KEY) return ['indent.create', 'users.create'];
      return undefined;
    });

    expect(guard.canActivate(mockContext)).toBe(true);
  });
});
