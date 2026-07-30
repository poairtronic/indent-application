import { ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { IS_PUBLIC_KEY } from '../../common/decorators/public.decorator';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;
  let mockContext: any;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new RolesGuard(reflector);

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

  it('should allow access when no roles are required', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockImplementation((key: string) => {
      if (key === IS_PUBLIC_KEY) return false;
      if (key === ROLES_KEY) return [];
      return undefined;
    });

    expect(guard.canActivate(mockContext)).toBe(true);
  });

  it('should allow access when user has required role', () => {
    mockContext.switchToHttp().getRequest.mockReturnValue({
      user: { role: { roleName: 'ADMIN' } },
    });

    jest.spyOn(reflector, 'getAllAndOverride').mockImplementation((key: string) => {
      if (key === IS_PUBLIC_KEY) return false;
      if (key === ROLES_KEY) return ['ADMIN'];
      return undefined;
    });

    expect(guard.canActivate(mockContext)).toBe(true);
  });

  it('should throw ForbiddenException when user lacks required role', () => {
    mockContext.switchToHttp().getRequest.mockReturnValue({
      user: { role: { roleName: 'DESIGN_ENGINEER' } },
    });

    jest.spyOn(reflector, 'getAllAndOverride').mockImplementation((key: string) => {
      if (key === IS_PUBLIC_KEY) return false;
      if (key === ROLES_KEY) return ['ADMIN'];
      return undefined;
    });

    expect(() => guard.canActivate(mockContext)).toThrow(ForbiddenException);
  });

  it('should throw ForbiddenException when no user found', () => {
    mockContext.switchToHttp().getRequest.mockReturnValue({});

    jest.spyOn(reflector, 'getAllAndOverride').mockImplementation((key: string) => {
      if (key === IS_PUBLIC_KEY) return false;
      if (key === ROLES_KEY) return ['ADMIN'];
      return undefined;
    });

    expect(() => guard.canActivate(mockContext)).toThrow(ForbiddenException);
  });

  it('should match roles case-insensitively', () => {
    mockContext.switchToHttp().getRequest.mockReturnValue({
      user: { role: { roleName: 'admin' } },
    });

    jest.spyOn(reflector, 'getAllAndOverride').mockImplementation((key: string) => {
      if (key === IS_PUBLIC_KEY) return false;
      if (key === ROLES_KEY) return ['ADMIN'];
      return undefined;
    });

    expect(guard.canActivate(mockContext)).toBe(true);
  });
});
