import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import {
  UNIT_CODE_MAX_LENGTH,
  UNIT_NAME_MAX_LENGTH,
  UNIT_SYMBOL_MAX_LENGTH,
} from '../constants/unit.constants';

export class CreateUnitDto {
  @ApiProperty({ example: 'KG', description: 'Unique unit code' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(UNIT_CODE_MAX_LENGTH)
  unitCode: string;

  @ApiProperty({ example: 'Kilogram', description: 'Unit name' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(UNIT_NAME_MAX_LENGTH)
  unitName: string;

  @ApiProperty({ example: 'kg', description: 'Unit symbol' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(UNIT_SYMBOL_MAX_LENGTH)
  symbol: string;
}
