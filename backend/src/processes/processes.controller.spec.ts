import { Test, TestingModule } from '@nestjs/testing';
import { ProcessesController } from './processes.controller';
import { ProcessesService } from './processes.service';
import { ProcessStatus } from '@prisma/client';
import { Reflector } from '@nestjs/core';
import { RedisCacheService } from '../redis-cache/redis-cache.service';

describe('ProcessesController', () => {
  let controller: ProcessesController;
  let serviceMock: any;

  const mockProcessResponse = {
    id: 'process-uuid-1',
    processName: 'Milling',
    description: null,
    status: ProcessStatus.ACTIVE,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    serviceMock = {
      createProcess: jest.fn().mockResolvedValue(mockProcessResponse),
      findAllProcesses: jest.fn().mockResolvedValue({
        items: [mockProcessResponse],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      }),
      findProcessById: jest.fn().mockResolvedValue(mockProcessResponse),
      updateProcess: jest.fn().mockResolvedValue(mockProcessResponse),
      softDeleteProcess: jest
        .fn()
        .mockResolvedValue({ message: 'Manufacturing process deleted successfully.' }),
      restoreProcess: jest.fn().mockResolvedValue(mockProcessResponse),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProcessesController],
      providers: [{ provide: ProcessesService, useValue: serviceMock }, Reflector],
    }).compile();

    controller = module.get<ProcessesController>(ProcessesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should call createProcess in service', async () => {
    const dto: any = { processName: 'Milling' };
    const result = await controller.createProcess(dto, { id: 'admin-id' });
    expect(serviceMock.createProcess).toHaveBeenCalledWith(dto, 'admin-id');
    expect(result).toEqual(mockProcessResponse);
  });

  it('should call findAllProcesses in service', async () => {
    const query = { page: 1, limit: 10 };
    const result = await controller.findAllProcesses(query);
    expect(serviceMock.findAllProcesses).toHaveBeenCalledWith(query);
    expect(result.items.length).toBe(1);
  });

  it('should call findProcessById in service', async () => {
    const result = await controller.findProcessById('process-uuid-1');
    expect(serviceMock.findProcessById).toHaveBeenCalledWith('process-uuid-1');
    expect(result.id).toBe('process-uuid-1');
  });

  it('should call updateProcess in service', async () => {
    const dto: any = { processName: 'CNC Milling' };
    const result = await controller.updateProcess('process-uuid-1', dto, { id: 'admin-id' });
    expect(serviceMock.updateProcess).toHaveBeenCalledWith('process-uuid-1', dto, 'admin-id');
    expect(result).toEqual(mockProcessResponse);
  });

  it('should call softDeleteProcess in service', async () => {
    const result = await controller.softDeleteProcess('process-uuid-1', { id: 'admin-id' });
    expect(serviceMock.softDeleteProcess).toHaveBeenCalledWith('process-uuid-1', 'admin-id');
    expect(result.message).toBeDefined();
  });

  it('should call restoreProcess in service', async () => {
    const result = await controller.restoreProcess('process-uuid-1', { id: 'admin-id' });
    expect(serviceMock.restoreProcess).toHaveBeenCalledWith('process-uuid-1', 'admin-id');
    expect(result).toEqual(mockProcessResponse);
  });
});
