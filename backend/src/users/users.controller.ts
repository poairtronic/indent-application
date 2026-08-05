import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserQueryDto } from './dto/user-query.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { UpdateUserStatusDto } from './dto/update-user-status.dto';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @Permissions('users.create')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new user account' })
  @ApiResponse({ status: 210, description: 'User successfully created.', type: UserResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid input or department/role missing.' })
  @ApiResponse({ status: 409, description: 'User with email or employee code already exists.' })
  async createUser(@Body() dto: CreateUserDto, @CurrentUser() user: any): Promise<UserResponseDto> {
    return this.usersService.createUser(dto, user?.id);
  }

  @Get()
  @Permissions('users.view')
  @ApiOperation({ summary: 'Retrieve paginated users list with filters and search' })
  @ApiResponse({ status: 200, description: 'Paginated user records list.' })
  async findAllUsers(@Query() query: UserQueryDto) {
    return this.usersService.findAllUsers(query);
  }

  @Get('profile')
  @ApiOperation({ summary: 'Retrieve authenticated user profile details' })
  @ApiResponse({ status: 200, description: 'User profile details.', type: UserResponseDto })
  async getProfile(@CurrentUser() user: any): Promise<UserResponseDto> {
    return this.usersService.getUserProfile(user.id);
  }

  @Get(':id')
  @Permissions('users.view')
  @ApiOperation({ summary: 'Retrieve user details by User UUID' })
  @ApiParam({ name: 'id', description: 'User UUID v4' })
  @ApiResponse({ status: 200, description: 'User record found.', type: UserResponseDto })
  @ApiResponse({ status: 404, description: 'User not found.' })
  async findUserById(@Param('id', ParseUUIDPipe) id: string): Promise<UserResponseDto> {
    return this.usersService.findUserById(id);
  }

  @Patch(':id')
  @Permissions('users.update')
  @ApiOperation({ summary: 'Update user profile details' })
  @ApiParam({ name: 'id', description: 'User UUID v4' })
  @ApiResponse({ status: 200, description: 'User details updated.', type: UserResponseDto })
  @ApiResponse({ status: 404, description: 'User not found.' })
  async updateUser(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateUserDto,
    @CurrentUser() user: any,
  ): Promise<UserResponseDto> {
    return this.usersService.updateUser(id, dto, user?.id);
  }

  @Patch(':id/status')
  @Permissions('users.update')
  @ApiOperation({ summary: 'Update user active/inactive/suspended status' })
  @ApiParam({ name: 'id', description: 'User UUID v4' })
  @ApiResponse({ status: 200, description: 'User status updated.', type: UserResponseDto })
  @ApiResponse({ status: 404, description: 'User not found.' })
  async updateUserStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateUserStatusDto,
    @CurrentUser() user: any,
  ): Promise<UserResponseDto> {
    return this.usersService.updateUserStatus(id, dto, user?.id);
  }

  @Delete(':id')
  @Permissions('users.delete')
  @ApiOperation({ summary: 'Soft delete a user record' })
  @ApiParam({ name: 'id', description: 'User UUID v4' })
  @ApiResponse({ status: 200, description: 'User soft-deleted successfully.' })
  @ApiResponse({ status: 404, description: 'User not found.' })
  async softDeleteUser(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: any,
  ): Promise<{ message: string }> {
    return this.usersService.softDeleteUser(id, user?.id);
  }

  @Patch(':id/restore')
  @Permissions('users.update')
  @ApiOperation({ summary: 'Restore a soft-deleted user account' })
  @ApiParam({ name: 'id', description: 'User UUID v4' })
  @ApiResponse({ status: 200, description: 'User account restored.', type: UserResponseDto })
  @ApiResponse({ status: 404, description: 'Soft-deleted user record not found.' })
  async restoreUser(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: any,
  ): Promise<UserResponseDto> {
    return this.usersService.restoreUser(id, user?.id);
  }
}
