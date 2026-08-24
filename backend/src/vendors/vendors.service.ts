import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateVendorDto } from './dto/create-vendor.dto';
import { UpdateVendorDto } from './dto/update-vendor.dto';
import { VendorQueryDto } from './dto/vendor-query.dto';
import { VendorResponseDto } from './dto/vendor-response.dto';
import { VENDOR_MESSAGES } from './constants/vendor-messages.constants';
import { Prisma } from '@prisma/client';

@Injectable()
export class VendorsService {
  constructor(private readonly prisma: PrismaService) {}

  private mapToVendorResponse(vendor: any): VendorResponseDto {
    return {
      id: vendor.id,
      vendorCode: vendor.vendorCode,
      vendorName: vendor.vendorName,
      email: vendor.email,
      phone: vendor.phone ?? null,
      gstNumber: vendor.gstNumber ?? null,
      panNumber: vendor.panNumber ?? null,
      address: vendor.address,
      city: vendor.city,
      state: vendor.state,
      country: vendor.country,
      pincode: vendor.pincode,
      status: vendor.status,
      createdAt: vendor.createdAt,
      updatedAt: vendor.updatedAt,
    };
  }

  private async createAuditLog(
    action: string,
    recordId: string,
    oldValue: any | null,
    newValue: any | null,
    performedBy?: string,
  ): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          module: 'Vendor',
          recordId,
          action,
          oldValue: oldValue ? JSON.parse(JSON.stringify(oldValue)) : Prisma.JsonNull,
          newValue: newValue ? JSON.parse(JSON.stringify(newValue)) : Prisma.JsonNull,
          performedBy: performedBy ?? null,
        },
      });
    } catch {
      // Audit failure logging catch to ensure execution integrity
    }
  }

  private async assertVendorCodeAvailable(vendorCode: string, excludeId?: string): Promise<void> {
    const existing = await this.prisma.vendor.findFirst({
      where: {
        vendorCode,
        isDeleted: false,
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
    });
    if (existing) {
      throw new ConflictException(VENDOR_MESSAGES.CODE_EXISTS);
    }
  }

  private async assertEmailAvailable(email: string, excludeId?: string): Promise<void> {
    const existing = await this.prisma.vendor.findFirst({
      where: {
        email,
        isDeleted: false,
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
    });
    if (existing) {
      throw new ConflictException(VENDOR_MESSAGES.EMAIL_EXISTS);
    }
  }

  private async assertGstNumberAvailable(gstNumber: string, excludeId?: string): Promise<void> {
    const existing = await this.prisma.vendor.findFirst({
      where: {
        gstNumber,
        isDeleted: false,
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
    });
    if (existing) {
      throw new ConflictException(VENDOR_MESSAGES.GST_EXISTS);
    }
  }

  private async assertPanNumberAvailable(panNumber: string, excludeId?: string): Promise<void> {
    const existing = await this.prisma.vendor.findFirst({
      where: {
        panNumber,
        isDeleted: false,
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
    });
    if (existing) {
      throw new ConflictException(VENDOR_MESSAGES.PAN_EXISTS);
    }
  }

  async createVendor(dto: CreateVendorDto, performingUserId?: string): Promise<VendorResponseDto> {
    await this.assertVendorCodeAvailable(dto.vendorCode);
    const email = dto.email.toLowerCase();
    await this.assertEmailAvailable(email);
    if (dto.gstNumber) {
      await this.assertGstNumberAvailable(dto.gstNumber.toUpperCase());
    }
    if (dto.panNumber) {
      await this.assertPanNumberAvailable(dto.panNumber.toUpperCase());
    }

    const newVendor = await this.prisma.vendor.create({
      data: {
        vendorCode: dto.vendorCode,
        vendorName: dto.vendorName,
        email,
        phone: dto.phone,
        gstNumber: dto.gstNumber ? dto.gstNumber.toUpperCase() : undefined,
        panNumber: dto.panNumber ? dto.panNumber.toUpperCase() : undefined,
        address: dto.address,
        city: dto.city,
        state: dto.state,
        country: dto.country,
        pincode: dto.pincode,
        status: dto.status,
        createdBy: performingUserId,
      },
    });

    const response = this.mapToVendorResponse(newVendor);
    await this.createAuditLog('CREATE', newVendor.id, null, response, performingUserId);

    return response;
  }

  async findAllVendors(query: VendorQueryDto): Promise<{
    items: VendorResponseDto[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const page = Math.max(1, query.page ?? 1);
    const limit = Math.max(1, Math.min(100, query.limit ?? 10));
    const skip = (page - 1) * limit;

    const where: Prisma.VendorWhereInput = {
      isDeleted: false,
    };

    if (query.status) {
      where.status = query.status;
    }

    if (query.search) {
      const searchTerm = query.search.trim();
      where.OR = [
        { vendorCode: { contains: searchTerm, mode: 'insensitive' } },
        { vendorName: { contains: searchTerm, mode: 'insensitive' } },
        { email: { contains: searchTerm, mode: 'insensitive' } },
        { gstNumber: { contains: searchTerm, mode: 'insensitive' } },
      ];
    }

    const [vendors, total] = await Promise.all([
      this.prisma.vendor.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.vendor.count({ where }),
    ]);

    const items = vendors.map((v) => this.mapToVendorResponse(v));
    const totalPages = Math.ceil(total / limit);

    return {
      items,
      total,
      page,
      limit,
      totalPages,
    };
  }

  async findVendorById(id: string): Promise<VendorResponseDto> {
    const vendor = await this.prisma.vendor.findFirst({
      where: { id, isDeleted: false },
    });

    if (!vendor) {
      throw new NotFoundException(VENDOR_MESSAGES.NOT_FOUND);
    }

    return this.mapToVendorResponse(vendor);
  }

  async updateVendor(
    id: string,
    dto: UpdateVendorDto,
    performingUserId?: string,
  ): Promise<VendorResponseDto> {
    const currentVendor = await this.prisma.vendor.findFirst({
      where: { id, isDeleted: false },
    });

    if (!currentVendor) {
      throw new NotFoundException(VENDOR_MESSAGES.NOT_FOUND);
    }

    if (dto.vendorCode && dto.vendorCode !== currentVendor.vendorCode) {
      await this.assertVendorCodeAvailable(dto.vendorCode, id);
    }

    const nextEmail = dto.email ? dto.email.toLowerCase() : currentVendor.email;
    if (nextEmail !== currentVendor.email) {
      await this.assertEmailAvailable(nextEmail, id);
    }

    const nextGst = dto.gstNumber ? dto.gstNumber.toUpperCase() : currentVendor.gstNumber;
    if (nextGst && nextGst !== currentVendor.gstNumber) {
      await this.assertGstNumberAvailable(nextGst, id);
    }

    const nextPan = dto.panNumber ? dto.panNumber.toUpperCase() : currentVendor.panNumber;
    if (nextPan && nextPan !== currentVendor.panNumber) {
      await this.assertPanNumberAvailable(nextPan, id);
    }

    const updatedVendor = await this.prisma.vendor.update({
      where: { id },
      data: {
        ...(dto.vendorCode && { vendorCode: dto.vendorCode }),
        ...(dto.vendorName && { vendorName: dto.vendorName }),
        ...(dto.email && { email: dto.email.toLowerCase() }),
        ...(dto.phone !== undefined && { phone: dto.phone }),
        ...(dto.gstNumber !== undefined && {
          gstNumber: dto.gstNumber ? dto.gstNumber.toUpperCase() : null,
        }),
        ...(dto.panNumber !== undefined && {
          panNumber: dto.panNumber ? dto.panNumber.toUpperCase() : null,
        }),
        ...(dto.address && { address: dto.address }),
        ...(dto.city && { city: dto.city }),
        ...(dto.state && { state: dto.state }),
        ...(dto.country && { country: dto.country }),
        ...(dto.pincode && { pincode: dto.pincode }),
        ...(dto.status && { status: dto.status }),
        updatedBy: performingUserId,
      },
    });

    const oldResponse = this.mapToVendorResponse(currentVendor);
    const newResponse = this.mapToVendorResponse(updatedVendor);
    await this.createAuditLog('UPDATE', id, oldResponse, newResponse, performingUserId);

    return newResponse;
  }

  async softDeleteVendor(id: string, performingUserId?: string): Promise<{ message: string }> {
    const currentVendor = await this.prisma.vendor.findFirst({
      where: { id, isDeleted: false },
    });

    if (!currentVendor) {
      throw new NotFoundException(VENDOR_MESSAGES.NOT_FOUND);
    }

    const [materialReferences, costItemReferences] = await Promise.all([
      this.prisma.materialVendor.count({ where: { vendorId: id, isDeleted: false } }),
      this.prisma.costItem.count({ where: { vendorId: id, isDeleted: false } }),
    ]);

    if (materialReferences > 0 || costItemReferences > 0) {
      throw new BadRequestException(VENDOR_MESSAGES.IN_USE_DELETE);
    }

    await this.prisma.vendor.update({
      where: { id },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
        deletedBy: performingUserId,
      },
    });

    await this.createAuditLog(
      'DELETE',
      id,
      { status: currentVendor.status },
      null,
      performingUserId,
    );

    return { message: VENDOR_MESSAGES.DELETED_SUCCESS };
  }

  async restoreVendor(id: string, performingUserId?: string): Promise<VendorResponseDto> {
    const currentVendor = await this.prisma.vendor.findFirst({
      where: { id, isDeleted: true },
    });

    if (!currentVendor) {
      throw new NotFoundException(VENDOR_MESSAGES.NOT_FOUND);
    }

    const restoredVendor = await this.prisma.vendor.update({
      where: { id },
      data: {
        isDeleted: false,
        deletedAt: null,
        updatedBy: performingUserId,
      },
    });

    const response = this.mapToVendorResponse(restoredVendor);
    await this.createAuditLog('RESTORE', id, null, response, performingUserId);

    return response;
  }
}
