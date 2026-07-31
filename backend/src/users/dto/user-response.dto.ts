import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserStatus } from '@prisma/client';

export class UserResponseDto {
  @ApiProperty({ example: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d' })
  id: string;

  @ApiProperty({ example: 'EMP-1001' })
  employeeCode: string;

  @ApiProperty({ example: 'John' })
  firstName: string;

  @ApiProperty({ example: 'Doe' })
  lastName: string;

  @ApiProperty({ example: 'john.doe@company.com' })
  email: string;

  @ApiPropertyOptional({ example: '+1234567890' })
  phone?: string | null;

  @ApiProperty({ example: 'f6e5d4c3-b2a1-0f9e-8d7c-6b5a4f3e2d1c' })
  departmentId: string;

  @ApiPropertyOptional({ example: 'Design Department' })
  departmentName?: string;

  @ApiProperty({ example: 'b2a10f9e-8d7c-6b5a-4f3e-2d1c0b9a8f7e' })
  roleId: string;

  @ApiPropertyOptional({ example: 'Design Engineer' })
  roleName?: string;

  @ApiProperty({ enum: UserStatus, example: UserStatus.ACTIVE })
  status: UserStatus;

  @ApiPropertyOptional({ example: 'https://cdn.example.com/avatar.jpg' })
  profileImage?: string | null;

  @ApiPropertyOptional({ example: '2026-07-31T12:00:00.000Z' })
  lastLogin?: Date | null;

  @ApiProperty({ example: '2026-07-01T00:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2026-07-31T00:00:00.000Z' })
  updatedAt: Date;
}
