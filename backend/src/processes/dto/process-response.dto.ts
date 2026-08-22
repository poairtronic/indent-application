import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ProcessStatus } from '@prisma/client';

export class ProcessResponseDto {
  @ApiProperty({ example: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d' })
  id: string;

  @ApiProperty({ example: 'Milling' })
  processName: string;

  @ApiPropertyOptional({ example: 'CNC milling of body housing' })
  description?: string | null;

  @ApiProperty({ enum: ProcessStatus, example: ProcessStatus.ACTIVE })
  status: ProcessStatus;

  @ApiProperty({ example: '2026-07-01T00:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2026-07-31T00:00:00.000Z' })
  updatedAt: Date;
}
