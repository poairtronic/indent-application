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
            cell.numFmt = '$#,##0.00';
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
      align?: 'left' | 'center' | 'right';
      type?: 'string' | 'number' | 'date' | 'currency' | 'percentage';
    }[],
    queryParams: any,
  ) {
    const isLandscape = columns.length > 6;
    const doc = new PDFDocument({
      size: 'A4',
      layout: isLandscape ? 'landscape' : 'portrait',
      margin: 30,
      bufferPages: true,
    });

    doc.pipe(res);

    // Header Title
    doc
      .fillColor('#1E293B')
      .rect(30, 30, doc.page.width - 60, 40)
      .fill();
    doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(14).text(`IMCMS - ${title}`, 40, 44);

    // Meta Info
    doc.fillColor('#334155').font('Helvetica-Bold').fontSize(9).text('Generated At:', 30, 85);
    doc.font('Helvetica').text(new Date().toISOString().replace('T', ' ').slice(0, 19), 110, 85);

    doc.font('Helvetica-Bold').text('Filters Applied:', 30, 100);
    const filterText =
      Object.entries(queryParams)
        .filter(([k, v]) => v && !['page', 'limit', 'sortBy', 'sortOrder', 'format'].includes(k))
        .map(([k, v]) => `${k}: ${v}`)
        .join(', ') || 'None';
    doc.font('Helvetica').text(filterText, 110, 100, { width: doc.page.width - 150 });

    doc.moveDown(2);

    let startY = 130;
    const colWidth = (doc.page.width - 60) / columns.length;

    const drawHeader = (y: number) => {
      doc
        .fillColor('#334155')
        .rect(30, y, doc.page.width - 60, 20)
        .fill();
      doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(8);
      columns.forEach((col, idx) => {
        doc.text(col.header, 35 + idx * colWidth, y + 6, {
          width: colWidth - 10,
          align: col.align || 'left',
        });
      });
    };

    drawHeader(startY);
    startY += 20;

    doc.fillColor('#000000').font('Helvetica').fontSize(8);
    let currentY = startY;

    data.forEach((row, rowIdx) => {
      if (currentY > doc.page.height - 50) {
        doc.addPage({
          size: 'A4',
          layout: isLandscape ? 'landscape' : 'portrait',
          margin: 30,
        });
        currentY = 40;
        drawHeader(currentY);
        currentY += 20;
        doc.fillColor('#000000').font('Helvetica').fontSize(8);
      }

      if (rowIdx % 2 === 1) {
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
          val = `$${val.toFixed(2)}`;
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
    const { page = 1, limit = 10 } = query;
    return {
      data: [],
      meta: {
        total: 0,
        page,
        limit,
        totalPages: 0,
      },
      isDatabaseGap: true,
      gapMessage:
        'Yield data unavailable — required process input/output tracking fields are not stored in the database.',
      missingFields: [
        'IndentProcess.inputQuantity (Decimal)',
        'IndentProcess.outputQuantity (Decimal)',
        'IndentProcess.scrapQuantity (Decimal)',
      ],
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
    const { page = 1, limit = 10 } = query;
    return {
      data: [],
      meta: {
        total: 0,
        page,
        limit,
        totalPages: 0,
      },
      isDatabaseGap: true,
      gapMessage:
        'Machine utilization data unavailable — required source tables (e.g. Machine, MachineLog, MachineOperatingTime) are not stored in the database.',
      missingFields: [
        'Machine model (id, machineCode, machineName, status)',
        'MachineLog model (machineId, processId, operatingHours, downtimeHours)',
      ],
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

    const costItems = await this.prisma.costItem.findMany({
      where,
      include: {
        material: true,
      },
    });

    // Group in memory to compute aggregates per material
    const materialMap = new Map<
      string,
      {
        materialCode: string;
        materialName: string;
        category: string;
        predQty: Prisma.Decimal;
        actQty: Prisma.Decimal;
        predAmt: Prisma.Decimal;
        actAmt: Prisma.Decimal;
        hasActuals: boolean;
      }
    >();

    costItems.forEach((ci: any) => {
      const mId = ci.materialId;
      if (!materialMap.has(mId)) {
        materialMap.set(mId, {
          materialCode: ci.material.materialCode,
          materialName: ci.material.materialName,
          category: ci.material.category,
          predQty: new Prisma.Decimal(0),
          actQty: new Prisma.Decimal(0),
          predAmt: new Prisma.Decimal(0),
          actAmt: new Prisma.Decimal(0),
          hasActuals: false,
        });
      }

      const entry = materialMap.get(mId)!;
      entry.predQty = entry.predQty.add(ci.predictedQuantity);
      entry.predAmt = entry.predAmt.add(ci.predictedAmount);

      if (ci.actualQuantity !== null && ci.actualAmount !== null) {
        entry.actQty = entry.actQty.add(ci.actualQuantity);
        entry.actAmt = entry.actAmt.add(ci.actualAmount);
        entry.hasActuals = true;
      }
    });

    const allGroupedItems = Array.from(materialMap.entries()).map(
      ([materialId, data]: [string, any]) => {
        const variance = data.hasActuals ? data.actAmt.sub(data.predAmt) : null;
        return {
          materialId,
          materialCode: data.materialCode,
          materialName: data.materialName,
          category: data.category,
          totalPredictedQty: Number(data.predQty),
          totalActualQty: data.hasActuals ? Number(data.actQty) : null,
          totalPredictedAmount: Number(data.predAmt),
          totalActualAmount: data.hasActuals ? Number(data.actAmt) : null,
          varianceAmount: variance !== null ? Number(variance) : null,
        };
      },
    );

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
    const { page = 1, limit = 10 } = query;
    return {
      data: [],
      meta: {
        total: 0,
        page,
        limit,
        totalPages: 0,
      },
      isDatabaseGap: true,
      gapMessage:
        'Budget data unavailable — required department budget models or budget fields are not stored in the database.',
      missingFields: [
        'Department.budgetLimit (Decimal)',
        'DepartmentBudget model (id, departmentId, fiscalYear, budgetAmount, allocatedAmount)',
      ],
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

    const vendors = await this.prisma.vendor.findMany({
      where: vendorWhere,
      orderBy: { vendorCode: 'asc' },
    });

    const vendorIds = vendors.map((v: any) => v.id);

    const costItems = await this.prisma.costItem.findMany({
      where: {
        vendorId: { in: vendorIds },
        isDeleted: false,
        costSheet: {
          isDeleted: false,
          ...(dateFrom || dateTo
            ? {
                createdAt: {
                  ...(dateFrom ? { gte: new Date(dateFrom) } : {}),
                  ...(dateTo ? { lte: new Date(dateTo) } : {}),
                },
              }
            : {}),
        },
      },
    });

    const allReportItems: VendorPerformanceReportItem[] = vendors.map((v: any) => {
      const related = costItems.filter((ci: any) => ci.vendorId === v.id);
      let predicted = new Prisma.Decimal(0);
      let actual = new Prisma.Decimal(0);
      let hasActuals = false;

      related.forEach((ci: any) => {
        predicted = predicted.add(ci.predictedAmount);
        if (ci.actualAmount !== null) {
          actual = actual.add(ci.actualAmount);
          hasActuals = true;
        }
      });

      const variance = hasActuals ? actual.sub(predicted) : null;
      const variancePct = hasActuals && predicted.gt(0) ? variance!.div(predicted).mul(100) : null;

      return {
        vendorId: v.id,
        vendorCode: v.vendorCode,
        vendorName: v.vendorName,
        totalCostItems: related.length,
        totalPredictedAmount: Number(predicted),
        totalActualAmount: hasActuals ? Number(actual) : null,
        totalVariance: variance !== null ? Number(variance) : null,
        variancePercentage: variancePct !== null ? Number(variancePct) : null,
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
      const products = await this.prisma.product.findMany({
        where,
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
      });

      const mapped = products.map((p: any) => ({
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

    const [stages, indents] = await Promise.all([
      this.prisma.workflowStage.findMany({
        where: { isDeleted: false },
        orderBy: { sequence: 'asc' },
      }),
      this.prisma.indent.findMany({
        where: {
          isDeleted: false,
          ...(dateFrom || dateTo
            ? {
                createdAt: {
                  ...(dateFrom ? { gte: new Date(dateFrom) } : {}),
                  ...(dateTo ? { lte: new Date(dateTo) } : {}),
                },
              }
            : {}),
          ...(search
            ? {
                indentNumber: { contains: search, mode: 'insensitive' },
              }
            : {}),
        },
        include: {
          workflowHistory: {
            where: { isDeleted: false },
            orderBy: { movedAt: 'asc' },
          },
        },
      }),
    ]);

    // In-memory calculations of stage transitions
    const stageStatsMap = new Map<
      string,
      {
        stageName: string;
        durations: number[]; // in hours
        activeCount: number;
        passedCount: number;
      }
    >();

    stages.forEach((s: any) => {
      stageStatsMap.set(s.id, {
        stageName: s.stageName,
        durations: [],
        activeCount: 0,
        passedCount: 0,
      });
    });

    indents.forEach((indent: any) => {
      const history = indent.workflowHistory;
      if (history.length === 0) return;

      for (let i = 0; i < history.length; i++) {
        const current = history[i];
        const next = history[i + 1];

        if (!current.stageId) continue;
        const stats = stageStatsMap.get(current.stageId);
        if (!stats) continue;

        stats.passedCount++;

        const start = new Date(current.movedAt).getTime();
        const end = next ? new Date(next.movedAt).getTime() : Date.now();
        const durationHours = (end - start) / (1000 * 60 * 60);

        stats.durations.push(durationHours);
      }

      if (indent.currentStageId) {
        const activeStats = stageStatsMap.get(indent.currentStageId);
        if (activeStats) {
          activeStats.activeCount++;
        }
      }
    });

    const allReportItems: WorkflowBottleneckReportItem[] = stages.map((s: any) => {
      const stats = stageStatsMap.get(s.id)!;
      const totalDurations = stats.durations.reduce((sum: number, d: number) => sum + d, 0);
      const averageDuration =
        stats.durations.length > 0 ? totalDurations / stats.durations.length : 0;
      const maxDuration = stats.durations.length > 0 ? Math.max(...stats.durations) : 0;

      return {
        stageId: s.id,
        stageName: s.stageName,
        totalTransactionsPassed: stats.passedCount,
        averageDurationHours: Math.round(averageDuration * 100) / 100,
        maxDurationHours: Math.round(maxDuration * 100) / 100,
        activeTransactionsCount: stats.activeCount,
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
