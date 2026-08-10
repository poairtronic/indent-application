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
import { Permissions } from '../auth/decorators/permissions.decorator';
import { Cache } from '../redis-cache/decorators/cache.decorator';

@ApiTags('Permissions')
@ApiBearerAuth()
@Controller('permissions')
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

  @Post()
  @Permissions('permissions.create')
  @ApiOperation({ summary: 'Create a new permission' })
  @ApiResponse({ status: 201, description: 'Permission created', type: PermissionResponseDto })
  @ApiResponse({ status: 409, description: 'Permission already exists' })
  create(@Body() dto: CreatePermissionDto) {
    return this.permissionsService.create(dto);
  }

  @Get()
  @Permissions('permissions.view')
  @Cache('master:permissions', 3600)
  @ApiOperation({ summary: 'Get all permissions, optionally filtered by module' })
  @ApiQuery({ name: 'module', required: false, type: 'string' })
  @ApiResponse({ status: 200, description: 'List of permissions', type: [PermissionResponseDto] })
  findAll(@Query('module') module?: string) {
    return this.permissionsService.findAll(module);
  }

  @Get('modules')
  @Permissions('permissions.view')
  @Cache('master:permissions:modules', 3600)
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
  @Permissions('permissions.update')
  @ApiOperation({ summary: 'Update permission' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Permission updated', type: PermissionResponseDto })
  @ApiResponse({ status: 404, description: 'Permission not found' })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdatePermissionDto) {
    return this.permissionsService.update(id, dto);
  }

  @Delete(':id')
  @Permissions('permissions.delete')
  @ApiOperation({ summary: 'Soft delete a permission' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Permission deleted' })
  @ApiResponse({ status: 404, description: 'Permission not found' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.permissionsService.remove(id);
  }
}
