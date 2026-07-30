import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PermissionAction } from '@prisma/client';

export class PermissionResponseDto {
  @ApiProperty({ example: 'uuid' })
  id: string;

  @ApiProperty({ example: 'users' })
  module: string;

  @ApiProperty({ enum: PermissionAction, example: 'CREATE' })
  action: PermissionAction;

  @ApiProperty({ example: 'users.create' })
  code: string;

  @ApiPropertyOptional({ example: 'Create new users' })
  description?: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
