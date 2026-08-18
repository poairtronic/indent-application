import { IsString, IsOptional, IsEnum } from 'class-validator';

export enum ProductStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

export class CreateProductDto {
  @IsString()
  productCode: string;

  @IsString()
  productName: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  departmentId?: string;

  @IsEnum(ProductStatus)
  @IsOptional()
  status?: ProductStatus;
}

export class UpdateProductDto {
  @IsString()
  @IsOptional()
  productCode?: string;

  @IsString()
  @IsOptional()
  productName?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  departmentId?: string;

  @IsEnum(ProductStatus)
  @IsOptional()
  status?: ProductStatus;
}
