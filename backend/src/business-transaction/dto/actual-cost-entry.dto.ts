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
  @IsNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => ActualCostItemDto)
  costItems: ActualCostItemDto[];

  @IsArray()
  @IsNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => ActualProcessCostDto)
  processCosts: ActualProcessCostDto[];

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
