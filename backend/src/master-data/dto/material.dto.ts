import { IsString, IsOptional, IsNumber, IsEnum, IsUUID } from 'class-validator';

export enum MaterialStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

export class CreateMaterialDto {
  @IsString()
  materialCode: string;

  @IsString()
  materialName: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsUUID()
  unitId: string;

  @IsString()
  @IsOptional()
  category?: string;

  @IsNumber()
  @IsOptional()
  minStock?: number;

  @IsNumber()
  @IsOptional()
  maxStock?: number;

  @IsEnum(MaterialStatus)
  @IsOptional()
  status?: MaterialStatus;
}

export class UpdateMaterialDto {
  @IsString()
  @IsOptional()
  materialCode?: string;

  @IsString()
  @IsOptional()
  materialName?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsUUID()
  @IsOptional()
  unitId?: string;

  @IsString()
  @IsOptional()
  category?: string;

  @IsNumber()
  @IsOptional()
  minStock?: number;

  @IsNumber()
  @IsOptional()
  maxStock?: number;

  @IsEnum(MaterialStatus)
  @IsOptional()
  status?: MaterialStatus;
}
