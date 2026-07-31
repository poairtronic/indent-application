import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { UserStatus } from '@prisma/client';
import { Reflector } from '@nestjs/core';

describe('UsersController', () => {
  let controller: UsersController;
  let serviceMock: any;

  const mockUserResponse = {
    id: 'user-uuid-1',
    employeeCode: 'EMP-1001',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    departmentId: 'dept-uuid-1',
    roleId: 'role-uuid-1',
    status: UserStatus.ACTIVE,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    serviceMock = {
      createUser: jest.fn().mockResolvedValue(mockUserResponse),
      findAllUsers: jest
        .fn()
        .mockResolvedValue({
          items: [mockUserResponse],
          total: 1,
          page: 1,
          limit: 10,
          totalPages: 1,
        }),
      findUserById: jest.fn().mockResolvedValue(mockUserResponse),
      getUserProfile: jest.fn().mockResolvedValue(mockUserResponse),
      updateUser: jest.fn().mockResolvedValue(mockUserResponse),
      updateUserStatus: jest.fn().mockResolvedValue(mockUserResponse),
      softDeleteUser: jest
        .fn()
        .mockResolvedValue({ message: 'User deleted (deactivated) successfully.' }),
      restoreUser: jest.fn().mockResolvedValue(mockUserResponse),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [{ provide: UsersService, useValue: serviceMock }, Reflector],
    }).compile();

    controller = module.get<UsersController>(UsersController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should call createUser in service', async () => {
    const dto: any = { employeeCode: 'EMP-1001', email: 'john@example.com' };
    const result = await controller.createUser(dto, { id: 'admin-id' });
    expect(serviceMock.createUser).toHaveBeenCalledWith(dto, 'admin-id');
    expect(result).toEqual(mockUserResponse);
  });

  it('should call findAllUsers in service', async () => {
    const query = { page: 1, limit: 10 };
    const result = await controller.findAllUsers(query);
    expect(serviceMock.findAllUsers).toHaveBeenCalledWith(query);
    expect(result.items.length).toBe(1);
  });

  it('should call softDeleteUser in service', async () => {
    const result = await controller.softDeleteUser('user-uuid-1', { id: 'admin-id' });
    expect(serviceMock.softDeleteUser).toHaveBeenCalledWith('user-uuid-1', 'admin-id');
    expect(result.message).toBeDefined();
  });
});
