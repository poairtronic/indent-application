import { IsString, IsNotEmpty, IsOptional, IsDateString } from 'class-validator';

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

export class CustomerDeliveryDto {
  @IsDateString()
  @IsNotEmpty()
  deliveryDate: string;

  @IsString()
  @IsOptional()
  deliveryNotes?: string;

  @IsString()
  @IsOptional()
  customerReceiptReference?: string;
}
