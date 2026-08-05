import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  Delete,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { UnitsService } from './units.service';
import { CreateUnitDto } from './dto/create-unit.dto';
import { UpdateUnitDto } from './dto/update-unit.dto';
import { UnitQueryDto } from './dto/unit-query.dto';
import { UnitResponseDto } from './dto/unit-response.dto';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Units')
@ApiBearerAuth()
@Controller('units')
export class UnitsController {
  constructor(private readonly unitsService: UnitsService) {}

  @Post()
  @Permissions('units.create')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a unit of measure' })
  @ApiResponse({ status: 201, description: 'Unit created.', type: UnitResponseDto })
  @ApiResponse({ status: 409, description: 'Unit with this code already exists.' })
  async createUnit(@Body() dto: CreateUnitDto, @CurrentUser() user: any): Promise<UnitResponseDto> {
    return this.unitsService.createUnit(dto, user?.id);
  }

  @Get()
  @Permissions('units.view')
  @ApiOperation({ summary: 'Retrieve paginated units with search' })
  @ApiResponse({ status: 200, description: 'Paginated units list.' })
  async findAllUnits(@Query() query: UnitQueryDto) {
    return this.unitsService.findAllUnits(query);
  }

  @Get(':id')
  @Permissions('units.view')
  @ApiOperation({ summary: 'Retrieve unit details by UUID' })
  @ApiParam({ name: 'id', description: 'Unit UUID v4' })
  @ApiResponse({ status: 200, description: 'Unit record found.', type: UnitResponseDto })
  @ApiResponse({ status: 404, description: 'Unit not found.' })
  async findUnitById(@Param('id', ParseUUIDPipe) id: string): Promise<UnitResponseDto> {
    return this.unitsService.findUnitById(id);
  }

  @Patch(':id')
  @Permissions('units.update')
  @ApiOperation({ summary: 'Update unit details' })
  @ApiParam({ name: 'id', description: 'Unit UUID v4' })
  @ApiResponse({ status: 200, description: 'Unit updated.', type: UnitResponseDto })
  @ApiResponse({ status: 404, description: 'Unit not found.' })
  @ApiResponse({ status: 409, description: 'Unit with this code already exists.' })
  async updateUnit(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateUnitDto,
    @CurrentUser() user: any,
  ): Promise<UnitResponseDto> {
    return this.unitsService.updateUnit(id, dto, user?.id);
  }

  @Delete(':id')
  @Permissions('units.delete')
  @ApiOperation({ summary: 'Soft delete a unit' })
  @ApiParam({ name: 'id', description: 'Unit UUID v4' })
  @ApiResponse({ status: 200, description: 'Unit soft-deleted.' })
  @ApiResponse({ status: 404, description: 'Unit not found.' })
  @ApiResponse({ status: 400, description: 'Unit is referenced by materials or transactions.' })
  async softDeleteUnit(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: any,
  ): Promise<{ message: string }> {
    return this.unitsService.softDeleteUnit(id, user?.id);
  }

  @Patch(':id/restore')
  @Permissions('units.restore')
  @ApiOperation({ summary: 'Restore a soft-deleted unit' })
  @ApiParam({ name: 'id', description: 'Unit UUID v4' })
  @ApiResponse({ status: 200, description: 'Unit restored.', type: UnitResponseDto })
  @ApiResponse({ status: 404, description: 'Soft-deleted unit not found.' })
  async restoreUnit(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: any,
  ): Promise<UnitResponseDto> {
    return this.unitsService.restoreUnit(id, user?.id);
  }
}
