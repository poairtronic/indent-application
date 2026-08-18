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
  @IsString()
  @IsOptional()
  materialName?: string;

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

  @IsNumber()
  @IsOptional()
  actualRate?: number;

  @IsNumber()
  @IsOptional()
  actualQuantity?: number;

  @IsNumber()
  @IsOptional()
  actualAmount?: number;

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

  @IsNumber()
  @IsOptional()
  actualCost?: number;

  @IsNumber()
  @IsOptional()
  actualHours?: number;

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

  @IsNumber()
  @IsOptional()
  actualTotal?: number;

  @IsNumber()
  @IsOptional()
  designCost?: number;

  @IsNumber()
  @IsOptional()
  overheadCost?: number;

  @IsNumber()
  @IsOptional()
  contingencyCost?: number;

  @IsNumber()
  @IsOptional()
  actualDesignCost?: number;

  @IsNumber()
  @IsOptional()
  actualOverheadCost?: number;

  @IsNumber()
  @IsOptional()
  actualContingencyCost?: number;

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

  @IsNumber()
  @IsOptional()
  actualTotal?: number;

  @IsNumber()
  @IsOptional()
  designCost?: number;

  @IsNumber()
  @IsOptional()
  overheadCost?: number;

  @IsNumber()
  @IsOptional()
  contingencyCost?: number;

  @IsNumber()
  @IsOptional()
  actualDesignCost?: number;

  @IsNumber()
  @IsOptional()
  actualOverheadCost?: number;

  @IsNumber()
  @IsOptional()
  actualContingencyCost?: number;

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
