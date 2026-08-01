import {
  IsString,
  IsOptional,
  IsArray,
  ValidateNested,
  IsUUID,
  IsNumber,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class MaterialIssueItemDto {
  @IsUUID()
  materialId: string;

  @IsNumber()
  @Min(0.0001)
  issuedQuantity: number;

  @IsString()
  @IsOptional()
  remarks?: string;
}

export class StoresIssueDto {
  @IsString()
  @IsOptional()
  remarks?: string;

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => MaterialIssueItemDto)
  issueItems?: MaterialIssueItemDto[];
}
