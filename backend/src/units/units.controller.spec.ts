import { Test, TestingModule } from '@nestjs/testing';
import { UnitsController } from './units.controller';
import { UnitsService } from './units.service';
import { Reflector } from '@nestjs/core';

describe('UnitsController', () => {
  let controller: UnitsController;
  let serviceMock: any;

  const mockUnitResponse = {
    id: 'unit-uuid-1',
    unitCode: 'KG',
    unitName: 'Kilogram',
    symbol: 'kg',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    serviceMock = {
      createUnit: jest.fn().mockResolvedValue(mockUnitResponse),
      findAllUnits: jest.fn().mockResolvedValue({
        items: [mockUnitResponse],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      }),
      findUnitById: jest.fn().mockResolvedValue(mockUnitResponse),
      updateUnit: jest.fn().mockResolvedValue(mockUnitResponse),
      softDeleteUnit: jest.fn().mockResolvedValue({ message: 'Unit deleted successfully.' }),
      restoreUnit: jest.fn().mockResolvedValue(mockUnitResponse),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UnitsController],
      providers: [{ provide: UnitsService, useValue: serviceMock }, Reflector],
    }).compile();

    controller = module.get<UnitsController>(UnitsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should call createUnit in service', async () => {
    const dto: any = { unitCode: 'KG', unitName: 'Kilogram', symbol: 'kg' };
    const result = await controller.createUnit(dto, { id: 'admin-id' });
    expect(serviceMock.createUnit).toHaveBeenCalledWith(dto, 'admin-id');
    expect(result).toEqual(mockUnitResponse);
  });

  it('should call findAllUnits in service', async () => {
    const query = { page: 1, limit: 10 };
    const result = await controller.findAllUnits(query);
    expect(serviceMock.findAllUnits).toHaveBeenCalledWith(query);
    expect(result.items.length).toBe(1);
  });

  it('should call findUnitById in service', async () => {
    const result = await controller.findUnitById('unit-uuid-1');
    expect(serviceMock.findUnitById).toHaveBeenCalledWith('unit-uuid-1');
    expect(result.id).toBe('unit-uuid-1');
  });

  it('should call updateUnit in service', async () => {
    const dto: any = { unitName: 'Kilo Gram' };
    const result = await controller.updateUnit('unit-uuid-1', dto, { id: 'admin-id' });
    expect(serviceMock.updateUnit).toHaveBeenCalledWith('unit-uuid-1', dto, 'admin-id');
    expect(result).toEqual(mockUnitResponse);
  });

  it('should call softDeleteUnit in service', async () => {
    const result = await controller.softDeleteUnit('unit-uuid-1', { id: 'admin-id' });
    expect(serviceMock.softDeleteUnit).toHaveBeenCalledWith('unit-uuid-1', 'admin-id');
    expect(result.message).toBeDefined();
  });

  it('should call restoreUnit in service', async () => {
    const result = await controller.restoreUnit('unit-uuid-1', { id: 'admin-id' });
    expect(serviceMock.restoreUnit).toHaveBeenCalledWith('unit-uuid-1', 'admin-id');
    expect(result).toEqual(mockUnitResponse);
  });
});
