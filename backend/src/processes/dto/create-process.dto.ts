import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { ProcessStatus } from '@prisma/client';
import {
  PROCESS_DESCRIPTION_MAX_LENGTH,
  PROCESS_NAME_MAX_LENGTH,
} from '../constants/process.constants';

export class CreateProcessDto {
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

  @ApiPropertyOptional({
    enum: ProcessStatus,
    default: ProcessStatus.ACTIVE,
    description: 'Process status',
  })
  @IsOptional()
  @IsEnum(ProcessStatus)
  status?: ProcessStatus;
}
