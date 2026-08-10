import { Controller, Get, Query, Request, Res } from '@nestjs/common';
import { Response } from 'express';
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

  @Get('production/daily/export')
  @Permissions('reports.view')
  async exportDailyProductionSummary(
    @Request() req: any,
    @Query() query: ReportQueryDto,
    @Res() res: Response,
  ) {
    const { format = 'excel' } = query as any;
    const allQuery = { ...query, page: 1, limit: 100000 };
    const reportData = await this.reportsService.getDailyProductionSummary(req.user, allQuery);

    if (format === 'excel') {
      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      );
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="IMCMS_Daily_Production_Summary_${new Date().toISOString().slice(0, 10)}.xlsx"`,
      );
      await this.reportsService.generateExcel(
        res,
        'Daily Production Summary',
        reportData.data,
        [
          { header: 'Indent Number', key: 'indentNumber', width: 20 },
          { header: 'Product Code', key: 'productCode', width: 15 },
          { header: 'Product Name', key: 'productName', width: 25 },
          { header: 'Department', key: 'departmentName', width: 20 },
          { header: 'Priority', key: 'priority', width: 12 },
          { header: 'Status', key: 'status', width: 15 },
          { header: 'Required Date', key: 'requiredDate', width: 15, type: 'date' },
          { header: 'Created At', key: 'createdAt', width: 15, type: 'date' },
          { header: 'Delivery Date', key: 'receivedDate', width: 15, type: 'date' },
        ],
        query,
      );
    } else {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="IMCMS_Daily_Production_Summary_${new Date().toISOString().slice(0, 10)}.pdf"`,
      );
      await this.reportsService.generatePdf(
        res,
        'Daily Production Summary',
        reportData.data,
        [
          { header: 'Indent Number', key: 'indentNumber' },
          { header: 'Product Code', key: 'productCode' },
          { header: 'Product Name', key: 'productName' },
          { header: 'Department', key: 'departmentName' },
          { header: 'Priority', key: 'priority' },
          { header: 'Status', key: 'status' },
        ],
        query,
      );
    }
  }

  @Get('production/process-yield')
  @Permissions('reports.view')
  async getProcessYield(@Request() req: any, @Query() query: ReportQueryDto) {
    return this.reportsService.getProcessYield(req.user, query);
  }

  @Get('production/process-yield/export')
  @Permissions('reports.view')
  async exportProcessYield(@Res() res: Response) {
    return res.status(400).json({
      message:
        'Yield data unavailable — required process input/output tracking fields are not stored in the database.',
    });
  }

  @Get('production/machine-utilization')
  @Permissions('reports.view')
  async getMachineUtilization(@Request() req: any, @Query() query: ReportQueryDto) {
    return this.reportsService.getMachineUtilization(req.user, query);
  }

  @Get('production/machine-utilization/export')
  @Permissions('reports.view')
  async exportMachineUtilization(@Res() res: Response) {
    return res.status(400).json({
      message:
        'Machine utilization data unavailable — required source tables (e.g. Machine, MachineLog, MachineOperatingTime) are not stored in the database.',
    });
  }

  @Get('cost/actual-vs-predicted')
  @Permissions('reports.view')
  async getActualVsPredictedCosts(@Request() req: any, @Query() query: ReportQueryDto) {
    return this.reportsService.getActualVsPredictedCosts(req.user, query);
  }

  @Get('cost/actual-vs-predicted/export')
  @Permissions('reports.view')
  async exportActualVsPredictedCosts(
    @Request() req: any,
    @Query() query: ReportQueryDto,
    @Res() res: Response,
  ) {
    const { format = 'excel' } = query as any;
    const allQuery = { ...query, page: 1, limit: 100000 };
    const reportData = await this.reportsService.getActualVsPredictedCosts(req.user, allQuery);

    if (format === 'excel') {
      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      );
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="IMCMS_Actual_vs_Predicted_Costs_${new Date().toISOString().slice(0, 10)}.xlsx"`,
      );
      await this.reportsService.generateExcel(
        res,
        'Actual vs Predicted Costs',
        reportData.data,
        [
          { header: 'Cost Number', key: 'costNumber', width: 20 },
          { header: 'Indent Number', key: 'indentNumber', width: 20 },
          { header: 'Product Name', key: 'productName', width: 25 },
          { header: 'Planned Total', key: 'predictedTotal', width: 18, type: 'currency' },
          { header: 'Actual Total', key: 'actualTotal', width: 18, type: 'currency' },
          { header: 'Variance', key: 'varianceAmount', width: 18, type: 'currency' },
          { header: 'Variance %', key: 'variancePercentage', width: 15, type: 'percentage' },
          { header: 'Status', key: 'status', width: 15 },
          { header: 'Created At', key: 'createdAt', width: 15, type: 'date' },
        ],
        query,
      );
    } else {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="IMCMS_Actual_vs_Predicted_Costs_${new Date().toISOString().slice(0, 10)}.pdf"`,
      );
      await this.reportsService.generatePdf(
        res,
        'Actual vs Predicted Costs',
        reportData.data,
        [
          { header: 'Cost Number', key: 'costNumber' },
          { header: 'Indent Number', key: 'indentNumber' },
          { header: 'Product Name', key: 'productName' },
          { header: 'Planned ($)', key: 'predictedTotal', type: 'currency', align: 'right' },
          { header: 'Actual ($)', key: 'actualTotal', type: 'currency', align: 'right' },
          { header: 'Variance ($)', key: 'varianceAmount', type: 'currency', align: 'right' },
          { header: 'Variance %', key: 'variancePercentage', type: 'percentage', align: 'right' },
        ],
        query,
      );
    }
  }

  @Get('cost/material-breakdown')
  @Permissions('reports.view')
  async getMaterialCostBreakdown(@Request() req: any, @Query() query: ReportQueryDto) {
    return this.reportsService.getMaterialCostBreakdown(req.user, query);
  }

  @Get('cost/material-breakdown/export')
  @Permissions('reports.view')
  async exportMaterialCostBreakdown(
    @Request() req: any,
    @Query() query: ReportQueryDto,
    @Res() res: Response,
  ) {
    const { format = 'excel' } = query as any;
    const allQuery = { ...query, page: 1, limit: 100000 };
    const reportData = await this.reportsService.getMaterialCostBreakdown(req.user, allQuery);

    if (format === 'excel') {
      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      );
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="IMCMS_Material_Cost_Breakdown_${new Date().toISOString().slice(0, 10)}.xlsx"`,
      );
      await this.reportsService.generateExcel(
        res,
        'Material Cost Breakdown',
        reportData.data,
        [
          { header: 'Material Code', key: 'materialCode', width: 20 },
          { header: 'Material Name', key: 'materialName', width: 25 },
          { header: 'Category', key: 'category', width: 20 },
          { header: 'Total Est. Qty', key: 'totalPredictedQty', width: 15 },
          { header: 'Total Act. Qty', key: 'totalActualQty', width: 15 },
          { header: 'Est. Amount', key: 'totalPredictedAmount', width: 18, type: 'currency' },
          { header: 'Act. Amount', key: 'totalActualAmount', width: 18, type: 'currency' },
          { header: 'Variance', key: 'varianceAmount', width: 18, type: 'currency' },
        ],
        query,
      );
    } else {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="IMCMS_Material_Cost_Breakdown_${new Date().toISOString().slice(0, 10)}.pdf"`,
      );
      await this.reportsService.generatePdf(
        res,
        'Material Cost Breakdown',
        reportData.data,
        [
          { header: 'Material Code', key: 'materialCode' },
          { header: 'Material Name', key: 'materialName' },
          { header: 'Category', key: 'category' },
          { header: 'Est Qty', key: 'totalPredictedQty', align: 'right' },
          { header: 'Act Qty', key: 'totalActualQty', align: 'right' },
          { header: 'Est Amt ($)', key: 'totalPredictedAmount', type: 'currency', align: 'right' },
          { header: 'Act Amt ($)', key: 'totalActualAmount', type: 'currency', align: 'right' },
          { header: 'Variance ($)', key: 'varianceAmount', type: 'currency', align: 'right' },
        ],
        query,
      );
    }
  }

  @Get('cost/department-budget')
  @Permissions('reports.view')
  async getDepartmentBudgetUtilization(@Request() req: any, @Query() query: ReportQueryDto) {
    return this.reportsService.getDepartmentBudgetUtilization(req.user, query);
  }

  @Get('cost/department-budget/export')
  @Permissions('reports.view')
  async exportDepartmentBudgetUtilization(@Res() res: Response) {
    return res.status(400).json({
      message:
        'Department budget utilization data unavailable — required budget limit, forecast, and allocation records are not stored in the database.',
    });
  }

  @Get('master-data/vendor-performance')
  @Permissions('reports.view')
  async getVendorPerformance(@Request() req: any, @Query() query: ReportQueryDto) {
    return this.reportsService.getVendorPerformance(req.user, query);
  }

  @Get('master-data/vendor-performance/export')
  @Permissions('reports.view')
  async exportVendorPerformance(
    @Request() req: any,
    @Query() query: ReportQueryDto,
    @Res() res: Response,
  ) {
    const { format = 'excel' } = query as any;
    const allQuery = { ...query, page: 1, limit: 100000 };
    const reportData = await this.reportsService.getVendorPerformance(req.user, allQuery);

    if (format === 'excel') {
      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      );
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="IMCMS_Vendor_Performance_Matrix_${new Date().toISOString().slice(0, 10)}.xlsx"`,
      );
      await this.reportsService.generateExcel(
        res,
        'Vendor Performance Matrix',
        reportData.data,
        [
          { header: 'Vendor Code', key: 'vendorCode', width: 20 },
          { header: 'Vendor Name', key: 'vendorName', width: 25 },
          { header: 'Supplied Cost Items', key: 'totalCostItems', width: 20 },
          { header: 'Predicted Total', key: 'totalPredictedAmount', width: 18, type: 'currency' },
          { header: 'Actual Total', key: 'totalActualAmount', width: 18, type: 'currency' },
          { header: 'Variance', key: 'totalVariance', width: 18, type: 'currency' },
          { header: 'Variance %', key: 'variancePercentage', width: 15, type: 'percentage' },
        ],
        query,
      );
    } else {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="IMCMS_Vendor_Performance_Matrix_${new Date().toISOString().slice(0, 10)}.pdf"`,
      );
      await this.reportsService.generatePdf(
        res,
        'Vendor Performance Matrix',
        reportData.data,
        [
          { header: 'Vendor Code', key: 'vendorCode' },
          { header: 'Vendor Name', key: 'vendorName' },
          { header: 'Items Supplied', key: 'totalCostItems', align: 'center' },
          {
            header: 'Predicted Amt ($)',
            key: 'totalPredictedAmount',
            type: 'currency',
            align: 'right',
          },
          { header: 'Actual Amt ($)', key: 'totalActualAmount', type: 'currency', align: 'right' },
          { header: 'Variance ($)', key: 'totalVariance', type: 'currency', align: 'right' },
          { header: 'Variance %', key: 'variancePercentage', type: 'percentage', align: 'right' },
        ],
        query,
      );
    }
  }

  @Get('master-data/products')
  @Permissions('reports.view')
  async getProductCatalog(@Request() req: any, @Query() query: ReportQueryDto) {
    return this.reportsService.getProductCatalog(req.user, query);
  }

  @Get('master-data/products/export')
  @Permissions('reports.view')
  async exportProductCatalog(
    @Request() req: any,
    @Query() query: ReportQueryDto,
    @Res() res: Response,
  ) {
    const { format = 'excel' } = query as any;
    const allQuery = { ...query, page: 1, limit: 100000 };
    const reportData = await this.reportsService.getProductCatalog(req.user, allQuery);

    if (format === 'excel') {
      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      );
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="IMCMS_Product_Catalog_${new Date().toISOString().slice(0, 10)}.xlsx"`,
      );
      await this.reportsService.generateExcel(
        res,
        'Product Catalog Export',
        reportData.data,
        [
          { header: 'Product Code', key: 'productCode', width: 20 },
          { header: 'Product Name', key: 'productName', width: 25 },
          { header: 'Drawing Number', key: 'drawingNumber', width: 20 },
          { header: 'Revision', key: 'revision', width: 12 },
          { header: 'Status', key: 'status', width: 15 },
          { header: 'Materials Mapped', key: 'materialCount', width: 18 },
          { header: 'Processes Mapped', key: 'processCount', width: 18 },
          { header: 'Active Indents', key: 'activeIndentCount', width: 18 },
          { header: 'Created At', key: 'createdAt', width: 15, type: 'date' },
        ],
        query,
      );
    } else {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="IMCMS_Product_Catalog_${new Date().toISOString().slice(0, 10)}.pdf"`,
      );
      await this.reportsService.generatePdf(
        res,
        'Product Catalog Export',
        reportData.data,
        [
          { header: 'Product Code', key: 'productCode' },
          { header: 'Product Name', key: 'productName' },
          { header: 'Drawing Number', key: 'drawingNumber' },
          { header: 'Revision', key: 'revision' },
          { header: 'Status', key: 'status' },
          { header: 'Materials Mapped', key: 'materialCount', align: 'center' },
          { header: 'Processes Mapped', key: 'processCount', align: 'center' },
          { header: 'Active Indents', key: 'activeIndentCount', align: 'center' },
        ],
        query,
      );
    }
  }

  @Get('workflow/bottleneck')
  @Permissions('reports.view')
  async getWorkflowBottleneck(@Request() req: any, @Query() query: ReportQueryDto) {
    return this.reportsService.getWorkflowBottleneck(req.user, query);
  }

  @Get('workflow/bottleneck/export')
  @Permissions('reports.view')
  async exportWorkflowBottleneck(
    @Request() req: any,
    @Query() query: ReportQueryDto,
    @Res() res: Response,
  ) {
    const { format = 'excel' } = query as any;
    const allQuery = { ...query, page: 1, limit: 100000 };
    const reportData = await this.reportsService.getWorkflowBottleneck(req.user, allQuery);

    if (format === 'excel') {
      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      );
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="IMCMS_Workflow_Bottleneck_Analysis_${new Date().toISOString().slice(0, 10)}.xlsx"`,
      );
      await this.reportsService.generateExcel(
        res,
        'Workflow Bottleneck Analysis',
        reportData.data,
        [
          { header: 'Workflow Stage Name', key: 'stageName', width: 25 },
          { header: 'Passed Indents Count', key: 'totalTransactionsPassed', width: 20 },
          { header: 'Avg Processing Time (Hrs)', key: 'averageDurationHours', width: 22 },
          { header: 'Max Processing Time (Hrs)', key: 'maxDurationHours', width: 22 },
          { header: 'Stalled Active Indents', key: 'activeTransactionsCount', width: 20 },
        ],
        query,
      );
    } else {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="IMCMS_Workflow_Bottleneck_Analysis_${new Date().toISOString().slice(0, 10)}.pdf"`,
      );
      await this.reportsService.generatePdf(
        res,
        'Workflow Bottleneck Analysis',
        reportData.data,
        [
          { header: 'Workflow Stage Name', key: 'stageName' },
          { header: 'Passed Count', key: 'totalTransactionsPassed', align: 'center' },
          { header: 'Avg Time (Hrs)', key: 'averageDurationHours', align: 'right' },
          { header: 'Max Time (Hrs)', key: 'maxDurationHours', align: 'right' },
          { header: 'Stalled Indents', key: 'activeTransactionsCount', align: 'center' },
        ],
        query,
      );
    }
  }
}
