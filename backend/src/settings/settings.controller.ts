import { Controller, Get, Patch, Param, Body, Query, Req } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { SettingsService } from './settings.service';
import { UpdateSettingDto } from './dto/update-setting.dto';
import { SettingResponseDto } from './dto/setting-response.dto';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { Request } from 'express';

@ApiTags('Settings')
@ApiBearerAuth()
@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all application settings' })
  @ApiQuery({ name: 'category', required: false, type: String })
  @ApiResponse({ status: 200, description: 'List of settings', type: [SettingResponseDto] })
  findAll(@Query('category') category?: string) {
    return this.settingsService.findAll(category);
  }

  @Get(':key')
  @ApiOperation({ summary: 'Get setting by key' })
  @ApiParam({ name: 'key', type: 'string' })
  @ApiResponse({ status: 200, description: 'Setting details', type: SettingResponseDto })
  @ApiResponse({ status: 404, description: 'Setting not found' })
  findByKey(@Param('key') key: string) {
    return this.settingsService.findByKey(key);
  }

  @Patch(':key')
  @Permissions('settings.manage')
  @ApiOperation({ summary: 'Update a setting' })
  @ApiParam({ name: 'key', type: 'string' })
  @ApiResponse({ status: 200, description: 'Setting updated', type: SettingResponseDto })
  update(
    @Param('key') key: string,
    @Body() updateSettingDto: UpdateSettingDto,
    @Req() req: Request,
  ) {
    return this.settingsService.update(key, updateSettingDto, req);
  }
}
