import { IsString, IsNotEmpty, IsNumber, IsOptional, IsIn, Min } from 'class-validator';

export class ItemIssuedDto {
  @IsString()
  @IsNotEmpty()
  indentId: string;

  @IsString()
  @IsNotEmpty()
  indentNumber: string;

  @IsString()
  @IsNotEmpty()
  mercItemId: string;

  @IsString()
  @IsIn(['RAW_MATERIAL', 'BROUGHT_OUT'])
  itemType: 'RAW_MATERIAL' | 'BROUGHT_OUT';

  @IsNumber()
  @Min(0)
  quantityIssued: number;

  @IsString()
  @IsOptional()
  issuedAt?: string;

  @IsString()
  @IsNotEmpty()
  issuedByName: string;

  @IsString()
  @IsIn(['ISSUED', 'PARTIAL'])
  newItemStatus: 'ISSUED' | 'PARTIAL';

  @IsString()
  @IsIn(['ISSUED', 'PARTIAL', 'PENDING'])
  newIndentStatus: 'ISSUED' | 'PARTIAL' | 'PENDING';
}
