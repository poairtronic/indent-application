import {
  IsString,
  IsUUID,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsDateString,
  IsNumber,
  IsArray,
  ValidateNested,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { IndentPriority, FileType } from '../enums/workflow-state.enum';

export class IndentProcessDto {
  @IsUUID()
  @IsNotEmpty()
  processId: string;

  @IsNumber()
  @Min(1)
  sequence: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  estimatedHours?: number;
}

export class IndentItemDto {
  @IsString()
  @IsNotEmpty()
  materialName: string;

  @IsNumber()
  @Min(0.0001)
  quantity: number;

  @IsUUID()
  @IsNotEmpty()
  unitId: string;

  @IsString()
  @IsOptional()
  shape?: string;

  @IsNumber()
  @IsOptional()
  diameterMm?: number;

  @IsNumber()
  @IsOptional()
  lengthMm?: number;

  @IsNumber()
  @IsOptional()
  widthMm?: number;

  @IsNumber()
  @IsOptional()
  heightMm?: number;

  @IsNumber()
  @IsOptional()
  unitWeightKg?: number;

  @IsNumber()
  @IsOptional()
  totalWeightKg?: number;

  @IsString()
  @IsOptional()
  remarks?: string;

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => IndentProcessDto)
  processes?: IndentProcessDto[];
}

export class IndentAttachmentDto {
  @IsString()
  @IsNotEmpty()
  fileName: string;

  @IsString()
  @IsNotEmpty()
  fileUrl: string;

  @IsEnum(FileType)
  @IsNotEmpty()
  fileType: FileType;
}

export class CreateIndentSheetDto {
  @IsString()
  @IsOptional()
  customerName?: string;

  @IsString()
  @IsOptional()
  layoutNumber?: string;

  @IsString()
  @IsNotEmpty()
  productName: string;

  @IsString()
  @IsNotEmpty()
  departmentName: string;

  @IsEnum(IndentPriority)
  @IsNotEmpty()
  priority: IndentPriority;

  @IsDateString()
  @IsNotEmpty()
  requiredDate: string;

  @IsDateString()
  @IsOptional()
  requiredDeliveryDate?: string;

  @IsString()
  @IsOptional()
  purpose?: string;

  @IsString()
  @IsOptional()
  remarks?: string;

  @IsArray()
  @IsNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => IndentItemDto)
  items: IndentItemDto[];

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => IndentAttachmentDto)
  attachments?: IndentAttachmentDto[];
}

export class UpdateIndentSheetDto {
  @IsString()
  @IsOptional()
  customerName?: string;

  @IsString()
  @IsOptional()
  layoutNumber?: string;

  @IsString()
  @IsOptional()
  productName?: string;

  @IsString()
  @IsOptional()
  departmentName?: string;

  @IsEnum(IndentPriority)
  @IsOptional()
  priority?: IndentPriority;

  @IsDateString()
  @IsOptional()
  requiredDate?: string;

  @IsDateString()
  @IsOptional()
  requiredDeliveryDate?: string;

  @IsString()
  @IsOptional()
  purpose?: string;

  @IsString()
  @IsOptional()
  remarks?: string;

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => IndentItemDto)
  items?: IndentItemDto[];
}
