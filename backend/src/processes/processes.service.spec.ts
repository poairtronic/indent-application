import { Test, TestingModule } from '@nestjs/testing';
import { ProcessesService } from './processes.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { ProcessStatus } from '@prisma/client';

describe('ProcessesService', () => {
  let service: ProcessesService;
  let prismaMock: any;

  const mockProcess = {
    id: 'process-uuid-1',
    productId: 'product-uuid-1',
    processCode: 'MLG-001',
    processName: 'Milling',
    description: null,
    sequence: 1,
    estimatedHours: 4.5,
    status: ProcessStatus.ACTIVE,
    isDeleted: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    product: { productCode: 'PRD-001' },
  };

  beforeEach(async () => {
    prismaMock = {
      product: {
        findUnique: jest.fn(),
      },
      manufacturingProcess: {
        findFirst: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      indentProcess: {
        count: jest.fn(),
      },
      processCost: {
        count: jest.fn(),
      },
      auditLog: {
        create: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [ProcessesService, { provide: PrismaService, useValue: prismaMock }],
    }).compile();

    service = module.get<ProcessesService>(ProcessesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createProcess', () => {
    const createDto = {
      productId: 'product-uuid-1',
      processCode: 'MLG-001',
      processName: 'Milling',
      sequence: 1,
      estimatedHours: 4.5,
    };

    it('should successfully create a manufacturing process', async () => {
      prismaMock.product.findUnique.mockResolvedValue({
        id: 'product-uuid-1',
        isDeleted: false,
        status: 'ACTIVE',
      });
      prismaMock.manufacturingProcess.findFirst.mockResolvedValue(null);
      prismaMock.manufacturingProcess.create.mockResolvedValue(mockProcess);

      const result = await service.createProcess(createDto, 'performer-id');

      expect(result.processCode).toEqual('MLG-001');
      expect(result.estimatedHours).toEqual(4.5);
      expect(prismaMock.manufacturingProcess.create).toHaveBeenCalled();
      expect(prismaMock.auditLog.create).toHaveBeenCalled();
    });

    it('should throw BadRequestException if product is invalid or inactive', async () => {
      prismaMock.product.findUnique.mockResolvedValue(null);

      await expect(service.createProcess(createDto)).rejects.toThrow(BadRequestException);
    });

    it('should throw ConflictException if process code already exists for product', async () => {
      prismaMock.product.findUnique.mockResolvedValue({
        id: 'product-uuid-1',
        isDeleted: false,
        status: 'ACTIVE',
      });
      prismaMock.manufacturingProcess.findFirst
        .mockResolvedValueOnce(mockProcess)
        .mockResolvedValueOnce(null);

      await expect(service.createProcess(createDto)).rejects.toThrow(ConflictException);
    });

    it('should throw ConflictException if sequence conflicts', async () => {
      prismaMock.product.findUnique.mockResolvedValue({
        id: 'product-uuid-1',
        isDeleted: false,
        status: 'ACTIVE',
      });
      prismaMock.manufacturingProcess.findFirst
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(mockProcess);

      await expect(service.createProcess(createDto)).rejects.toThrow(ConflictException);
    });
  });

  describe('findAllProcesses', () => {
    it('should return paginated processes', async () => {
      prismaMock.manufacturingProcess.findMany.mockResolvedValue([mockProcess]);
      prismaMock.manufacturingProcess.count.mockResolvedValue(1);

      const result = await service.findAllProcesses({ page: 1, limit: 10 });

      expect(result.items.length).toBe(1);
      expect(result.total).toBe(1);
      expect(result.totalPages).toBe(1);
    });
  });

  describe('findProcessById', () => {
    it('should return process details if found', async () => {
      prismaMock.manufacturingProcess.findFirst.mockResolvedValue(mockProcess);

      const result = await service.findProcessById('process-uuid-1');

      expect(result.id).toBe('process-uuid-1');
    });

    it('should throw NotFoundException if process not found', async () => {
      prismaMock.manufacturingProcess.findFirst.mockResolvedValue(null);

      await expect(service.findProcessById('invalid-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateProcess', () => {
    it('should update process when found', async () => {
      prismaMock.manufacturingProcess.findFirst.mockResolvedValue(mockProcess);
      prismaMock.manufacturingProcess.update.mockResolvedValue({
        ...mockProcess,
        processName: 'CNC Milling',
      });

      const result = await service.updateProcess(
        'process-uuid-1',
        { processName: 'CNC Milling' },
        'performer-id',
      );

      expect(result.processName).toEqual('CNC Milling');
      expect(prismaMock.manufacturingProcess.update).toHaveBeenCalled();
      expect(prismaMock.auditLog.create).toHaveBeenCalled();
    });

    it('should throw NotFoundException if process not found', async () => {
      prismaMock.manufacturingProcess.findFirst.mockResolvedValue(null);

      await expect(
        service.updateProcess('invalid-id', { processName: 'CNC Milling' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('softDeleteProcess', () => {
    it('should soft delete process when not referenced', async () => {
      prismaMock.manufacturingProcess.findFirst.mockResolvedValue(mockProcess);
      prismaMock.indentProcess.count.mockResolvedValue(0);
      prismaMock.processCost.count.mockResolvedValue(0);
      prismaMock.manufacturingProcess.update.mockResolvedValue({
        ...mockProcess,
        isDeleted: true,
      });

      const result = await service.softDeleteProcess('process-uuid-1', 'performer-id');

      expect(result.message).toBeDefined();
      expect(prismaMock.manufacturingProcess.update).toHaveBeenCalled();
      expect(prismaMock.auditLog.create).toHaveBeenCalled();
    });

    it('should throw BadRequestException when referenced by transactions', async () => {
      prismaMock.manufacturingProcess.findFirst.mockResolvedValue(mockProcess);
      prismaMock.indentProcess.count.mockResolvedValue(1);
      prismaMock.processCost.count.mockResolvedValue(0);

      await expect(service.softDeleteProcess('process-uuid-1')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw NotFoundException if process not found', async () => {
      prismaMock.manufacturingProcess.findFirst.mockResolvedValue(null);

      await expect(service.softDeleteProcess('invalid-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('restoreProcess', () => {
    it('should restore a soft-deleted process', async () => {
      prismaMock.manufacturingProcess.findFirst.mockResolvedValue({
        ...mockProcess,
        isDeleted: true,
      });
      prismaMock.manufacturingProcess.update.mockResolvedValue(mockProcess);

      const result = await service.restoreProcess('process-uuid-1', 'performer-id');

      expect(result.isDeleted).toBeUndefined();
      expect(prismaMock.auditLog.create).toHaveBeenCalled();
    });

    it('should throw NotFoundException if deleted process not found', async () => {
      prismaMock.manufacturingProcess.findFirst.mockResolvedValue(null);

      await expect(service.restoreProcess('invalid-id')).rejects.toThrow(NotFoundException);
    });
  });
});
