import { Module, Global } from '@nestjs/common';
import { ObservabilityService } from './observability.service';
import { ObservabilityController } from './observability.controller';
import { AppLogger } from './app-logger.service';
import { CorrelationIdMiddleware } from './correlation-id.middleware';
import { ApiMonitoringMiddleware } from './api-monitoring.middleware';

@Global()
@Module({
  controllers: [ObservabilityController],
  providers: [ObservabilityService, AppLogger, CorrelationIdMiddleware, ApiMonitoringMiddleware],
  exports: [ObservabilityService, AppLogger],
})
export class ObservabilityModule {}
