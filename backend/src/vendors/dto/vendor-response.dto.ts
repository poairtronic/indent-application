import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { VendorStatus } from '@prisma/client';

export class VendorResponseDto {
  @ApiProperty({ example: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d' })
  id: string;

  @ApiProperty({ example: 'VND-0001' })
  vendorCode: string;

  @ApiProperty({ example: 'Acme Steels Pvt Ltd' })
  vendorName: string;

  @ApiProperty({ example: 'contact@acmesteels.com' })
  email: string;

  @ApiPropertyOptional({ example: '+91 98765 43210' })
  phone?: string | null;

  @ApiPropertyOptional({ example: '27AABCU9603R1ZM' })
  gstNumber?: string | null;

  @ApiPropertyOptional({ example: 'AABCU9603R' })
  panNumber?: string | null;

  @ApiProperty({ example: '42, Industrial Estate, Hosur Road' })
  address: string;

  @ApiProperty({ example: 'Bengaluru' })
  city: string;

  @ApiProperty({ example: 'Karnataka' })
  state: string;

  @ApiProperty({ example: 'India' })
  country: string;

  @ApiProperty({ example: '560001' })
  pincode: string;

  @ApiProperty({ enum: VendorStatus, example: VendorStatus.ACTIVE })
  status: VendorStatus;

  @ApiProperty({ example: '2026-07-01T00:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2026-07-31T00:00:00.000Z' })
  updatedAt: Date;
}
