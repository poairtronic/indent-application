/**
 * Analytics Controller — Phase 15A: Analytics & Executive Intelligence
 *
 * Thin controller. All business logic lives in AnalyticsService.
 * RBAC: analytics.view permission required on every endpoint.
 */

import { Controller, Get, Query } from '@nestjs/common';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { AnalyticsService } from './analytics.service';
import {
  CostAnalyticsQueryDto,
  ProductAnalyticsQueryDto,
  VendorAnalyticsQueryDto,
} from './dto/analytics-query.dto';

@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  /**
   * GET /analytics/summary
   * Executive Summary — total, active, completed, archived, pending counts.
   * Audience: Senior Manager, General Manager, Admin, Design Engineer.
   */
  @Get('summary')
  @Permissions('analytics.view')
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
  async getVendorAnalytics(@Query() query: VendorAnalyticsQueryDto) {
    return this.analyticsService.getVendorAnalytics(query.limit ?? 50);
  }
}
