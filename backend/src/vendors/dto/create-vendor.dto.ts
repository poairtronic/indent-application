import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';
import { VendorStatus } from '@prisma/client';
import {
  GST_NUMBER_PATTERN,
  PAN_NUMBER_PATTERN,
  VENDOR_CITY_MAX_LENGTH,
  VENDOR_CODE_MAX_LENGTH,
  VENDOR_COUNTRY_MAX_LENGTH,
  VENDOR_EMAIL_MAX_LENGTH,
  VENDOR_GST_MAX_LENGTH,
  VENDOR_NAME_MAX_LENGTH,
  VENDOR_PAN_MAX_LENGTH,
  VENDOR_PHONE_MAX_LENGTH,
  VENDOR_PINCODE_MAX_LENGTH,
  VENDOR_STATE_MAX_LENGTH,
} from '../constants/vendor.constants';

export class CreateVendorDto {
  @ApiProperty({ example: 'VND-0001', description: 'Unique vendor code' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(VENDOR_CODE_MAX_LENGTH)
  vendorCode: string;

  @ApiProperty({ example: 'Acme Steels Pvt Ltd', description: 'Vendor name' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(VENDOR_NAME_MAX_LENGTH)
  vendorName: string;

  @ApiProperty({ example: 'contact@acmesteels.com', description: 'Unique vendor email' })
  @IsEmail()
  @IsNotEmpty()
  @MaxLength(VENDOR_EMAIL_MAX_LENGTH)
  email: string;

  @ApiPropertyOptional({ example: '+91 98765 43210', description: 'Contact phone number' })
  @IsOptional()
  @IsString()
  @MaxLength(VENDOR_PHONE_MAX_LENGTH)
  phone?: string;

  @ApiPropertyOptional({
    example: '27AABCU9603R1ZM',
    description: 'GST registration number (unique)',
  })
  @IsOptional()
  @IsString()
  @MaxLength(VENDOR_GST_MAX_LENGTH)
  @Matches(GST_NUMBER_PATTERN, { message: 'GST number must be a valid 15-character format' })
  gstNumber?: string;

  @ApiPropertyOptional({ example: 'AABCU9603R', description: 'PAN number (unique)' })
  @IsOptional()
  @IsString()
  @MaxLength(VENDOR_PAN_MAX_LENGTH)
  @Matches(PAN_NUMBER_PATTERN, { message: 'PAN number must be a valid 10-character format' })
  panNumber?: string;

  @ApiProperty({ example: '42, Industrial Estate, Hosur Road', description: 'Registered address' })
  @IsString()
  @IsNotEmpty()
  address: string;

  @ApiProperty({ example: 'Bengaluru', description: 'City' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(VENDOR_CITY_MAX_LENGTH)
  city: string;

  @ApiProperty({ example: 'Karnataka', description: 'State' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(VENDOR_STATE_MAX_LENGTH)
  state: string;

  @ApiProperty({ example: 'India', description: 'Country' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(VENDOR_COUNTRY_MAX_LENGTH)
  country: string;

  @ApiProperty({ example: '560001', description: 'Postal code' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(VENDOR_PINCODE_MAX_LENGTH)
  pincode: string;

  @ApiPropertyOptional({
    enum: VendorStatus,
    default: VendorStatus.ACTIVE,
    description: 'Vendor status',
  })
  @IsOptional()
  @IsEnum(VendorStatus)
  status?: VendorStatus;
}
