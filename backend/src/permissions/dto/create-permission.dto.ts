import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, MaxLength, IsEnum } from 'class-validator';
import { PermissionAction } from '@prisma/client';

export class CreatePermissionDto {
  @ApiProperty({ description: 'Module name', example: 'users' })
  @IsString()
  @MaxLength(100)
  module: string;

  @ApiProperty({ enum: PermissionAction, description: 'Permission action', example: 'CREATE' })
  @IsEnum(PermissionAction)
  action: PermissionAction;

  @ApiProperty({ description: 'Unique permission code', example: 'users.create' })
  @IsString()
  @MaxLength(150)
  code: string;

  @ApiPropertyOptional({ description: 'Permission description', example: 'Create new users' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  description?: string;
}
