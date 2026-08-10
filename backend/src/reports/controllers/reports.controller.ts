import { Controller, Get, Query, Request } from '@nestjs/common';
import { Permissions } from '../../auth/decorators/permissions.decorator';
import { ReportsService } from '../services/reports.service';
import { ReportQueryDto } from '../dto/report-query.dto';

@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('production/daily')
  @Permissions('reports.view')
  async getDailyProductionSummary(@Request() req: any, @Query() query: ReportQueryDto) {
    return this.reportsService.getDailyProductionSummary(req.user, query);
  }

  @Get('production/process-yield')
  @Permissions('reports.view')
  async getProcessYield(@Request() req: any, @Query() query: ReportQueryDto) {
    return this.reportsService.getProcessYield(req.user, query);
  }

  @Get('production/machine-utilization')
  @Permissions('reports.view')
  async getMachineUtilization(@Request() req: any, @Query() query: ReportQueryDto) {
    return this.reportsService.getMachineUtilization(req.user, query);
  }

  @Get('cost/actual-vs-predicted')
  @Permissions('reports.view')
  async getActualVsPredictedCosts(@Request() req: any, @Query() query: ReportQueryDto) {
    return this.reportsService.getActualVsPredictedCosts(req.user, query);
  }

  @Get('cost/material-breakdown')
  @Permissions('reports.view')
  async getMaterialCostBreakdown(@Request() req: any, @Query() query: ReportQueryDto) {
    return this.reportsService.getMaterialCostBreakdown(req.user, query);
  }

  @Get('cost/department-budget')
  @Permissions('reports.view')
  async getDepartmentBudgetUtilization(@Request() req: any, @Query() query: ReportQueryDto) {
    return this.reportsService.getDepartmentBudgetUtilization(req.user, query);
  }

  @Get('master-data/vendor-performance')
  @Permissions('reports.view')
  async getVendorPerformance(@Request() req: any, @Query() query: ReportQueryDto) {
    return this.reportsService.getVendorPerformance(req.user, query);
  }

  @Get('master-data/products')
  @Permissions('reports.view')
  async getProductCatalog(@Request() req: any, @Query() query: ReportQueryDto) {
    return this.reportsService.getProductCatalog(req.user, query);
  }

  @Get('workflow/bottleneck')
  @Permissions('reports.view')
  async getWorkflowBottleneck(@Request() req: any, @Query() query: ReportQueryDto) {
    return this.reportsService.getWorkflowBottleneck(req.user, query);
  }
}
