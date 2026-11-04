import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiHeader, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Public } from '../common/decorators/public.decorator';
import { InternalSecretGuard } from '../common/guards/internal-secret.guard';
import { InternalService } from './internal.service';
import { RmIntegrationService } from './rm-integration.service';
import { ItemIssuedDto } from './dto/item-issued.dto';

/**
 * Controller for Machine-to-Machine (M2M) communication between RM and MERC.
 * Protected by InternalSecretGuard per route without global JWT / user session requirements.
 */
@ApiTags('Internal')
@Public()
@Controller(['internal', 'api/internal'])
export class InternalController {
  constructor(
    private readonly internalService: InternalService,
    private readonly rmIntegrationService: RmIntegrationService,
  ) {}

  @Get('health')
  @UseGuards(InternalSecretGuard)
  @ApiOperation({ summary: 'Internal M2M health check and bridge authentication verification' })
  @ApiHeader({
    name: 'x-internal-secret',
    description: 'Shared secret for M2M communication',
    required: true,
  })
  @ApiResponse({ status: 200, description: 'Internal API bridge is reachable and secret is valid' })
  @ApiResponse({ status: 401, description: 'Missing or invalid x-internal-secret header' })
  @ApiResponse({ status: 500, description: 'MERC_INTERNAL_SECRET is not configured' })
  getHealth() {
    return {
      status: 'ok',
      service: 'merc-internal-api',
      timestamp: new Date().toISOString(),
    };
  }

  @Post('rm/item-issued')
  @UseGuards(InternalSecretGuard)
  @ApiOperation({ summary: 'Callback from RM when a line item is issued' })
  @ApiHeader({
    name: 'x-internal-secret',
    description: 'Shared secret for M2M communication',
    required: true,
  })
  @ApiResponse({ status: 200, description: 'Line item issuance recorded successfully' })
  @ApiResponse({ status: 401, description: 'Missing or invalid x-internal-secret header' })
  @ApiResponse({ status: 404, description: 'Indent not found' })
  async handleItemIssued(@Body() dto: ItemIssuedDto) {
    return this.internalService.handleItemIssued(dto);
  }

  @Post('rm/retry-outbox')
  @UseGuards(InternalSecretGuard)
  @ApiOperation({ summary: 'Manually retry failed RM webhook outbox entries' })
  @ApiHeader({
    name: 'x-internal-secret',
    description: 'Shared secret for M2M communication',
    required: true,
  })
  @ApiResponse({ status: 200, description: 'Retry initiated successfully' })
  @ApiResponse({ status: 401, description: 'Missing or invalid x-internal-secret header' })
  async retryOutbox() {
    await this.rmIntegrationService.retryFailedOutbox();
    return { triggered: true, timestamp: new Date() };
  }

  @Get('rm/outbox-status')
  @UseGuards(InternalSecretGuard)
  @ApiOperation({ summary: 'Get status of latest RM webhook outbox entries' })
  @ApiHeader({
    name: 'x-internal-secret',
    description: 'Shared secret for M2M communication',
    required: true,
  })
  @ApiResponse({ status: 200, description: 'Outbox entries retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Missing or invalid x-internal-secret header' })
  async getOutboxStatus() {
    return this.rmIntegrationService.getOutboxStatus(50);
  }
}
