/**
 * Analytics Controller — Phase 15A: Analytics & Executive Intelligence
 *
 * Thin controller. All business logic lives in AnalyticsService.
 * RBAC: analytics.view permission required on every endpoint.
 */

import { Controller, Get, Query, Request } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { AnalyticsService } from './analytics.service';
import { KpiService } from './kpi.service';
import { KpiQueryDto } from './dto/kpi-query.dto';
import {
  CostAnalyticsQueryDto,
  ProductAnalyticsQueryDto,
  VendorAnalyticsQueryDto,
} from './dto/analytics-query.dto';
import { Cache } from '../redis-cache/decorators/cache.decorator';

@Controller('analytics')
@Throttle({ default: { limit: 50, ttl: 60000 } })
export class AnalyticsController {
  constructor(
    private readonly analyticsService: AnalyticsService,
    private readonly kpiService: KpiService,
  ) {}

  /**
   * GET /analytics/kpis
   * Returns list of aggregated KPIs matching the global query filters and user RBAC.
   */
  @Get('kpis')
  @Permissions('analytics.view')
  @Cache('analytics:kpis', 60)
  async getKpis(@Request() req: any, @Query() query: KpiQueryDto) {
    return this.kpiService.getKpis(req.user, query);
  }

  /**
   * GET /analytics/insights
   * Returns dynamically generated deterministic insights scoped by RBAC and filters.
   */
  @Get('insights')
  @Permissions('analytics.view')
  @Cache('analytics:insights', 60)
  async getInsights(@Request() req: any, @Query() query: KpiQueryDto) {
    return this.analyticsService.getInsights(req.user, query);
  }

  /**
   * GET /analytics/summary
   * Executive Summary — total, active, completed, archived, pending counts.
   * Audience: Senior Manager, General Manager, Admin, Design Engineer.
   */
  @Get('summary')
  @Permissions('analytics.view')
  @Cache('analytics:summary', 60)
  async getExecutiveSummary() {
    return this.analyticsService.getExecutiveSummary();
  }

  /**
   * GET /analytics/workflow
   * Workflow Analytics — stage distribution, bottleneck, completion rate, cycle time.
   * Audience: Senior Manager, General Manager.
   */
  @Get('workflow')
  @Permissions('analytics.view')
  @Cache('analytics:workflow', 60)
  async getWorkflowAnalytics() {
    return this.analyticsService.getWorkflowAnalytics();
  }

  /**
   * GET /analytics/departments
   * Department Analytics — workload, pending queue, completed count per dept.
   * Audience: Senior Manager, General Manager.
   */
  @Get('departments')
  @Permissions('analytics.view')
  @Cache('analytics:departments', 60)
  async getDepartmentAnalytics() {
    return this.analyticsService.getDepartmentAnalytics();
  }

  /**
   * GET /analytics/costs
   * Cost Analytics — planned vs actual, variance, sheet status.
   * Optional query: ?from=2025-01-01&to=2025-12-31
   * Audience: Senior Manager, General Manager, Accounts.
   */
  @Get('costs')
  @Permissions('analytics.view')
  @Cache('analytics:costs', 60)
  async getCostAnalytics(@Query() query: CostAnalyticsQueryDto) {
    const from = query.from ? new Date(query.from) : undefined;
    const to = query.to ? new Date(query.to) : undefined;
    return this.analyticsService.getCostAnalytics(from, to);
  }

  /**
   * GET /analytics/products
   * Product Analytics — most produced, highest/lowest cost, per-product stats.
   * Optional query: ?limit=20
   * Audience: Senior Manager, General Manager.
   */
  @Get('products')
  @Permissions('analytics.view')
  @Cache('analytics:products', 60)
  async getProductAnalytics(@Query() query: ProductAnalyticsQueryDto) {
    return this.analyticsService.getProductAnalytics(query.limit ?? 50);
  }

  /**
   * GET /analytics/vendors
   * Vendor Analytics — vendor cost summary, usage, variance performance.
   * Optional query: ?limit=20
   * Audience: Senior Manager, General Manager, Accounts.
   */
  @Get('vendors')
  @Permissions('analytics.view')
  @Cache('analytics:vendors', 60)
  async getVendorAnalytics(@Query() query: VendorAnalyticsQueryDto) {
    return this.analyticsService.getVendorAnalytics(query.limit ?? 50);
  }

  /**
   * GET /analytics/dashboard-overview
   * Consolidated Executive Dashboard Overview.
   * Single call replacing 5 parallel analytics network round-trips.
   */
  @Get('dashboard-overview')
  @Permissions('analytics.view')
  @Cache('analytics:dashboard-overview', 60)
  async getDashboardOverview() {
    return this.analyticsService.getDashboardOverview();
  }
}
