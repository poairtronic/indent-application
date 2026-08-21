import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { ProcessStatus } from '@prisma/client';

export class ProcessQueryDto {
  @ApiPropertyOptional({ example: 1, default: 1, description: 'Page number' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ example: 10, default: 10, description: 'Items per page' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 10;

  @ApiPropertyOptional({ example: 'Mill', description: 'Search query for process name' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: ProcessStatus, description: 'Filter by Process Status' })
  @IsOptional()
  @IsEnum(ProcessStatus)
  status?: ProcessStatus;
}

