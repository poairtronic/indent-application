import { IsOptional, IsString, IsDateString, IsUUID } from 'class-validator';

export class KpiQueryDto {
  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @IsOptional()
  @IsDateString()
  dateTo?: string;

  @IsOptional()
  @IsUUID()
  departmentId?: string;

  @IsOptional()
  @IsUUID()
  productId?: string;

  @IsOptional()
  @IsUUID()
  vendorId?: string;

  @IsOptional()
  @IsString()
  processCode?: string;

  @IsOptional()
  @IsString()
  status?: string;
}
