import { Test, TestingModule } from '@nestjs/testing';
import { UnitsService } from './units.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { RedisCacheService } from '../redis-cache/redis-cache.service';

describe('UnitsService', () => {
  let service: UnitsService;
  let prismaMock: any;

  const mockUnit = {
    id: 'unit-uuid-1',
    unitCode: 'KG',
    unitName: 'Kilogram',
    symbol: 'kg',
    isDeleted: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    prismaMock = {
      unit: {
        findFirst: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      material: {
        count: jest.fn(),
      },
      indentItem: {
        count: jest.fn(),
      },
      additionalMaterialItem: {
        count: jest.fn(),
      },
      auditLog: {
        create: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [UnitsService, { provide: PrismaService, useValue: prismaMock }],
    }).compile();

    service = module.get<UnitsService>(UnitsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createUnit', () => {
    const createDto = { unitCode: 'KG', unitName: 'Kilogram', symbol: 'kg' };

    it('should successfully create a unit', async () => {
      prismaMock.unit.findFirst.mockResolvedValue(null);
      prismaMock.unit.create.mockResolvedValue(mockUnit);

      const result = await service.createUnit(createDto, 'performer-id');

      expect(result.unitCode).toEqual('KG');
      expect(prismaMock.unit.create).toHaveBeenCalled();
      expect(prismaMock.auditLog.create).toHaveBeenCalled();
    });

    it('should throw ConflictException if unit code exists', async () => {
      prismaMock.unit.findFirst.mockResolvedValue(mockUnit);

      await expect(service.createUnit(createDto)).rejects.toThrow(ConflictException);
    });
  });

  describe('findAllUnits', () => {
    it('should return paginated units', async () => {
      prismaMock.unit.findMany.mockResolvedValue([mockUnit]);
      prismaMock.unit.count.mockResolvedValue(1);

      const result = await service.findAllUnits({ page: 1, limit: 10 });

      expect(result.items.length).toBe(1);
      expect(result.total).toBe(1);
    });
  });

  describe('findUnitById', () => {
    it('should return unit details if found', async () => {
      prismaMock.unit.findFirst.mockResolvedValue(mockUnit);

      const result = await service.findUnitById('unit-uuid-1');

      expect(result.id).toBe('unit-uuid-1');
    });

    it('should throw NotFoundException if unit not found', async () => {
      prismaMock.unit.findFirst.mockResolvedValue(null);

      await expect(service.findUnitById('invalid-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateUnit', () => {
    it('should update unit when found', async () => {
      prismaMock.unit.findFirst.mockResolvedValue(mockUnit);
      prismaMock.unit.update.mockResolvedValue({ ...mockUnit, unitName: 'Kilo Gram' });

      const result = await service.updateUnit(
        'unit-uuid-1',
        { unitName: 'Kilo Gram' },
        'performer-id',
      );

      expect(result.unitName).toEqual('Kilo Gram');
      expect(prismaMock.unit.update).toHaveBeenCalled();
      expect(prismaMock.auditLog.create).toHaveBeenCalled();
    });

    it('should throw NotFoundException if unit not found', async () => {
      prismaMock.unit.findFirst.mockResolvedValue(null);

      await expect(service.updateUnit('invalid-id', { unitName: 'Kilo' })).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('softDeleteUnit', () => {
    it('should soft delete unit when not referenced', async () => {
      prismaMock.unit.findFirst.mockResolvedValue(mockUnit);
      prismaMock.material.count.mockResolvedValue(0);
      prismaMock.indentItem.count.mockResolvedValue(0);
      prismaMock.additionalMaterialItem.count.mockResolvedValue(0);
      prismaMock.unit.update.mockResolvedValue({ ...mockUnit, isDeleted: true });

      const result = await service.softDeleteUnit('unit-uuid-1', 'performer-id');

      expect(result.message).toBeDefined();
      expect(prismaMock.unit.update).toHaveBeenCalled();
    });

    it('should throw BadRequestException when referenced by materials', async () => {
      prismaMock.unit.findFirst.mockResolvedValue(mockUnit);
      prismaMock.material.count.mockResolvedValue(2);
      prismaMock.indentItem.count.mockResolvedValue(0);
      prismaMock.additionalMaterialItem.count.mockResolvedValue(0);

      await expect(service.softDeleteUnit('unit-uuid-1')).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if unit not found', async () => {
      prismaMock.unit.findFirst.mockResolvedValue(null);

      await expect(service.softDeleteUnit('invalid-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('restoreUnit', () => {
    it('should restore a soft-deleted unit', async () => {
      prismaMock.unit.findFirst.mockResolvedValue({ ...mockUnit, isDeleted: true });
      prismaMock.unit.update.mockResolvedValue(mockUnit);

      const result = await service.restoreUnit('unit-uuid-1', 'performer-id');

      expect(result.unitCode).toEqual('KG');
      expect(prismaMock.auditLog.create).toHaveBeenCalled();
    });

    it('should throw NotFoundException if deleted unit not found', async () => {
      prismaMock.unit.findFirst.mockResolvedValue(null);

      await expect(service.restoreUnit('invalid-id')).rejects.toThrow(NotFoundException);
    });
  });
});
