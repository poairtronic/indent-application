import { Injectable, ForbiddenException, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import * as ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';
import { PrismaService } from '../../prisma/prisma.service';
import { ReportQueryDto } from '../dto/report-query.dto';
import {
  ReportResponse,
  DailyProductionReportItem,
  ProcessYieldReportItem,
  MachineUtilizationReportItem,
  ActualVsPredictedCostReportItem,
  MaterialCostBreakdownReportItem,
  DepartmentBudgetReportItem,
  VendorPerformanceReportItem,
  ProductCatalogReportItem,
  WorkflowBottleneckReportItem,
} from '../types/report.types';

@Injectable()
export class ReportsService {
  private readonly logger = new Logger(ReportsService.name);

  constructor(private readonly prisma: PrismaService) {}

  public getSystemCurrency(): { symbol: string; code: string; numFmt: string } {
    const code = (
      process.env.DEFAULT_CURRENCY ||
      process.env.SYSTEM_CURRENCY ||
      'INR'
    ).toUpperCase();
    if (code === 'USD') {
      return { symbol: '$', code: 'USD', numFmt: '$#,##0.00' };
    }
    if (code === 'EUR') {
      return { symbol: '€', code: 'EUR', numFmt: '€#,##0.00' };
    }
    return { symbol: '₹', code: 'INR', numFmt: '[$₹-439] #,##0.00' };
  }

  async generateExcel(
    res: any,
    title: string,
    data: any[],
    columns: {
      header: string;
      key: string;
      width?: number;
      type?: 'string' | 'number' | 'date' | 'currency' | 'percentage';
    }[],
    queryParams: any,
  ) {
    const currency = this.getSystemCurrency();
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Report');

    // Title Block
    worksheet.mergeCells('A1:I1');
    const titleCell = worksheet.getCell('A1');
    titleCell.value = `IMCMS - ${title}`;
    titleCell.font = { name: 'Arial', size: 16, bold: true, color: { argb: 'FFFFFFFF' } };
    titleCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1E293B' },
    };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    worksheet.getRow(1).height = 40;

    // Generated metadata
    worksheet.getCell('A3').value = 'Generated At:';
    worksheet.getCell('A3').font = { bold: true };
    worksheet.getCell('B3').value = new Date().toISOString().replace('T', ' ').slice(0, 19);

    // Write query filters
    worksheet.getCell('A4').value = 'Filters:';
    worksheet.getCell('A4').font = { bold: true };
    const filterText =
      Object.entries(queryParams)
        .filter(([k, v]) => v && !['page', 'limit', 'sortBy', 'sortOrder', 'format'].includes(k))
        .map(([k, v]) => `${k}: ${v}`)
        .join(', ') || 'None';
    worksheet.getCell('B4').value = filterText;

    // Add empty row
    worksheet.addRow([]);
    worksheet.addRow([]);

    // Headers
    const headers = columns.map((c) => c.header);
    const headerRow = worksheet.addRow(headers);
    headerRow.height = 24;
    headerRow.eachCell((cell) => {
      cell.font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF334155' },
      };
      cell.alignment = { vertical: 'middle' };
      cell.border = {
        bottom: { style: 'medium', color: { argb: 'FF000000' } },
      };
    });

    // Data Rows
    data.forEach((item) => {
      const rowValues = columns.map((col) => {
        const val = item[col.key];
        if (col.type === 'date') {
          return val ? new Date(val).toLocaleDateString() : '-';
        }
        return val !== null && val !== undefined ? val : '-';
      });
      const row = worksheet.addRow(rowValues);
      row.height = 20;
      row.eachCell((cell, colIdx) => {
        const colDef = columns[colIdx - 1];
        cell.font = { name: 'Arial', size: 10 };
        cell.border = {
          bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        };
        if (typeof cell.value === 'number') {
          if (colDef.type === 'currency') {
            cell.numFmt = currency.numFmt;
            cell.alignment = { horizontal: 'right' };
          } else if (colDef.type === 'percentage') {
            cell.numFmt = '0.00"%"';
            cell.alignment = { horizontal: 'right' };
          } else {
            cell.numFmt = '#,##0';
            cell.alignment = { horizontal: 'right' };
          }
        }
      });
    });

    // Column widths
    columns.forEach((col, idx) => {
      const worksheetColumn = worksheet.getColumn(idx + 1);
      worksheetColumn.width = col.width || 15;
    });

    worksheet.views = [{ state: 'frozen', ySplit: 6 }];

    await workbook.xlsx.write(res);
    res.end();
  }

  async generatePdf(
    res: any,
    title: string,
    data: any[],
    columns: {
      header: string;
      key: string;
      width?: number;
      align?: 'left' | 'center' | 'right';
      type?: 'string' | 'number' | 'date' | 'currency' | 'percentage';
    }[],
    queryParams: any,
  ) {
    const currency = this.getSystemCurrency();
    const doc = new PDFDocument({ margin: 30, size: 'A4', layout: 'landscape' });
    doc.pipe(res);

    // Title Section
    doc.rect(30, 30, doc.page.width - 60, 40).fill('#1E293B');
    doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(14).text(`IMCMS - ${title}`, 40, 44);

    // Subheader with metadata
    doc
      .fillColor('#64748B')
      .font('Helvetica')
      .fontSize(9)
      .text(
        `Generated: ${new Date().toISOString().replace('T', ' ').slice(0, 19)}`,
        doc.page.width - 200,
        45,
        { align: 'right', width: 160 },
      );

    const filterText =
      Object.entries(queryParams)
        .filter(([k, v]) => v && !['page', 'limit', 'sortBy', 'sortOrder', 'format'].includes(k))
        .map(([k, v]) => `${k}: ${v}`)
        .join(' | ') || 'None';

    doc
      .fillColor('#475569')
      .fontSize(8)
      .text(`Active Filters: ${filterText}`, 30, 80, { width: doc.page.width - 60 });

    let currentY = 100;
    const colWidth = (doc.page.width - 60) / columns.length;

    // Header Background
    doc.rect(30, currentY, doc.page.width - 60, 20).fill('#334155');

    // Header Text
    columns.forEach((col, idx) => {
      doc
        .fillColor('#FFFFFF')
        .font('Helvetica-Bold')
        .fontSize(9)
        .text(col.header, 35 + idx * colWidth, currentY + 6, {
          width: colWidth - 10,
          align: col.align || 'left',
        });
    });

    currentY += 20;

    // Data Rows
    doc.font('Helvetica').fontSize(8);
    data.forEach((row, rowIndex) => {
      if (currentY > doc.page.height - 60) {
        doc.addPage({ margin: 30, size: 'A4', layout: 'landscape' });
        currentY = 30;

        // Repeat headers on new page
        doc.rect(30, currentY, doc.page.width - 60, 20).fill('#334155');

        columns.forEach((col, idx) => {
          doc
            .fillColor('#FFFFFF')
            .font('Helvetica-Bold')
            .fontSize(9)
            .text(col.header, 35 + idx * colWidth, currentY + 6, {
              width: colWidth - 10,
              align: col.align || 'left',
            });
        });
        doc.font('Helvetica').fontSize(8);
        currentY += 20;
      }

      // Zebra striping
      if (rowIndex % 2 === 1) {
        doc
          .fillColor('#F8FAFC')
          .rect(30, currentY, doc.page.width - 60, 18)
          .fill();
        doc.fillColor('#000000');
      }

      columns.forEach((col, colIdx) => {
        let val = row[col.key];
        if (col.type === 'date' && val) {
          val = new Date(val).toLocaleDateString();
        } else if (col.type === 'currency' && typeof val === 'number') {
          val = `${currency.symbol}${val.toFixed(2)}`;
        } else if (col.type === 'percentage' && typeof val === 'number') {
          val = `${val.toFixed(2)}%`;
        } else if (val === null || val === undefined) {
          val = '-';
        }

        doc.text(String(val), 35 + colIdx * colWidth, currentY + 5, {
          width: colWidth - 10,
          align: col.align || 'left',
        });
      });

      doc
        .strokeColor('#E2E8F0')
        .lineWidth(0.5)
        .moveTo(30, currentY + 18)
        .lineTo(doc.page.width - 30, currentY + 18)
        .stroke();

      currentY += 18;
    });

    const pages = doc.bufferedPageRange();
    for (let i = 0; i < pages.count; i++) {
      doc.switchToPage(i);
      doc.fillColor('#94A3B8').font('Helvetica').fontSize(7);
      doc.text(`Page ${i + 1} of ${pages.count}`, doc.page.width - 80, doc.page.height - 20, {
        align: 'right',
      });
    }

    doc.end();
  }

  /**
   * Helper to check department-level boundaries for reports (Phase 22 RBAC Alignment)
   */
  private checkReportAccess(user: any, reportId: string) {
    const isAdmin = user.permissions?.includes('settings.manage');
    const deptCode = user.department?.departmentCode;
    const isManager = deptCode === 'SMGR' || deptCode === 'GMGR';

    if (isAdmin || isManager) return; // Admins and managers can see all reports

    switch (reportId) {
      case 'daily-production':
      case 'process-yield':
      case 'machine-utilization':
        if (deptCode !== 'PROD') {
          throw new ForbiddenException(
            'Access denied. Manufacturing Operations reports are restricted to Production and Management.',
          );
        }
        break;
      case 'actual-vs-predicted':
      case 'material-breakdown':
      case 'department-budget':
        if (deptCode !== 'ACCT') {
          throw new ForbiddenException(
            'Access denied. Cost & Financial reports are restricted to Accounts and Management.',
          );
        }
        break;
      case 'vendor-performance':
        if (deptCode !== 'STOR' && deptCode !== 'ACCT') {
          throw new ForbiddenException(
            'Access denied. Vendor Performance matrix is restricted to Stores, Accounts, and Management.',
          );
        }
        break;
      case 'product-catalog':
      case 'workflow-bottleneck':
        if (deptCode !== 'DSGN' && deptCode !== 'STOR') {
          throw new ForbiddenException(
            'Access denied. This report is restricted to Design, Stores, and Management.',
          );
        }
        break;
      default:
        throw new ForbiddenException('Unknown report identifier.');
    }
  }

  /**
   * 1. Daily Production Summary
   */
  async getDailyProductionSummary(
    user: any,
    query: ReportQueryDto,
  ): Promise<ReportResponse<DailyProductionReportItem>> {
    this.checkReportAccess(user, 'daily-production');
    const {
      page = 1,
      limit = 10,
      sortBy,
      sortOrder = 'asc',
      search,
      dateFrom,
      dateTo,
      productId,
      departmentId,
      status,
    } = query;

    const where: Prisma.IndentWhereInput = { isDeleted: false };

    if (productId) where.productId = productId;
    if (departmentId) where.departmentId = departmentId;
    if (status) where.status = status as any;

    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = new Date(dateFrom);
      if (dateTo) where.createdAt.lte = new Date(dateTo);
    }

    if (search) {
      where.OR = [
        { indentNumber: { contains: search, mode: 'insensitive' } },
        { purpose: { contains: search, mode: 'insensitive' } },
      ];
    }

    const orderBy: any = {};
    const allowedSortFields = [
      'indentNumber',
      'priority',
      'status',
      'requiredDate',
      'createdAt',
      'receivedDate',
      'productName',
      'productCode',
      'departmentName',
      'departmentCode',
    ];
    if (sortBy && allowedSortFields.includes(sortBy)) {
      if (sortBy === 'productName') {
        orderBy.product = { productName: sortOrder.toLowerCase() };
      } else if (sortBy === 'productCode') {
        orderBy.product = { productCode: sortOrder.toLowerCase() };
      } else if (sortBy === 'departmentName') {
        orderBy.department = { departmentName: sortOrder.toLowerCase() };
      } else if (sortBy === 'departmentCode') {
        orderBy.department = { departmentCode: sortOrder.toLowerCase() };
      } else if (sortBy === 'receivedDate') {
        orderBy.productionReceipt = { receivedDate: sortOrder.toLowerCase() };
      } else {
        orderBy[sortBy] = sortOrder.toLowerCase();
      }
    } else {
      orderBy.createdAt = 'desc';
    }

    const [items, total] = await Promise.all([
      this.prisma.indent.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          product: true,
          department: true,
          productionReceipt: true,
        },
      }),
      this.prisma.indent.count({ where }),
    ]);

    const data: DailyProductionReportItem[] = items.map((item: any) => ({
      id: item.id,
      indentNumber: item.indentNumber,
      productCode: item.product.productCode,
      productName: item.product.productName,
      departmentCode: item.department.departmentCode,
      departmentName: item.department.departmentName,
      priority: item.priority,
      status: item.status,
      requiredDate: item.requiredDate,
      createdAt: item.createdAt,
      receivedDate: item.productionReceipt?.receivedDate ?? null,
    }));

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * 2. Process Yield Report
   */
  async getProcessYield(
    user: any,
    query: ReportQueryDto,
  ): Promise<ReportResponse<ProcessYieldReportItem>> {
    this.checkReportAccess(user, 'process-yield');
    const { page = 1, limit = 10, search, productId, dateFrom, dateTo } = query;

    const processCode = (query as any).processCode || search;

    const where: Prisma.IndentProcessWhereInput = { isDeleted: false };

    if (processCode) {
      where.process = { processCode: { contains: processCode, mode: 'insensitive' } };
    }

    const indentWhere: Prisma.IndentWhereInput = {};
    if (productId) indentWhere.productId = productId;
    if (search && !processCode) {
      indentWhere.indentNumber = { contains: search, mode: 'insensitive' };
    }

    if (Object.keys(indentWhere).length > 0) {
      where.indentItem = { indent: indentWhere };
    }

    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = new Date(dateFrom);
      if (dateTo) where.createdAt.lte = new Date(dateTo);
    }

    const [items, total] = await Promise.all([
      this.prisma.indentProcess.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          process: true,
          indentItem: {
            include: {
              indent: { include: { product: true } },
              material: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.indentProcess.count({ where }),
    ]);

    const data: ProcessYieldReportItem[] = items.map((item: any) => {
      const input = Number(item.inputQuantity || 0);
      const output = Number(item.outputQuantity || 0);
      const scrap = Number(item.scrapQuantity || 0);

      let efficiencyPercentage = null;
      if (input > 0) {
        efficiencyPercentage = Number(((output / input) * 100).toFixed(2));
      }

      return {
        indentProcessId: item.id,
        indentNumber: item.indentItem.indent.indentNumber,
        productCode: item.indentItem.indent.product.productCode,
        productName: item.indentItem.indent.product.productName,
        processCode: item.process.processCode,
        processName: item.process.processName,
        sequence: item.sequence,
        estimatedHours: Number(item.estimatedHours),
        actualHours: item.actualHours !== null ? Number(item.actualHours) : null,
        varianceHours:
          item.actualHours !== null ? Number(item.actualHours) - Number(item.estimatedHours) : null,
        efficiencyPercentage,
        scrapFactor: scrap > 0 && input > 0 ? Number(((scrap / input) * 100).toFixed(2)) : 0,
      };
    });

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * 3. Machine Utilization Report
   * (Aggregates process-level execution hours as a proxy since no Machine entity exists)
   */
  async getMachineUtilization(
    user: any,
    query: ReportQueryDto,
  ): Promise<ReportResponse<MachineUtilizationReportItem>> {
    this.checkReportAccess(user, 'machine-utilization');
    const { page = 1, limit = 10, search, dateFrom, dateTo } = query;

    const where: Prisma.MachineLogWhereInput = { isDeleted: false };

    if (search) {
      where.machine = { machineName: { contains: search, mode: 'insensitive' } };
    }

    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = new Date(dateFrom);
      if (dateTo) where.createdAt.lte = new Date(dateTo);
    }

    // Group logs by processId
    const groupedLogs = await this.prisma.machineLog.groupBy({
      by: ['processId'],
      where,
      _sum: {
        operatingHours: true,
        downtimeHours: true,
      },
      _count: {
        id: true,
      },
    });

    const total = groupedLogs.length;

    // Pagination
    const paginatedGroups = groupedLogs.slice((page - 1) * limit, page * limit);

    const processIds = paginatedGroups.map((g) => g.processId);

    const processes = await this.prisma.manufacturingProcess.findMany({
      where: { id: { in: processIds } },
    });

    const processMap = new Map(processes.map((p) => [p.id, p]));

    const data: MachineUtilizationReportItem[] = paginatedGroups.map((group) => {
      const process = processMap.get(group.processId);
      const totalOp = Number(group._sum.operatingHours || 0);
      return {
        processCode: process?.processCode || 'UNKNOWN',
        processName: process?.processName || 'Unknown Process',
        totalIndentCount: group._count.id,
        totalEstimatedHours: Number(process?.estimatedHours || 0) * group._count.id,
        totalActualHours: totalOp,
        averageActualHours:
          group._count.id > 0 ? Number((totalOp / group._count.id).toFixed(2)) : null,
      };
    });

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * 4. Actual vs. Predicted Costs
   */
  async getActualVsPredictedCosts(
    user: any,
    query: ReportQueryDto,
  ): Promise<ReportResponse<ActualVsPredictedCostReportItem>> {
    this.checkReportAccess(user, 'actual-vs-predicted');
    const {
      page = 1,
      limit = 10,
      sortBy,
      sortOrder = 'asc',
      search,
      dateFrom,
      dateTo,
      productId,
      status,
    } = query;

    const where: Prisma.CostSheetWhereInput = { isDeleted: false };

    if (status) where.status = status as any;

    const indentWhere: Prisma.IndentWhereInput = { isDeleted: false };
    if (productId) indentWhere.productId = productId;
    if (search) {
      indentWhere.indentNumber = { contains: search, mode: 'insensitive' };
    }
    where.indent = indentWhere;

    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = new Date(dateFrom);
      if (dateTo) where.createdAt.lte = new Date(dateTo);
    }

    if (search && !productId) {
      // If no productId filter but search exists, allow searching costNumber too
      where.OR = [
        { costNumber: { contains: search, mode: 'insensitive' } },
        { indent: { indentNumber: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const orderBy: any = {};
    const whitelisted = [
      'costNumber',
      'indentNumber',
      'productName',
      'predictedTotal',
      'actualTotal',
      'varianceAmount',
      'variancePercentage',
      'createdAt',
      'status',
    ];
    if (sortBy && whitelisted.includes(sortBy)) {
      if (sortBy === 'indentNumber') {
        orderBy.indent = { indentNumber: sortOrder.toLowerCase() };
      } else if (sortBy === 'productName') {
        orderBy.indent = { product: { productName: sortOrder.toLowerCase() } };
      } else {
        orderBy[sortBy] = sortOrder.toLowerCase();
      }
    } else {
      orderBy.createdAt = 'desc';
    }

    const [items, total] = await Promise.all([
      this.prisma.costSheet.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          indent: {
            include: {
              product: true,
            },
          },
        },
      }),
      this.prisma.costSheet.count({ where }),
    ]);

    const data: ActualVsPredictedCostReportItem[] = items.map((item: any) => ({
      id: item.id,
      costNumber: item.costNumber,
      indentNumber: item.indent.indentNumber,
      productCode: item.indent.product.productCode,
      productName: item.indent.product.productName,
      predictedTotal: Number(item.predictedTotal),
      actualTotal: item.actualTotal !== null ? Number(item.actualTotal) : null,
      varianceAmount: item.varianceAmount !== null ? Number(item.varianceAmount) : null,
      variancePercentage: item.variancePercentage !== null ? Number(item.variancePercentage) : null,
      status: item.status,
      createdAt: item.createdAt,
    }));

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * 5. Material Cost Breakdown
   */
  async getMaterialCostBreakdown(
    user: any,
    query: ReportQueryDto,
  ): Promise<ReportResponse<MaterialCostBreakdownReportItem>> {
    this.checkReportAccess(user, 'material-breakdown');
    const {
      page = 1,
      limit = 10,
      sortBy,
      sortOrder = 'asc',
      search,
      dateFrom,
      dateTo,
      materialId,
      status,
    } = query;

    const where: Prisma.CostItemWhereInput = { isDeleted: false };
    if (materialId) where.materialId = materialId;

    const materialWhere: Prisma.MaterialWhereInput = {};
    if (status) materialWhere.category = status; // Reusing status query param for Category filter to match central registry mapping
    if (search) {
      materialWhere.OR = [
        { materialName: { contains: search, mode: 'insensitive' } },
        { materialCode: { contains: search, mode: 'insensitive' } },
      ];
    }
    where.material = materialWhere;

    if (dateFrom || dateTo) {
      where.costSheet = { isDeleted: false };
      const dateFilter: any = {};
      if (dateFrom) dateFilter.gte = new Date(dateFrom);
      if (dateTo) dateFilter.lte = new Date(dateTo);
      where.costSheet.createdAt = dateFilter;
    }

    // Database aggregation: Group and sum directly in PostgreSQL
    const grouped = await this.prisma.costItem.groupBy({
      by: ['materialId'],
      where,
      _sum: {
        predictedQuantity: true,
        predictedAmount: true,
        actualQuantity: true,
        actualAmount: true,
      },
      _count: {
        actualAmount: true,
      },
    });

    if (grouped.length === 0) {
      return {
        data: [],
        meta: { total: 0, page, limit, totalPages: 0 },
      };
    }

    // Fetch material master data for the grouped results
    const materials = await this.prisma.material.findMany({
      where: {
        id: { in: grouped.map((g) => g.materialId) },
      },
    });

    const materialMap = new Map(materials.map((m) => [m.id, m]));

    const allGroupedItems = grouped
      .map((g) => {
        const material = materialMap.get(g.materialId);
        if (!material) return null;

        const predAmt = g._sum.predictedAmount ? Number(g._sum.predictedAmount) : 0;
        const actAmt = g._sum.actualAmount ? Number(g._sum.actualAmount) : null;
        const hasActuals = (g._count.actualAmount ?? 0) > 0;

        const variance = hasActuals && actAmt !== null ? actAmt - predAmt : null;

        return {
          materialId: g.materialId,
          materialCode: material.materialCode,
          materialName: material.materialName,
          category: material.category,
          totalPredictedQty: g._sum.predictedQuantity ? Number(g._sum.predictedQuantity) : 0,
          totalActualQty:
            hasActuals && g._sum.actualQuantity ? Number(g._sum.actualQuantity) : null,
          totalPredictedAmount: predAmt,
          totalActualAmount: hasActuals ? actAmt : null,
          varianceAmount: variance,
        };
      })
      .filter((item) => item !== null) as MaterialCostBreakdownReportItem[];

    const allowedSortFields = [
      'materialCode',
      'materialName',
      'category',
      'totalPredictedQty',
      'totalActualQty',
      'totalPredictedAmount',
      'totalActualAmount',
      'varianceAmount',
    ];
    const cleanSortBy = sortBy && allowedSortFields.includes(sortBy) ? sortBy : 'materialCode';
    const isAsc = sortOrder.toLowerCase() === 'asc';

    allGroupedItems.sort((a: any, b: any) => {
      const valA = a[cleanSortBy];
      const valB = b[cleanSortBy];
      if (valA === null || valA === undefined) return isAsc ? 1 : -1;
      if (valB === null || valB === undefined) return isAsc ? -1 : 1;
      if (typeof valA === 'string' && typeof valB === 'string') {
        return isAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      return isAsc ? Number(valA) - Number(valB) : Number(valB) - Number(valA);
    });

    const total = allGroupedItems.length;
    const paginatedItems = allGroupedItems.slice((page - 1) * limit, page * limit);

    return {
      data: paginatedItems,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * 6. Department Budget Utilization
   */
  async getDepartmentBudgetUtilization(
    user: any,
    query: ReportQueryDto,
  ): Promise<ReportResponse<DepartmentBudgetReportItem>> {
    this.checkReportAccess(user, 'department-budget');
    const { page = 1, limit = 10, search, departmentId } = query;

    const where: Prisma.DepartmentBudgetWhereInput = { isDeleted: false };

    if (departmentId) where.departmentId = departmentId;
    if (search) {
      where.department = { departmentName: { contains: search, mode: 'insensitive' } };
    }

    const [items, total] = await Promise.all([
      this.prisma.departmentBudget.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: { department: true },
        orderBy: { fiscalYear: 'desc' },
      }),
      this.prisma.departmentBudget.count({ where }),
    ]);

    const data: DepartmentBudgetReportItem[] = items.map((item: any) => {
      const budgetAmount = Number(item.budgetAmount);
      const allocatedAmount = Number(item.allocatedAmount);
      const variance = budgetAmount - allocatedAmount;
      const variancePct =
        budgetAmount > 0 ? Number(((variance / budgetAmount) * 100).toFixed(2)) : 0;

      return {
        departmentId: item.departmentId,
        departmentCode: item.department.departmentCode,
        departmentName: item.department.departmentName,
        totalPlannedCost: budgetAmount,
        totalActualCost: allocatedAmount,
        varianceAmount: variance,
        variancePercentage: variancePct,
      };
    });

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * 7. Vendor Performance Matrix
   */
  async getVendorPerformance(
    user: any,
    query: ReportQueryDto,
  ): Promise<ReportResponse<VendorPerformanceReportItem>> {
    this.checkReportAccess(user, 'vendor-performance');
    const {
      page = 1,
      limit = 10,
      sortBy,
      sortOrder = 'asc',
      search,
      dateFrom,
      dateTo,
      vendorId,
    } = query;

    const vendorWhere: Prisma.VendorWhereInput = { isDeleted: false };
    if (vendorId) vendorWhere.id = vendorId;
    if (search) {
      vendorWhere.OR = [
        { vendorName: { contains: search, mode: 'insensitive' } },
        { vendorCode: { contains: search, mode: 'insensitive' } },
      ];
    }

    // 1. Get total count of matching vendors for pagination metadata
    const total = await this.prisma.vendor.count({ where: vendorWhere });

    // 2. Fetch only the paginated vendors
    const vendors = await this.prisma.vendor.findMany({
      where: vendorWhere,
      orderBy: { vendorCode: 'asc' },
      skip: (page - 1) * limit,
      take: limit,
    });

    if (vendors.length === 0) {
      return {
        data: [],
        meta: { total, page, limit, totalPages: 0 },
      };
    }

    const vendorIds = vendors.map((v) => v.id);

    // 3. Fetch aggregates grouped by vendorId, only for the paginated vendors
    const costSheetDateFilter: any = {};
    if (dateFrom) costSheetDateFilter.gte = new Date(dateFrom);
    if (dateTo) costSheetDateFilter.lte = new Date(dateTo);

    const costItemWhere: Prisma.CostItemWhereInput = {
      vendorId: { in: vendorIds },
      isDeleted: false,
      costSheet: {
        isDeleted: false,
        ...(dateFrom || dateTo ? { createdAt: costSheetDateFilter } : {}),
      },
    };

    const grouped = await this.prisma.costItem.groupBy({
      by: ['vendorId'],
      where: costItemWhere,
      _sum: {
        predictedAmount: true,
        actualAmount: true,
      },
      _count: {
        actualAmount: true,
        id: true,
      },
    });

    const groupedMap = new Map(grouped.map((g) => [g.vendorId, g]));

    const allReportItems: VendorPerformanceReportItem[] = vendors.map((v: any) => {
      const g = groupedMap.get(v.id);

      const totalCostItems = g ? g._count.id : 0;
      const predictedAmt = g && g._sum.predictedAmount ? Number(g._sum.predictedAmount) : 0;
      const actualAmt =
        g && (g._count.actualAmount ?? 0) > 0 && g._sum.actualAmount
          ? Number(g._sum.actualAmount)
          : null;
      const hasActuals = actualAmt !== null;

      const variance = hasActuals && actualAmt !== null ? actualAmt - predictedAmt : null;
      const variancePct =
        hasActuals && predictedAmt > 0 && variance !== null
          ? (variance / predictedAmt) * 100
          : null;

      return {
        vendorId: v.id,
        vendorCode: v.vendorCode,
        vendorName: v.vendorName,
        totalCostItems,
        totalPredictedAmount: predictedAmt,
        totalActualAmount: actualAmt,
        totalVariance: variance,
        variancePercentage: variancePct,
      };
    });

    const allowedSortFields = [
      'vendorCode',
      'vendorName',
      'totalCostItems',
      'totalPredictedAmount',
      'totalActualAmount',
      'totalVariance',
      'variancePercentage',
    ];
    const cleanSortBy = sortBy && allowedSortFields.includes(sortBy) ? sortBy : 'vendorCode';
    const isAsc = sortOrder.toLowerCase() === 'asc';

    allReportItems.sort((a: any, b: any) => {
      const valA = a[cleanSortBy];
      const valB = b[cleanSortBy];
      if (valA === null || valA === undefined) return isAsc ? 1 : -1;
      if (valB === null || valB === undefined) return isAsc ? -1 : 1;
      if (typeof valA === 'string' && typeof valB === 'string') {
        return isAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      return isAsc ? Number(valA) - Number(valB) : Number(valB) - Number(valA);
    });

    return {
      data: allReportItems,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * 8. Product Catalog Export
   */
  async getProductCatalog(
    user: any,
    query: ReportQueryDto,
  ): Promise<ReportResponse<ProductCatalogReportItem>> {
    this.checkReportAccess(user, 'product-catalog');
    const { page = 1, limit = 10, search, status, sortBy, sortOrder = 'asc' } = query;

    const where: Prisma.ProductWhereInput = { isDeleted: false };
    if (status) where.status = status as any;
    if (search) {
      where.OR = [
        { productName: { contains: search, mode: 'insensitive' } },
        { productCode: { contains: search, mode: 'insensitive' } },
      ];
    }

    const allowedSortFields = [
      'productCode',
      'productName',
      'drawingNumber',
      'revision',
      'status',
      'createdAt',
      'materialCount',
      'processCount',
      'activeIndentCount',
    ];
    const cleanSortBy = sortBy && allowedSortFields.includes(sortBy) ? sortBy : 'productCode';
    const isDirectDbSort = [
      'productCode',
      'productName',
      'drawingNumber',
      'revision',
      'status',
      'createdAt',
    ].includes(cleanSortBy);

    if (isDirectDbSort) {
      const [products, total] = await Promise.all([
        this.prisma.product.findMany({
          where,
          skip: (page - 1) * limit,
          take: limit,
          include: {
            productMaterials: { where: { isDeleted: false } },
            manufacturingProcesses: { where: { isDeleted: false } },
            indents: {
              where: {
                isDeleted: false,
                status: {
                  notIn: ['COMPLETED', 'CANCELLED', 'REJECTED'] as any,
                },
              },
            },
          },
          orderBy: { [cleanSortBy]: sortOrder.toLowerCase() as any },
        }),
        this.prisma.product.count({ where }),
      ]);

      const data = products.map((p: any) => ({
        id: p.id,
        productCode: p.productCode,
        productName: p.productName,
        drawingNumber: p.drawingNumber,
        revision: p.revision,
        status: p.status,
        materialCount: p.productMaterials.length,
        processCount: p.manufacturingProcesses.length,
        activeIndentCount: p.indents.length,
        createdAt: p.createdAt,
      }));

      return {
        data,
        meta: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    } else {
      // SQL-side counts instead of fetching full relation arrays for .length
      const products = await this.prisma.product.findMany({
        where,
        include: {
          _count: {
            select: {
              productMaterials: { where: { isDeleted: false } },
              manufacturingProcesses: { where: { isDeleted: false } },
              indents: {
                where: {
                  isDeleted: false,
                  status: { notIn: ['COMPLETED', 'CANCELLED', 'REJECTED'] as any },
                },
              },
            },
          },
        },
      });

      const mapped = products.map((p: any) => ({
        id: p.id,
        productCode: p.productCode,
        productName: p.productName,
        drawingNumber: p.drawingNumber,
        revision: p.revision,
        status: p.status,
        materialCount: p._count.productMaterials,
        processCount: p._count.manufacturingProcesses,
        activeIndentCount: p._count.indents,
        createdAt: p.createdAt,
      }));

      const isAsc = sortOrder.toLowerCase() === 'asc';
      mapped.sort((a: any, b: any) => {
        const valA = a[cleanSortBy];
        const valB = b[cleanSortBy];
        return isAsc ? valA - valB : valB - valA;
      });

      const total = mapped.length;
      const data = mapped.slice((page - 1) * limit, page * limit);

      return {
        data,
        meta: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    }
  }

  /**
   * 9. Workflow Bottleneck Analysis
   */
  async getWorkflowBottleneck(
    user: any,
    query: ReportQueryDto,
  ): Promise<ReportResponse<WorkflowBottleneckReportItem>> {
    this.checkReportAccess(user, 'workflow-bottleneck');
    const { page = 1, limit = 10, sortBy, sortOrder = 'asc', search, dateFrom, dateTo } = query;

    // SQL-side: use window functions to compute transition durations per stage
    // This replaces the unpaginated findMany + all-JS forEach/for/reduce pattern
    const dateFilter =
      dateFrom || dateTo
        ? Prisma.sql`AND i."createdAt" >= ${dateFrom ? new Date(dateFrom) : new Date('1970-01-01')} AND i."createdAt" <= ${dateTo ? new Date(dateTo) : new Date()}`
        : Prisma.empty;
    const searchFilter = search
      ? Prisma.sql`AND i."indentNumber" ILIKE ${`%${search}%`}`
      : Prisma.empty;

    const [stages, durationStats, activeCounts] = await Promise.all([
      this.prisma.workflowStage.findMany({
        where: { isDeleted: false },
        orderBy: { sequence: 'asc' },
      }),
      // Window function: LEAD computes next movedAt per indent, then GROUP BY stageId
      this.prisma.$queryRaw<
        {
          stageId: string;
          passedCount: number;
          averageDurationHours: number;
          maxDurationHours: number;
        }[]
      >`
        SELECT
          wh_inner."stageId",
          COUNT(*)::int AS "passedCount",
          ROUND(AVG(wh_inner.duration_hours)::numeric, 2)::float AS "averageDurationHours",
          ROUND(MAX(wh_inner.duration_hours)::numeric, 2)::float AS "maxDurationHours"
        FROM (
          SELECT
            wh."stageId",
            EXTRACT(EPOCH FROM (
              COALESCE(wh."nextMovedAt", NOW()) - wh."movedAt"
            )) / 3600 AS duration_hours
          FROM (
            SELECT
              "stageId",
              "indentId",
              "movedAt",
              LEAD("movedAt") OVER (PARTITION BY "indentId" ORDER BY "movedAt") AS "nextMovedAt"
            FROM "workflow_history"
            WHERE "isDeleted" = false
          ) wh
          INNER JOIN "indents" i ON i."id" = wh."indentId" AND i."isDeleted" = false
          WHERE wh."stageId" IS NOT NULL ${dateFilter} ${searchFilter}
        ) wh_inner
        GROUP BY wh_inner."stageId"
      `,
      // Active indent counts per current stage (separate lightweight query)
      this.prisma.$queryRaw<{ stageId: string; activeCount: number }[]>`
        SELECT "currentStageId" AS "stageId", COUNT(*)::int AS "activeCount"
        FROM "indents"
        WHERE "isDeleted" = false AND "currentStageId" IS NOT NULL ${dateFilter} ${searchFilter}
        GROUP BY "currentStageId"
      `,
    ]);

    // Build lookup maps for merging
    const durationMap = new Map(durationStats.map((r) => [r.stageId, r]));
    const activeMap = new Map(activeCounts.map((r) => [r.stageId, r.activeCount]));

    const allReportItems: WorkflowBottleneckReportItem[] = stages.map((s: any) => {
      const ds = durationMap.get(s.id);
      return {
        stageId: s.id,
        stageName: s.stageName,
        totalTransactionsPassed: ds?.passedCount ?? 0,
        averageDurationHours: ds?.averageDurationHours ?? 0,
        maxDurationHours: ds?.maxDurationHours ?? 0,
        activeTransactionsCount: activeMap.get(s.id) ?? 0,
      };
    });

    const allowedSortFields = [
      'stageName',
      'totalTransactionsPassed',
      'averageDurationHours',
      'maxDurationHours',
      'activeTransactionsCount',
    ];
    const cleanSortBy = sortBy && allowedSortFields.includes(sortBy) ? sortBy : 'stageName';
    const isAsc = sortOrder.toLowerCase() === 'asc';

    allReportItems.sort((a: any, b: any) => {
      const valA = a[cleanSortBy];
      const valB = b[cleanSortBy];
      if (valA === null || valA === undefined) return isAsc ? 1 : -1;
      if (valB === null || valB === undefined) return isAsc ? -1 : 1;
      if (typeof valA === 'string' && typeof valB === 'string') {
        return isAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      return isAsc ? Number(valA) - Number(valB) : Number(valB) - Number(valA);
    });

    const total = allReportItems.length;
    const paginatedItems = allReportItems.slice((page - 1) * limit, page * limit);

    return {
      data: paginatedItems,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
