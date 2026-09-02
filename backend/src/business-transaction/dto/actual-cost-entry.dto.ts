import {
  IsString,
  IsUUID,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  Min,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class ActualCostItemDto {
  @IsUUID()
  @IsNotEmpty()
  costItemId: string;

  @IsNumber()
  @Min(0)
  actualRate: number;

  @IsNumber()
  @Min(0)
  actualQuantity: number;

  @IsString()
  @IsOptional()
  remarks?: string;
}

export class ActualBroughtMaterialDto {
  @IsUUID()
  @IsNotEmpty()
  broughtMaterialId: string;

  @IsNumber()
  @Min(0)
  actualAmount: number;

  @IsString()
  @IsOptional()
  remarks?: string;
}

export class ActualProcessCostDto {
  @IsUUID()
  @IsNotEmpty()
  processCostId: string;

  @IsNumber()
  @Min(0)
  actualCost: number;

  @IsNumber()
  @Min(0)
  actualHours: number;
}

export class ActualCostEntryDto {
  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => ActualCostItemDto)
  costItems?: ActualCostItemDto[];

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => ActualProcessCostDto)
  processCosts?: ActualProcessCostDto[];

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => ActualBroughtMaterialDto)
  broughtMaterials?: ActualBroughtMaterialDto[];

  @IsNumber()
  @Min(0)
  @IsOptional()
  actualDesignCost?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  actualOverheadCost?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  actualContingencyCost?: number;

  @IsString()
  @IsOptional()
  remarks?: string;
}

export class FinancialClosureDto {
  @IsString()
  @IsOptional()
  closureNotes?: string;

  @IsString()
  @IsOptional()
  remarks?: string;
}
