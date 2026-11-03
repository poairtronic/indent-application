import {
  ExecutionContext,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { InternalSecretGuard } from './internal-secret.guard';

describe('InternalSecretGuard', () => {
  let guard: InternalSecretGuard;
  let mockContext: any;
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    guard = new InternalSecretGuard();

    mockContext = {
      switchToHttp: jest.fn().mockReturnThis(),
      getRequest: jest.fn(),
    };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  it('should throw InternalServerErrorException when MERC_INTERNAL_SECRET is not configured', () => {
    delete process.env.MERC_INTERNAL_SECRET;

    expect(() => guard.canActivate(mockContext)).toThrow(InternalServerErrorException);
  });

  it('should throw InternalServerErrorException when MERC_INTERNAL_SECRET is empty string', () => {
    process.env.MERC_INTERNAL_SECRET = '   ';

    expect(() => guard.canActivate(mockContext)).toThrow(InternalServerErrorException);
  });

  it('should throw UnauthorizedException when x-internal-secret header is missing', () => {
    process.env.MERC_INTERNAL_SECRET = 'valid-test-secret-12345';
    mockContext.switchToHttp().getRequest.mockReturnValue({
      headers: {},
    });

    expect(() => guard.canActivate(mockContext)).toThrow(UnauthorizedException);
  });

  it('should throw UnauthorizedException when x-internal-secret header does not match', () => {
    process.env.MERC_INTERNAL_SECRET = 'valid-test-secret-12345';
    mockContext.switchToHttp().getRequest.mockReturnValue({
      headers: {
        'x-internal-secret': 'wrong-secret-value',
      },
    });

    expect(() => guard.canActivate(mockContext)).toThrow(UnauthorizedException);
  });

  it('should return true when x-internal-secret header matches MERC_INTERNAL_SECRET', () => {
    process.env.MERC_INTERNAL_SECRET = 'valid-test-secret-12345';
    mockContext.switchToHttp().getRequest.mockReturnValue({
      headers: {
        'x-internal-secret': 'valid-test-secret-12345',
      },
    });

    expect(guard.canActivate(mockContext)).toBe(true);
  });

  it('should support array header format when first value matches', () => {
    process.env.MERC_INTERNAL_SECRET = 'valid-test-secret-12345';
    mockContext.switchToHttp().getRequest.mockReturnValue({
      headers: {
        'x-internal-secret': ['valid-test-secret-12345'],
      },
    });

    expect(guard.canActivate(mockContext)).toBe(true);
  });
});
