import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';
import { UserStatus } from '@prisma/client';

export class UpdateUserStatusDto {
  @ApiProperty({ enum: UserStatus, example: UserStatus.ACTIVE, description: 'New User Status' })
  @IsEnum(UserStatus)
  @IsNotEmpty()
  status: UserStatus;
}
