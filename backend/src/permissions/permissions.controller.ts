import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { PermissionsService } from './permissions.service';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { UpdatePermissionDto } from './dto/update-permission.dto';
import { PermissionResponseDto } from './dto/permission-response.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';

@ApiTags('Permissions')
@ApiBearerAuth()
@Controller('permissions')
@UseGuards(RolesGuard, PermissionsGuard)
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

  @Post()
  @Roles('ADMIN')
  @Permissions('permissions.create')
  @ApiOperation({ summary: 'Create a new permission' })
  @ApiResponse({ status: 201, description: 'Permission created', type: PermissionResponseDto })
  @ApiResponse({ status: 409, description: 'Permission already exists' })
  create(@Body() dto: CreatePermissionDto) {
    return this.permissionsService.create(dto);
  }

  @Get()
  @Permissions('permissions.view')
  @ApiOperation({ summary: 'Get all permissions, optionally filtered by module' })
  @ApiQuery({ name: 'module', required: false, type: 'string' })
  @ApiResponse({ status: 200, description: 'List of permissions', type: [PermissionResponseDto] })
  findAll(@Query('module') module?: string) {
    return this.permissionsService.findAll(module);
  }

  @Get('modules')
  @Permissions('permissions.view')
  @ApiOperation({ summary: 'Get all distinct permission modules' })
  @ApiResponse({ status: 200, description: 'List of modules' })
  getModules() {
    return this.permissionsService.getModules();
  }

  @Get(':id')
  @Permissions('permissions.view')
  @ApiOperation({ summary: 'Get permission by ID' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Permission details', type: PermissionResponseDto })
  @ApiResponse({ status: 404, description: 'Permission not found' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.permissionsService.findOne(id);
  }

  @Put(':id')
  @Roles('ADMIN')
  @Permissions('permissions.update')
  @ApiOperation({ summary: 'Update permission' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Permission updated', type: PermissionResponseDto })
  @ApiResponse({ status: 404, description: 'Permission not found' })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdatePermissionDto) {
    return this.permissionsService.update(id, dto);
  }

  @Delete(':id')
  @Roles('ADMIN')
  @Permissions('permissions.delete')
  @ApiOperation({ summary: 'Soft delete a permission' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Permission deleted' })
  @ApiResponse({ status: 404, description: 'Permission not found' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.permissionsService.remove(id);
  }
}
