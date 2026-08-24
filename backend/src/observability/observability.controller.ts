import {
  Controller,
  Get,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ObservabilityService, FrontendErrorInfo } from './observability.service';
import { Public } from '../common/decorators/public.decorator';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('System Observability & Monitoring')
@Controller('observability')
export class ObservabilityController {
  constructor(private readonly observabilityService: ObservabilityService) {}

  @Public()
  @Get('health/liveness')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Liveness health check probe' })
  @ApiResponse({ status: 200, description: 'Application container is executing' })
  getLiveness() {
    return {
      status: 'UP',
      timestamp: new Date().toISOString(),
    };
  }

  @Public()
  @Get('health/readiness')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Readiness health check probe' })
  @ApiResponse({ status: 200, description: 'All infrastructure dependencies are connected' })
  @ApiResponse({ status: 503, description: 'One or more system services are down' })
  async getReadiness() {
    const statuses = await this.observabilityService.getSystemStatuses();
    const isReady = Object.values(statuses).every((status) => status === 'UP');

    if (!isReady) {
      // Return 503 Service Unavailable, hiding specific database connection strings or credentials
      throw new ServiceUnavailableException({
        status: 'DOWN',
        services: {
          database: statuses.database,
          queue: statuses.queue,
        },
        timestamp: new Date().toISOString(),
      });
    }

    return {
      status: 'UP',
      services: {
        database: 'UP',
        queue: 'UP',
      },
      timestamp: new Date().toISOString(),
    };
  }

  @Public()
  @Post('frontend-errors')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Log client-side unhandled exception telemetry' })
  @ApiResponse({ status: 201, description: 'Error recorded successfully' })
  recordFrontendError(@Body() errorDto: FrontendErrorInfo) {
    // Basic sanitization
    const type = String(errorDto.type || 'UNKNOWN').substring(0, 50);
    const message = String(errorDto.message || '').substring(0, 1000);
    const stack = String(errorDto.stack || '').substring(0, 10000);
    const url = String(errorDto.url || '').substring(0, 2048);

    this.observabilityService.recordFrontendError({
      type,
      message,
      stack,
      url,
      timestamp: new Date().toISOString(),
    });

    return { success: true };
  }

  @ApiBearerAuth()
  @Get('metrics')
  @Permissions('settings.manage')
  @ApiOperation({ summary: 'Get operational system metrics dashboard data' })
  @ApiResponse({ status: 200, description: 'Aggregated metrics compiled successfully' })
  @ApiResponse({ status: 403, description: 'Unauthorized access' })
  getMetrics() {
    return {
      success: true,
      data: this.observabilityService.getMetrics(),
    };
  }
}
