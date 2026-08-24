import { Test, TestingModule } from '@nestjs/testing';
import { VendorsService } from './vendors.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { VendorStatus } from '@prisma/client';
import { VendorStatus } from '@prisma/client';

describe('VendorsService', () => {
  let service: VendorsService;
  let prismaMock: any;

  const mockVendor = {
    id: 'vendor-uuid-1',
    vendorCode: 'VND-0001',
    vendorName: 'Acme Steels Pvt Ltd',
    email: 'contact@acmesteels.com',
    phone: '+91 98765 43210',
    gstNumber: '27AABCU9603R1ZM',
    panNumber: 'AABCU9603R',
    address: '42, Industrial Estate, Hosur Road',
    city: 'Bengaluru',
    state: 'Karnataka',
    country: 'India',
    pincode: '560001',
    status: VendorStatus.ACTIVE,
    isDeleted: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    prismaMock = {
      vendor: {
        findFirst: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      materialVendor: {
        count: jest.fn(),
      },
      costItem: {
        count: jest.fn(),
      },
      auditLog: {
        create: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [VendorsService, { provide: PrismaService, useValue: prismaMock }],
    }).compile();

    service = module.get<VendorsService>(VendorsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createVendor', () => {
    const createDto = {
      vendorCode: 'VND-0001',
      vendorName: 'Acme Steels Pvt Ltd',
      email: 'contact@acmesteels.com',
      address: '42, Industrial Estate, Hosur Road',
      city: 'Bengaluru',
      state: 'Karnataka',
      country: 'India',
      pincode: '560001',
      gstNumber: '27AABCU9603R1ZM',
      panNumber: 'AABCU9603R',
    };

    it('should successfully create a vendor', async () => {
      prismaMock.vendor.findFirst.mockResolvedValue(null);
      prismaMock.vendor.create.mockResolvedValue(mockVendor);

      const result = await service.createVendor(createDto, 'performer-id');

      expect(result.vendorCode).toEqual('VND-0001');
      expect(result.email).toEqual('contact@acmesteels.com');
      expect(prismaMock.vendor.create).toHaveBeenCalled();
      expect(prismaMock.auditLog.create).toHaveBeenCalled();
    });

    it('should throw ConflictException if vendor code exists', async () => {
      prismaMock.vendor.findFirst.mockResolvedValueOnce(mockVendor).mockResolvedValue(null);

      await expect(service.createVendor(createDto)).rejects.toThrow(ConflictException);
    });

    it('should throw ConflictException if email exists', async () => {
      prismaMock.vendor.findFirst
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(mockVendor)
        .mockResolvedValue(null)
        .mockResolvedValue(null);

      await expect(service.createVendor(createDto)).rejects.toThrow(ConflictException);
    });

    it('should throw ConflictException if GST number exists', async () => {
      prismaMock.vendor.findFirst
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(mockVendor)
        .mockResolvedValue(null);

      await expect(service.createVendor(createDto)).rejects.toThrow(ConflictException);
    });
  });

  describe('findAllVendors', () => {
    it('should return paginated vendors', async () => {
      prismaMock.vendor.findMany.mockResolvedValue([mockVendor]);
      prismaMock.vendor.count.mockResolvedValue(1);

      const result = await service.findAllVendors({ page: 1, limit: 10 });

      expect(result.items.length).toBe(1);
      expect(result.total).toBe(1);
    });
  });

  describe('findVendorById', () => {
    it('should return vendor details if found', async () => {
      prismaMock.vendor.findFirst.mockResolvedValue(mockVendor);

      const result = await service.findVendorById('vendor-uuid-1');

      expect(result.id).toBe('vendor-uuid-1');
    });

    it('should throw NotFoundException if vendor not found', async () => {
      prismaMock.vendor.findFirst.mockResolvedValue(null);

      await expect(service.findVendorById('invalid-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateVendor', () => {
    it('should update vendor when found', async () => {
      prismaMock.vendor.findFirst.mockResolvedValue(mockVendor);
      prismaMock.vendor.update.mockResolvedValue({ ...mockVendor, vendorName: 'Acme Steels Ltd' });

      const result = await service.updateVendor(
        'vendor-uuid-1',
        { vendorName: 'Acme Steels Ltd' },
        'performer-id',
      );

      expect(result.vendorName).toEqual('Acme Steels Ltd');
      expect(prismaMock.vendor.update).toHaveBeenCalled();
      expect(prismaMock.auditLog.create).toHaveBeenCalled();
    });

    it('should throw NotFoundException if vendor not found', async () => {
      prismaMock.vendor.findFirst.mockResolvedValue(null);

      await expect(service.updateVendor('invalid-id', { vendorName: 'Acme' })).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('softDeleteVendor', () => {
    it('should soft delete vendor when not referenced', async () => {
      prismaMock.vendor.findFirst.mockResolvedValue(mockVendor);
      prismaMock.materialVendor.count.mockResolvedValue(0);
      prismaMock.costItem.count.mockResolvedValue(0);
      prismaMock.vendor.update.mockResolvedValue({ ...mockVendor, isDeleted: true });

      const result = await service.softDeleteVendor('vendor-uuid-1', 'performer-id');

      expect(result.message).toBeDefined();
      expect(prismaMock.vendor.update).toHaveBeenCalled();
      expect(prismaMock.auditLog.create).toHaveBeenCalled();
    });

    it('should throw BadRequestException when referenced by cost items', async () => {
      prismaMock.vendor.findFirst.mockResolvedValue(mockVendor);
      prismaMock.materialVendor.count.mockResolvedValue(0);
      prismaMock.costItem.count.mockResolvedValue(3);

      await expect(service.softDeleteVendor('vendor-uuid-1')).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if vendor not found', async () => {
      prismaMock.vendor.findFirst.mockResolvedValue(null);

      await expect(service.softDeleteVendor('invalid-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('restoreVendor', () => {
    it('should restore a soft-deleted vendor', async () => {
      prismaMock.vendor.findFirst.mockResolvedValue({ ...mockVendor, isDeleted: true });
      prismaMock.vendor.update.mockResolvedValue(mockVendor);

      const result = await service.restoreVendor('vendor-uuid-1', 'performer-id');

      expect(result.vendorCode).toEqual('VND-0001');
      expect(prismaMock.auditLog.create).toHaveBeenCalled();
    });

    it('should throw NotFoundException if deleted vendor not found', async () => {
      prismaMock.vendor.findFirst.mockResolvedValue(null);

      await expect(service.restoreVendor('invalid-id')).rejects.toThrow(NotFoundException);
    });
  });
});
