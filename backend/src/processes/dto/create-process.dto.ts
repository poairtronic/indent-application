import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { ProcessStatus } from '@prisma/client';
import {
  PROCESS_CODE_MAX_LENGTH,
  PROCESS_DESCRIPTION_MAX_LENGTH,
  PROCESS_ESTIMATED_HOURS_DECIMALS,
  PROCESS_ESTIMATED_HOURS_MAX,
  PROCESS_NAME_MAX_LENGTH,
  PROCESS_SEQUENCE_MIN,
} from '../constants/process.constants';

export class CreateProcessDto {
  @ApiProperty({
    example: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
    description: 'Product UUID the manufacturing process belongs to',
  })
  @IsUUID('4')
  @IsNotEmpty()
  productId: string;

  @ApiProperty({ example: 'MLG-001', description: 'Process code, unique within the product' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(PROCESS_CODE_MAX_LENGTH)
  processCode: string;

  @ApiProperty({ example: 'Milling', description: 'Manufacturing process name' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(PROCESS_NAME_MAX_LENGTH)
  processName: string;

  @ApiPropertyOptional({
    example: 'CNC milling of body housing',
    description: 'Process description',
  })
  @IsOptional()
  @IsString()
  @MaxLength(PROCESS_DESCRIPTION_MAX_LENGTH)
  description?: string;

  @ApiProperty({ example: 1, description: 'Execution sequence order within the product' })
  @Type(() => Number)
  @IsInt()
  @Min(PROCESS_SEQUENCE_MIN)
  sequence: number;

  @ApiPropertyOptional({ example: 4.5, description: 'Estimated hours for the process' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: PROCESS_ESTIMATED_HOURS_DECIMALS })
  @Max(PROCESS_ESTIMATED_HOURS_MAX)
  estimatedHours?: number;

  @ApiPropertyOptional({
    enum: ProcessStatus,
    default: ProcessStatus.ACTIVE,
    description: 'Process status',
  })
  @IsOptional()
  @IsEnum(ProcessStatus)
  status?: ProcessStatus;
}
