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
import { VendorsService } from './vendors.service';
import { CreateVendorDto } from './dto/create-vendor.dto';
import { UpdateVendorDto } from './dto/update-vendor.dto';
import { VendorQueryDto } from './dto/vendor-query.dto';
import { VendorResponseDto } from './dto/vendor-response.dto';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Cache } from '../redis-cache/decorators/cache.decorator';

@ApiTags('Vendors')
@ApiBearerAuth()
@Controller('vendors')
export class VendorsController {
  constructor(private readonly vendorsService: VendorsService) {}

  @Post()
  @Permissions('vendors.create')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a vendor' })
  @ApiResponse({ status: 201, description: 'Vendor created.', type: VendorResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid vendor data or GST/PAN format.' })
  @ApiResponse({ status: 409, description: 'Vendor code, email, GST or PAN already exists.' })
  async createVendor(
    @Body() dto: CreateVendorDto,
    @CurrentUser() user: any,
  ): Promise<VendorResponseDto> {
    return this.vendorsService.createVendor(dto, user?.id);
  }

  @Get()
  @Permissions('vendors.view')
  @Cache('master:vendors', 3600)
  @ApiOperation({ summary: 'Retrieve paginated vendors with filters and search' })
  @ApiResponse({ status: 200, description: 'Paginated vendors list.' })
  async findAllVendors(@Query() query: VendorQueryDto) {
    return this.vendorsService.findAllVendors(query);
  }

  @Get(':id')
  @Permissions('vendors.view')
  @ApiOperation({ summary: 'Retrieve vendor details by UUID' })
  @ApiParam({ name: 'id', description: 'Vendor UUID v4' })
  @ApiResponse({ status: 200, description: 'Vendor record found.', type: VendorResponseDto })
  @ApiResponse({ status: 404, description: 'Vendor not found.' })
  async findVendorById(@Param('id', ParseUUIDPipe) id: string): Promise<VendorResponseDto> {
    return this.vendorsService.findVendorById(id);
  }

  @Patch(':id')
  @Permissions('vendors.update')
  @ApiOperation({ summary: 'Update vendor details' })
  @ApiParam({ name: 'id', description: 'Vendor UUID v4' })
  @ApiResponse({ status: 200, description: 'Vendor updated.', type: VendorResponseDto })
  @ApiResponse({ status: 404, description: 'Vendor not found.' })
  @ApiResponse({ status: 409, description: 'Vendor code, email, GST or PAN already exists.' })
  async updateVendor(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateVendorDto,
    @CurrentUser() user: any,
  ): Promise<VendorResponseDto> {
    return this.vendorsService.updateVendor(id, dto, user?.id);
  }

  @Delete(':id')
  @Permissions('vendors.delete')
  @ApiOperation({ summary: 'Soft delete a vendor' })
  @ApiParam({ name: 'id', description: 'Vendor UUID v4' })
  @ApiResponse({ status: 200, description: 'Vendor soft-deleted.' })
  @ApiResponse({ status: 404, description: 'Vendor not found.' })
  @ApiResponse({ status: 400, description: 'Vendor is referenced by materials or cost items.' })
  async softDeleteVendor(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: any,
  ): Promise<{ message: string }> {
    return this.vendorsService.softDeleteVendor(id, user?.id);
  }

  @Patch(':id/restore')
  @Permissions('vendors.restore')
  @ApiOperation({ summary: 'Restore a soft-deleted vendor' })
  @ApiParam({ name: 'id', description: 'Vendor UUID v4' })
  @ApiResponse({ status: 200, description: 'Vendor restored.', type: VendorResponseDto })
  @ApiResponse({ status: 404, description: 'Soft-deleted vendor not found.' })
  async restoreVendor(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: any,
  ): Promise<VendorResponseDto> {
    return this.vendorsService.restoreVendor(id, user?.id);
  }
}
