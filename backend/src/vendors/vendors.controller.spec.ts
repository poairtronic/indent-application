import { Test, TestingModule } from '@nestjs/testing';
import { VendorsController } from './vendors.controller';
import { VendorsService } from './vendors.service';
import { VendorStatus } from '@prisma/client';
import { Reflector } from '@nestjs/core';

describe('VendorsController', () => {
  let controller: VendorsController;
  let serviceMock: any;

  const mockVendorResponse = {
    id: 'vendor-uuid-1',
    vendorCode: 'VND-0001',
    vendorName: 'Acme Steels Pvt Ltd',
    email: 'contact@acmesteels.com',
    address: '42, Industrial Estate, Hosur Road',
    city: 'Bengaluru',
    state: 'Karnataka',
    country: 'India',
    pincode: '560001',
    status: VendorStatus.ACTIVE,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    serviceMock = {
      createVendor: jest.fn().mockResolvedValue(mockVendorResponse),
      findAllVendors: jest.fn().mockResolvedValue({
        items: [mockVendorResponse],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      }),
      findVendorById: jest.fn().mockResolvedValue(mockVendorResponse),
      updateVendor: jest.fn().mockResolvedValue(mockVendorResponse),
      softDeleteVendor: jest.fn().mockResolvedValue({ message: 'Vendor deleted successfully.' }),
      restoreVendor: jest.fn().mockResolvedValue(mockVendorResponse),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [VendorsController],
      providers: [{ provide: VendorsService, useValue: serviceMock }, Reflector],
    }).compile();

    controller = module.get<VendorsController>(VendorsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should call createVendor in service', async () => {
    const dto: any = { vendorCode: 'VND-0001', email: 'contact@acmesteels.com' };
    const result = await controller.createVendor(dto, { id: 'admin-id' });
    expect(serviceMock.createVendor).toHaveBeenCalledWith(dto, 'admin-id');
    expect(result).toEqual(mockVendorResponse);
  });

  it('should call findAllVendors in service', async () => {
    const query = { page: 1, limit: 10 };
    const result = await controller.findAllVendors(query);
    expect(serviceMock.findAllVendors).toHaveBeenCalledWith(query);
    expect(result.items.length).toBe(1);
  });

  it('should call findVendorById in service', async () => {
    const result = await controller.findVendorById('vendor-uuid-1');
    expect(serviceMock.findVendorById).toHaveBeenCalledWith('vendor-uuid-1');
    expect(result.id).toBe('vendor-uuid-1');
  });

  it('should call updateVendor in service', async () => {
    const dto: any = { vendorName: 'Acme Steels Ltd' };
    const result = await controller.updateVendor('vendor-uuid-1', dto, { id: 'admin-id' });
    expect(serviceMock.updateVendor).toHaveBeenCalledWith('vendor-uuid-1', dto, 'admin-id');
    expect(result).toEqual(mockVendorResponse);
  });

  it('should call softDeleteVendor in service', async () => {
    const result = await controller.softDeleteVendor('vendor-uuid-1', { id: 'admin-id' });
    expect(serviceMock.softDeleteVendor).toHaveBeenCalledWith('vendor-uuid-1', 'admin-id');
    expect(result.message).toBeDefined();
  });

  it('should call restoreVendor in service', async () => {
    const result = await controller.restoreVendor('vendor-uuid-1', { id: 'admin-id' });
    expect(serviceMock.restoreVendor).toHaveBeenCalledWith('vendor-uuid-1', 'admin-id');
    expect(result).toEqual(mockVendorResponse);
  });
});
