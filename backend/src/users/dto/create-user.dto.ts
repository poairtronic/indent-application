import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MinLength,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserStatus } from '@prisma/client';

export class CreateUserDto {
  @ApiProperty({ example: 'EMP-1001', description: 'Unique Employee Code' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  employeeCode: string;

  @ApiProperty({ example: 'John', description: 'First Name' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  firstName: string;

  @ApiProperty({ example: 'Doe', description: 'Last Name' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  lastName: string;

  @ApiProperty({ example: 'john.doe@company.com', description: 'Unique Work Email Address' })
  @IsEmail()
  @IsNotEmpty()
  @MaxLength(150)
  email: string;

  @ApiPropertyOptional({ example: '+1234567890', description: 'Contact Phone Number' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;

  @ApiProperty({ example: 'SecurePassword123!', description: 'User Password' })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  @MaxLength(100)
  password: string;

  @ApiProperty({
    example: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
    description: 'Assigned Department UUID',
  })
  @IsUUID('4')
  @IsNotEmpty()
  departmentId: string;

  @ApiProperty({
    example: 'f6e5d4c3-b2a1-0f9e-8d7c-6b5a4f3e2d1c',
    description: 'Assigned Role UUID',
  })
  @IsUUID('4')
  @IsNotEmpty()
  roleId: string;

  @ApiPropertyOptional({
    enum: UserStatus,
    default: UserStatus.ACTIVE,
    description: 'Initial User Status',
  })
  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;

  @ApiPropertyOptional({
    example: 'https://cdn.example.com/avatar.jpg',
    description: 'Profile Image URL',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  profileImage?: string;
}
