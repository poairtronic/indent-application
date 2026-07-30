import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RoleResponseDto {
  @ApiProperty({ example: 'uuid' })
  id: string;

  @ApiProperty({ example: 'Design Engineer' })
  roleName: string;

  @ApiPropertyOptional({ example: 'Creates and manages indents' })
  description?: string;

  @ApiProperty({ example: false })
  isSystem: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiPropertyOptional({ type: [Object] })
  permissions?: any[];

  @ApiPropertyOptional({ example: 5 })
  userCount?: number;
}
