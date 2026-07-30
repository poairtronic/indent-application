import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';

export class RefreshTokenDto {
  @ApiProperty({ example: 'refresh_token_string_here', description: 'Refresh token' })
  @IsNotEmpty({ message: 'Refresh token is required' })
  refreshToken!: string;
}
