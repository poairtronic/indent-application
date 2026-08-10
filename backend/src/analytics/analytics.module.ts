/**
 * Analytics Module — Phase 15A: Analytics & Executive Intelligence
 *
 * Imports PrismaModule for database access.
 * No external module dependencies — fully self-contained.
 */

import { Module } from '@nestjs/common';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { KpiService } from './kpi.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [AnalyticsController],
  providers: [AnalyticsService, KpiService],
  exports: [AnalyticsService, KpiService],
})
export class AnalyticsModule {}
