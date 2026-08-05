import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { RolesService } from './roles.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { RoleResponseDto } from './dto/role-response.dto';
import { Permissions } from '../auth/decorators/permissions.decorator';

@ApiTags('Roles')
@ApiBearerAuth()
@Controller('roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Post()
  @Permissions('roles.create')
  @ApiOperation({ summary: 'Create a new role' })
  @ApiResponse({ status: 201, description: 'Role created', type: RoleResponseDto })
  @ApiResponse({ status: 409, description: 'Role already exists' })
  create(@Body() dto: CreateRoleDto) {
    return this.rolesService.create(dto);
  }

  @Get()
  @Permissions('roles.view')
  @ApiOperation({ summary: 'Get all roles' })
  @ApiResponse({ status: 200, description: 'List of roles', type: [RoleResponseDto] })
  findAll() {
    return this.rolesService.findAll();
  }

  @Get(':id')
  @Permissions('roles.view')
  @ApiOperation({ summary: 'Get role by ID' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Role details', type: RoleResponseDto })
  @ApiResponse({ status: 404, description: 'Role not found' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.rolesService.findOne(id);
  }

  @Put(':id')
  @Permissions('roles.update')
  @ApiOperation({ summary: 'Update role' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Role updated', type: RoleResponseDto })
  @ApiResponse({ status: 404, description: 'Role not found' })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateRoleDto) {
    return this.rolesService.update(id, dto);
  }

  @Delete(':id')
  @Permissions('roles.delete')
  @ApiOperation({ summary: 'Soft delete a role' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Role deleted' })
  @ApiResponse({ status: 404, description: 'Role not found' })
  @ApiResponse({ status: 409, description: 'System roles cannot be deleted' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.rolesService.remove(id);
  }

  @Get(':id/permissions')
  @Permissions('roles.view')
  @ApiOperation({ summary: 'Get permissions assigned to a role' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'List of permissions' })
  getPermissions(@Param('id', ParseUUIDPipe) id: string) {
    return this.rolesService.getPermissions(id);
  }

  @Put(':id/permissions')
  @Permissions('roles.update')
  @ApiOperation({ summary: 'Assign permissions to a role' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Permissions assigned', type: RoleResponseDto })
  assignPermissions(@Param('id', ParseUUIDPipe) id: string, @Body() permissionIds: string[]) {
    return this.rolesService.assignPermissions(id, permissionIds);
  }
}
