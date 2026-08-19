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
import { ProcessesService } from './processes.service';
import { CreateProcessDto } from './dto/create-process.dto';
import { UpdateProcessDto } from './dto/update-process.dto';
import { ProcessQueryDto } from './dto/process-query.dto';
import { ProcessResponseDto } from './dto/process-response.dto';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Cache } from '../redis-cache/decorators/cache.decorator';
import { RedisCacheService } from '../redis-cache/redis-cache.service';

@ApiTags('Manufacturing Processes')
@ApiBearerAuth()
@Controller('manufacturing-processes')
export class ProcessesController {
  constructor(
    private readonly processesService: ProcessesService,
    private readonly cacheService: RedisCacheService,
  ) {}

  @Post()
  @Permissions('manufacturing-processes.create')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a manufacturing process' })
  @ApiResponse({
    status: 201,
    description: 'Manufacturing process created.',
    type: ProcessResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid product or process data.' })
  @ApiResponse({ status: 409, description: 'Process code or sequence conflict.' })
  async createProcess(
    @Body() dto: CreateProcessDto,
    @CurrentUser() user: any,
  ): Promise<ProcessResponseDto> {
    const process = await this.processesService.createProcess(dto, user?.id);
    await this.cacheService.invalidateByPattern('master:processes:*');
    return process;
  }

  @Get()
  @Permissions('manufacturing-processes.view')
  @Cache('master:processes', 3600)
  @ApiOperation({ summary: 'Retrieve paginated manufacturing processes with filters and search' })
  @ApiResponse({ status: 200, description: 'Paginated manufacturing processes list.' })
  async findAllProcesses(@Query() query: ProcessQueryDto) {
    return this.processesService.findAllProcesses(query);
  }

  @Get(':id')
  @Permissions('manufacturing-processes.view')
  @ApiOperation({ summary: 'Retrieve manufacturing process details by UUID' })
  @ApiParam({ name: 'id', description: 'Manufacturing process UUID v4' })
  @ApiResponse({
    status: 200,
    description: 'Manufacturing process record found.',
    type: ProcessResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Manufacturing process not found.' })
  async findProcessById(@Param('id', ParseUUIDPipe) id: string): Promise<ProcessResponseDto> {
    return this.processesService.findProcessById(id);
  }

  @Patch(':id')
  @Permissions('manufacturing-processes.update')
  @ApiOperation({ summary: 'Update manufacturing process details' })
  @ApiParam({ name: 'id', description: 'Manufacturing process UUID v4' })
  @ApiResponse({
    status: 200,
    description: 'Manufacturing process updated.',
    type: ProcessResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Manufacturing process not found.' })
  @ApiResponse({ status: 409, description: 'Process code or sequence conflict.' })
  async updateProcess(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateProcessDto,
    @CurrentUser() user: any,
  ): Promise<ProcessResponseDto> {
    const process = await this.processesService.updateProcess(id, dto, user?.id);
    await this.cacheService.invalidateByPattern('master:processes:*');
    return process;
  }

  @Delete(':id')
  @Permissions('manufacturing-processes.delete')
  @ApiOperation({ summary: 'Soft delete a manufacturing process' })
  @ApiParam({ name: 'id', description: 'Manufacturing process UUID v4' })
  @ApiResponse({ status: 200, description: 'Manufacturing process soft-deleted.' })
  @ApiResponse({ status: 404, description: 'Manufacturing process not found.' })
  @ApiResponse({ status: 400, description: 'Manufacturing process is referenced by transactions.' })
  async softDeleteProcess(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: any,
  ): Promise<{ message: string }> {
    const result = await this.processesService.softDeleteProcess(id, user?.id);
    await this.cacheService.invalidateByPattern('master:processes:*');
    return result;
  }

  @Patch(':id/restore')
  @Permissions('manufacturing-processes.restore')
  @ApiOperation({ summary: 'Restore a soft-deleted manufacturing process' })
  @ApiParam({ name: 'id', description: 'Manufacturing process UUID v4' })
  @ApiResponse({
    status: 200,
    description: 'Manufacturing process restored.',
    type: ProcessResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Soft-deleted manufacturing process not found.' })
  async restoreProcess(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: any,
  ): Promise<ProcessResponseDto> {
    const process = await this.processesService.restoreProcess(id, user?.id);
    await this.cacheService.invalidateByPattern('master:processes:*');
    return process;
  }
}
