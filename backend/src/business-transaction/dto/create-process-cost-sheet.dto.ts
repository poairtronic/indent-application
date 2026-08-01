import {
  IsString,
  IsUUID,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsArray,
  ValidateNested,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { VendorProcessType } from '../enums/workflow-state.enum';

export class CostItemDto {
  @IsUUID()
  @IsNotEmpty()
  materialId: string;

  @IsUUID()
  @IsOptional()
  vendorId?: string;

  @IsNumber()
  @Min(0)
  predictedRate: number;

  @IsNumber()
  @Min(0.0001)
  predictedQuantity: number;

  @IsNumber()
  @Min(0)
  predictedAmount: number;

  @IsString()
  @IsOptional()
  remarks?: string;
}

export class ProcessCostDto {
  @IsUUID()
  @IsNotEmpty()
  processId: string;

  @IsNumber()
  @Min(0)
  predictedCost: number;

  @IsNumber()
  @Min(0)
  estimatedHours: number;

  @IsEnum(VendorProcessType)
  @IsOptional()
  vendorType?: VendorProcessType;

  @IsUUID()
  @IsOptional()
  vendorId?: string;
}

export class CreateProcessCostSheetDto {
  @IsNumber()
  @Min(0)
  predictedTotal: number;

  @IsArray()
  @IsNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => CostItemDto)
  costItems: CostItemDto[];

  @IsArray()
  @IsNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => ProcessCostDto)
  processCosts: ProcessCostDto[];
}

export class UpdateProcessCostSheetDto {
  @IsNumber()
  @IsOptional()
  @Min(0)
  predictedTotal?: number;

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => CostItemDto)
  costItems?: CostItemDto[];

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => ProcessCostDto)
  processCosts?: ProcessCostDto[];
}
