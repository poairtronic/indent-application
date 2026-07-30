import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from '../services/auth.service';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;

  const mockAuthService = {
    login: jest
      .fn()
      .mockResolvedValue({ accessToken: 'access_token', refreshToken: 'refresh_token' }),
    logout: jest.fn().mockResolvedValue(undefined),
    refresh: jest
      .fn()
      .mockResolvedValue({ accessToken: 'new_access_token', refreshToken: 'new_refresh_token' }),
    forgotPassword: jest.fn().mockResolvedValue(undefined),
    resetPassword: jest.fn().mockResolvedValue(undefined),
    changePassword: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: mockAuthService }],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('login', () => {
    it('should invoke login service', async () => {
      const dto = { email: 'test@example.com', password: 'password123' };
      const res = await controller.login(dto);
      expect(authService.login).toHaveBeenCalledWith(dto);
      expect(res).toEqual({ accessToken: 'access_token', refreshToken: 'refresh_token' });
    });
  });
});
