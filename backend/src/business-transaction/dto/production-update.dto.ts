import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class ProductionReceiptDto {
  @IsString()
  @IsOptional()
  remarks?: string;
}

export class ProductionUpdateDto {
  @IsString()
  @IsNotEmpty()
  statusNotes: string;

  @IsString()
  @IsOptional()
  remarks?: string;
}
