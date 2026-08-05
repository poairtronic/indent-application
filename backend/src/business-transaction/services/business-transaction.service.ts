import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { BusinessTransactionValidator } from '../validators/business-transaction.validator';
import { WorkflowStateMachineService } from './workflow-state-machine.service';
import { BusinessTransactionEventService } from './business-transaction-event.service';
import { WorkflowStateMapper } from '../mappers/workflow-state.mapper';
import { WorkflowState, WorkflowLoop, AuditEventType } from '../enums/workflow-state.enum';
import { FileType } from '@prisma/client';
import * as path from 'path';
import { AttachmentStorageService, UploadedFileMetadata } from './attachment-storage.service';
import {
  CreateBusinessTransactionDto,
  UpdateBusinessTransactionDto,
} from '../dto/create-business-transaction.dto';
import { StoresIssueDto } from '../dto/stores-issue.dto';
import { ProductionUpdateDto, CustomerDeliveryDto } from '../dto/production-update.dto';

@Injectable()
export class BusinessTransactionService {
  private readonly logger = new Logger(BusinessTransactionService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly businessTransactionValidator: BusinessTransactionValidator,
    private readonly workflowStateMachine: WorkflowStateMachineService,
    private readonly eventService: BusinessTransactionEventService,
    private readonly attachmentStorage: AttachmentStorageService,
  ) {}

  /**
   * Helper to generate unique Indent and Cost Sheet numbers
   */
  private generateDocumentNumbers(): { indentNumber: string; costNumber: string } {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(1000 + Math.random() * 9000);
    return {
      indentNumber: `IND-${timestamp}-${random}`,
      costNumber: `PCS-${timestamp}-${random}`,
    };
  }

  private async resolveMaterial(
    tx: Pick<PrismaService, 'material'>,
    materialName: string,
    unitId: string,
    userId: string,
    index: number,
  ) {
    const normalizedName = materialName.trim();
    const existing = await tx.material.findFirst({
      where: { materialName: normalizedName, isDeleted: false },
    });
    if (existing) {
      return existing;
    }

    const uniqueSuffix = `${Date.now().toString().slice(-6)}-${index}`;
    return tx.material.create({
      data: {
        materialName: normalizedName,
        materialCode: `MAT-${uniqueSuffix}`,
        unitId,
        category: 'General',
        createdBy: userId,
      },
    });
  }

  /**
   * Create a new Business Transaction (Indent + Process Cost Sheet) in DRAFT state.
   */
  public async createTransaction(dto: CreateBusinessTransactionDto, userId: string): Promise<any> {
    const validationResult = this.businessTransactionValidator.validate(dto);
    if (!validationResult.isValid) {
      throw new BadRequestException(
        `Business Transaction validation failed: ${validationResult.errors.join(', ')}`,
      );
    }

    const { indentNumber, costNumber } = this.generateDocumentNumbers();
    const prismaDraftStatus = WorkflowStateMapper.toPrisma(WorkflowState.DRAFT);

    const result = await this.prisma.$transaction(async (tx) => {
      const productName = dto.indent.productName.trim();
      const departmentName = dto.indent.departmentName.trim();
      const uniqueSuffix = Date.now().toString().slice(-6);

      const product =
        (await tx.product.findFirst({ where: { productName, isDeleted: false } })) ??
        (await tx.product.create({
          data: {
            productName,
            productCode: `PRD-${uniqueSuffix}`,
            createdBy: userId,
          },
        }));
      const department =
        (await tx.department.findFirst({ where: { departmentName, isDeleted: false } })) ??
        (await tx.department.create({
          data: {
            departmentName,
            departmentCode: `DEP-${uniqueSuffix}`,
            createdBy: userId,
          },
        }));

      const resolvedMaterialIds: string[] = [];
      for (let i = 0; i < dto.indent.items.length; i++) {
        const item = dto.indent.items[i];
        const material = await this.resolveMaterial(tx, item.materialName, item.unitId, userId, i);
        resolvedMaterialIds.push(material.id);
      }

      // 1. Create Indent record
      const createdIndent = await tx.indent.create({
        data: {
          indentNumber,
          productId: product.id,
          departmentId: department.id,
          priority: dto.indent.priority,
          status: prismaDraftStatus,
          requiredDate: new Date(dto.indent.requiredDate),
          requiredDeliveryDate: dto.indent.requiredDeliveryDate
            ? new Date(dto.indent.requiredDeliveryDate)
            : null,
          purpose: dto.indent.purpose || null,
          remarks: dto.indent.remarks || null,
          createdBy: userId,
          version: 1,
          isLocked: false,
          indentItems: {
            create: dto.indent.items.map((item, index) => ({
              materialId: resolvedMaterialIds[index],
              quantity: item.quantity,
              unitId: item.unitId,
              remarks: item.remarks || null,
              status: 'DRAFT',
            })),
          },
        },
        include: {
          indentItems: true,
        },
      });

      // Attach IndentProcesses if specified
      for (let i = 0; i < dto.indent.items.length; i++) {
        const itemDto = dto.indent.items[i];
        const createdItem = createdIndent.indentItems[i];
        if (itemDto.processes && itemDto.processes.length > 0 && createdItem) {
          await tx.indentProcess.createMany({
            data: itemDto.processes.map((proc) => ({
              indentItemId: createdItem.id,
              processId: proc.processId,
              sequence: proc.sequence,
              estimatedHours: proc.estimatedHours,
            })),
          });
        }
      }

      // 2. Create CostSheet record linked to Indent
      const createdCostSheet = await tx.costSheet.create({
        data: {
          costNumber,
          indentId: createdIndent.id,
          preparedBy: userId,
          predictedTotal: dto.costSheet.predictedTotal,
          status: 'DRAFT',
          createdBy: userId,
          costItems: {
            create: dto.costSheet.costItems.map((ci, index) => ({
              materialId: resolvedMaterialIds[index],
              vendorId: ci.vendorId || null,
              predictedRate: ci.predictedRate,
              predictedQuantity: ci.predictedQuantity,
              predictedAmount: ci.predictedAmount,
              remarks: ci.remarks || null,
            })),
          },
          processCosts: {
            create: dto.costSheet.processCosts.map((pc) => ({
              processId: pc.processId,
              predictedCost: pc.predictedCost,
              estimatedHours: pc.estimatedHours,
            })),
          },
        },
      });

      // 3. Record initial WorkflowHistory
      await tx.workflowHistory.create({
        data: {
          indentId: createdIndent.id,
          toDepartmentId: department.id,
          movedBy: userId,
          remarks: 'Created initial Business Transaction draft.',
        },
      });

      return {
        indent: createdIndent,
        costSheet: createdCostSheet,
      };
    });

    // Log Audit
    await this.eventService.logAudit(AuditEventType.CREATE_DRAFT, result.indent.id, userId, null, {
      indentNumber,
      costNumber,
      status: WorkflowState.DRAFT,
    });

    return this.findTransactionById(result.indent.id);
  }

  /**
   * Find a single Business Transaction by ID
   */
  public async findTransactionById(id: string): Promise<any> {
    const indent = await this.prisma.indent.findUnique({
      where: { id },
      include: {
        product: true,
        department: true,
        creator: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        indentItems: {
          where: { isDeleted: false },
          include: {
            material: true,
            unit: true,
            indentProcesses: {
              include: { process: true },
            },
          },
        },
        attachments: { where: { isDeleted: false } },
        costSheet: {
          include: {
            costItems: { include: { material: true, vendor: true } },
            processCosts: { include: { process: true } },
          },
        },
        productionReceipt: {
          include: {
            receiver: { select: { id: true, firstName: true, lastName: true } },
          },
        },
        workflowHistory: {
          orderBy: { movedAt: 'desc' },
          include: {
            mover: { select: { id: true, firstName: true, lastName: true } },
            toDepartment: true,
          },
        },
      },
    });

    if (!indent) {
      throw new NotFoundException(`Business Transaction with ID '${id}' not found.`);
    }

    const domainState = WorkflowStateMapper.toDomain(indent.status, indent);
    const stageDef = this.workflowStateMachine.getStageDefinition(domainState);

    return {
      id: indent.id,
      indentNumber: indent.indentNumber,
      productId: indent.productId,
      productName: indent.product?.productName,
      departmentId: indent.departmentId,
      departmentName: indent.department?.departmentName,
      priority: indent.priority,
      currentState: domainState,
      currentLoop: stageDef ? stageDef.loop : WorkflowLoop.MANUFACTURING_LOOP,
      requiredDate: indent.requiredDate,
      requiredDeliveryDate: indent.requiredDeliveryDate,
      purpose: indent.purpose,
      remarks: indent.remarks,
      createdBy: indent.creator,
      createdAt: indent.createdAt,
      updatedAt: indent.updatedAt,
      items: indent.indentItems,
      attachments: indent.attachments.map((att: any) => {
        try {
          const meta = JSON.parse(att.fileName);
          return {
            id: att.id,
            fileName: meta.originalName || att.fileName,
            fileUrl: att.fileUrl,
            fileType: att.fileType,
            uploadedBy: att.uploadedBy,
            createdAt: att.createdAt,
            mimeType: meta.mimeType || 'application/octet-stream',
            fileSize: meta.fileSize || 0,
            department: meta.department || 'DESIGN',
            remarks: meta.remarks || '',
            costSheetId: meta.costSheetId || null,
            storageFileName: meta.storageFileName || att.fileName,
          };
        } catch {
          return att;
        }
      }),
      costSheet: indent.costSheet,
      productionReceipt: indent.productionReceipt,
      workflowHistory: indent.workflowHistory,
      allowedNextStates: stageDef ? stageDef.allowedNextStates : [],
    };
  }

  /**
   * List all Business Transactions with pagination and filters
   */
  public async findAllTransactions(query: {
    page?: number;
    limit?: number;
    state?: string;
    search?: string;
    departmentId?: string;
  }): Promise<any> {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(query.limit) || 10));
    const skip = (page - 1) * limit;

    const where: any = { isDeleted: false };

    if (query.departmentId) {
      where.departmentId = query.departmentId;
    }

    if (query.search) {
      where.OR = [
        { indentNumber: { contains: query.search, mode: 'insensitive' } },
        { purpose: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    if (query.state) {
      const prismaStatus = WorkflowStateMapper.toPrisma(query.state as WorkflowState);
      where.status = prismaStatus;
    }

    const [total, indents] = await Promise.all([
      this.prisma.indent.count({ where }),
      this.prisma.indent.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          product: { select: { productName: true, productCode: true } },
          department: { select: { departmentName: true, departmentCode: true } },
          creator: { select: { firstName: true, lastName: true } },
          costSheet: { select: { predictedTotal: true, costNumber: true } },
        },
      }),
    ]);

    const data = indents.map((indent) => {
      const domainState = WorkflowStateMapper.toDomain(indent.status, indent);
      const stageDef = this.workflowStateMachine.getStageDefinition(domainState);
      return {
        id: indent.id,
        indentNumber: indent.indentNumber,
        costNumber: indent.costSheet?.costNumber,
        productName: indent.product?.productName,
        departmentName: indent.department?.departmentName,
        priority: indent.priority,
        currentState: domainState,
        currentLoop: stageDef ? stageDef.loop : WorkflowLoop.MANUFACTURING_LOOP,
        predictedTotal: indent.costSheet?.predictedTotal || 0,
        creatorName: indent.creator
          ? `${indent.creator.firstName} ${indent.creator.lastName}`
          : 'N/A',
        createdAt: indent.createdAt,
        requiredDate: indent.requiredDate,
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
   * Update a Business Transaction draft
   */
  public async updateDraftTransaction(
    id: string,
    dto: UpdateBusinessTransactionDto,
    userId: string,
  ): Promise<any> {
    const existing = await this.findTransactionById(id);
    if (existing.currentState !== WorkflowState.DRAFT) {
      throw new BadRequestException(
        `Cannot edit Business Transaction in state '${existing.currentState}'. Only DRAFT transactions can be modified.`,
      );
    }

    await this.prisma.indent.update({
      where: { id },
      data: {
        priority: dto.indent?.priority || existing.priority,
        requiredDate: dto.indent?.requiredDate
          ? new Date(dto.indent.requiredDate)
          : existing.requiredDate,
        purpose: dto.indent?.purpose || existing.purpose,
        remarks: dto.indent?.remarks || existing.remarks,
        updatedBy: userId,
      },
    });

    await this.eventService.logAudit(
      AuditEventType.CREATE_DRAFT,
      id,
      userId,
      { priority: existing.priority },
      { priority: dto.indent?.priority || existing.priority },
    );

    return this.findTransactionById(id);
  }

  /**
   * STAGE 1 SUBMIT: Design department submits transaction (DRAFT -> DESIGN_COMPLETED)
   */
  public async submitDesign(id: string, userId: string, remarks?: string): Promise<any> {
    const txData = await this.findTransactionById(id);
    const targetState = WorkflowState.DESIGN_COMPLETED;

    // Validate transition
    const transitionValidation = this.workflowStateMachine.validateTransition(
      txData.currentState,
      targetState,
      'DESIGN',
    );
    if (!transitionValidation.isValid) {
      throw new BadRequestException(transitionValidation.errors.join(', '));
    }

    const prismaTargetStatus = WorkflowStateMapper.toPrisma(targetState);

    // Get Stores Department ID for workflow history
    const storesDept = await this.prisma.department.findFirst({
      where: { departmentCode: 'STORES', isDeleted: false },
    });

    await this.prisma.$transaction([
      this.prisma.indent.update({
        where: { id },
        data: {
          status: prismaTargetStatus,
          updatedBy: userId,
          remarks: remarks ? `${txData.remarks || ''}\nSubmit Notes: ${remarks}` : txData.remarks,
        },
      }),
      this.prisma.workflowHistory.create({
        data: {
          indentId: id,
          toDepartmentId: storesDept ? storesDept.id : txData.departmentId,
          movedBy: userId,
          remarks: remarks || 'Design completed and submitted to Stores.',
        },
      }),
    ]);

    // Dispatch Notifications & Audit
    await this.eventService.dispatchNotification(id, txData.indentNumber, targetState, userId);
    await this.eventService.logAudit(
      AuditEventType.SUBMIT_DESIGN,
      id,
      userId,
      { state: txData.currentState },
      { state: targetState },
    );

    return this.findTransactionById(id);
  }

  /**
   * STORES STOCK VERIFICATION: Checks material availability for Indent Items
   */
  public async storesVerifyStock(id: string, userId: string): Promise<any> {
    const txData = await this.findTransactionById(id);

    if (
      txData.currentState !== WorkflowState.DESIGN_COMPLETED &&
      txData.currentState !== WorkflowState.STORES_PROCESSING
    ) {
      throw new BadRequestException(
        `Stock verification not allowed in state '${txData.currentState}'. Must be DESIGN_COMPLETED or STORES_PROCESSING.`,
      );
    }

    const targetState = WorkflowState.STORES_PROCESSING;
    const prismaTargetStatus = WorkflowStateMapper.toPrisma(targetState);

    const storesDept = await this.prisma.department.findFirst({
      where: { departmentCode: 'STORES', isDeleted: false },
    });

    const verificationResults = await Promise.all(
      txData.items.map(async (item: any) => {
        const material = await this.prisma.material.findUnique({
          where: { id: item.materialId },
        });

        if (!material) {
          throw new NotFoundException(`Material with ID '${item.materialId}' not found.`);
        }

        const isAvailable = material.currentStock.greaterThanOrEqualTo(item.quantity);
        const status = isAvailable ? 'AVAILABLE' : 'TO_BE_PURCHASED';

        return {
          id: item.id,
          status,
          materialName: material.materialName,
          requested: item.quantity,
          availableStock: material.currentStock,
        };
      }),
    );

    const hasInsufficientStock = verificationResults.some((r) => r.status === 'TO_BE_PURCHASED');
    const verificationRemarks =
      `Stock Verification Results:\n` +
      verificationResults
        .map(
          (r) =>
            `- ${r.materialName}: Requested ${r.requested}, Stock ${r.availableStock} [${r.status}]`,
        )
        .join('\n');

    await this.prisma.$transaction(async (prisma) => {
      for (const res of verificationResults) {
        await prisma.indentItem.update({
          where: { id: res.id },
          data: { status: res.status },
        });
      }

      await prisma.indent.update({
        where: { id },
        data: {
          status: prismaTargetStatus,
          remarks: `${txData.remarks || ''}\n${verificationRemarks}`,
          updatedBy: userId,
        },
      });

      await prisma.workflowHistory.create({
        data: {
          indentId: id,
          toDepartmentId: storesDept ? storesDept.id : txData.departmentId,
          movedBy: userId,
          remarks: hasInsufficientStock
            ? 'Stock verification completed: Insufficient stock detected for one or more items.'
            : 'Stock verification completed: All materials are available in stock.',
        },
      });
    });

    await this.eventService.dispatchNotification(id, txData.indentNumber, targetState, userId);
    await this.eventService.logAudit(
      AuditEventType.STORES_ISSUE,
      id,
      userId,
      { state: txData.currentState },
      { state: targetState, verificationResults },
    );

    return this.findTransactionById(id);
  }

  /**
   * STORES MATERIAL ISSUE: Issues raw materials to Production and subtracts stock (STORES_PROCESSING -> MATERIALS_ISSUED)
   */
  public async storesIssueMaterials(id: string, userId: string, dto: StoresIssueDto): Promise<any> {
    const txData = await this.findTransactionById(id);
    const targetState = WorkflowState.MATERIALS_ISSUED;

    const transitionValidation = this.workflowStateMachine.validateTransition(
      txData.currentState,
      targetState,
      'STORES',
    );
    if (!transitionValidation.isValid) {
      throw new BadRequestException(transitionValidation.errors.join(', '));
    }

    const prismaTargetStatus = WorkflowStateMapper.toPrisma(targetState);

    const productionDept = await this.prisma.department.findFirst({
      where: { departmentCode: 'PRODUCTION', isDeleted: false },
    });

    await this.prisma.$transaction(async (prisma) => {
      for (const item of txData.items) {
        const material = await prisma.material.findUnique({
          where: { id: item.materialId },
        });

        if (!material) {
          throw new NotFoundException(`Material with ID '${item.materialId}' not found.`);
        }

        if (material.currentStock.lessThan(item.quantity)) {
          throw new BadRequestException(
            `Inventory is insufficient for material '${material.materialName}'. Verification/Purchasing is required. Required: ${item.quantity}, Available: ${material.currentStock}`,
          );
        }

        await prisma.material.update({
          where: { id: item.materialId },
          data: {
            currentStock: {
              decrement: item.quantity,
            },
          },
        });
      }

      const updatedRemarks = `${txData.remarks || ''}\n[MATERIALS_ISSUED] Materials issued from Stores. ${dto.remarks ? `Remarks: ${dto.remarks}` : ''}`;
      await prisma.indent.update({
        where: { id },
        data: {
          status: prismaTargetStatus,
          remarks: updatedRemarks,
          updatedBy: userId,
        },
      });

      await prisma.workflowHistory.create({
        data: {
          indentId: id,
          toDepartmentId: productionDept ? productionDept.id : txData.departmentId,
          movedBy: userId,
          remarks: dto.remarks || 'Stores issued raw materials and dispatched to Production.',
        },
      });
    });

    await this.eventService.dispatchNotification(id, txData.indentNumber, targetState, userId);
    await this.eventService.logAudit(
      AuditEventType.STORES_ISSUE,
      id,
      userId,
      { state: txData.currentState },
      { state: targetState, issueRemarks: dto.remarks },
    );

    return this.findTransactionById(id);
  }

  /**
   * ITEM-LEVEL STORES MATERIAL ISSUE: Issues a single raw material component item.
   * If all items in the indent are marked ISSUED, automatically triggers full stage completion & notifications.
   */
  public async issueSingleMaterialItem(id: string, itemId: string, userId: string): Promise<any> {
    const txData = await this.findTransactionById(id);

    const item = txData.items.find((i: any) => i.id === itemId);
    if (!item) {
      throw new NotFoundException(`Material item with ID '${itemId}' not found in indent '${id}'.`);
    }

    // 1. Update item status to ISSUED
    await this.prisma.indentItem.update({
      where: { id: itemId },
      data: { status: 'ISSUED' },
    });

    // 2. Decrement material stock if material exists
    await this.prisma.material
      .update({
        where: { id: item.materialId },
        data: {
          currentStock: {
            decrement: item.quantity,
          },
        },
      })
      .catch(() => {});

    // Fetch updated items
    const allItems = await this.prisma.indentItem.findMany({
      where: { indentId: id },
    });

    const allIssued = allItems.length > 0 && allItems.every((i) => i.status === 'ISSUED');

    if (allIssued) {
      // If all items are issued, transition state to MATERIALS_ISSUED and trigger full notification flow
      if (txData.currentState === WorkflowState.DESIGN_COMPLETED || txData.currentState === WorkflowState.STORES_PROCESSING) {
        return this.storesIssueMaterials(id, userId, {
          remarks: 'All material items have been issued individual component-by-component.',
        });
      }
    } else {
      // Move to STORES_PROCESSING if currently in DESIGN_COMPLETED
      if (txData.currentState === WorkflowState.DESIGN_COMPLETED) {
        const prismaStatus = WorkflowStateMapper.toPrisma(WorkflowState.STORES_PROCESSING);
        await this.prisma.indent.update({
          where: { id },
          data: { status: prismaStatus, updatedBy: userId },
        });
      }
    }

    return this.findTransactionById(id);
  }

  /**
   * PRODUCTION RECEIVE MATERIALS: Production confirms raw material receipt (MATERIALS_ISSUED -> PRODUCTION_PROCESSING)
   */
  public async productionReceiveMaterials(
    id: string,
    userId: string,
    remarks?: string,
  ): Promise<any> {
    const txData = await this.findTransactionById(id);
    const targetState = WorkflowState.PRODUCTION_PROCESSING;

    const transitionValidation = this.workflowStateMachine.validateTransition(
      txData.currentState,
      targetState,
      'PRODUCTION',
    );
    if (!transitionValidation.isValid) {
      throw new BadRequestException(transitionValidation.errors.join(', '));
    }

    const prismaTargetStatus = WorkflowStateMapper.toPrisma(targetState);

    await this.prisma.$transaction([
      this.prisma.indent.update({
        where: { id },
        data: {
          status: prismaTargetStatus,
          updatedBy: userId,
        },
      }),
      this.prisma.productionReceipt.upsert({
        where: { indentId: id },
        create: {
          indentId: id,
          receivedBy: userId,
          remarks: remarks || 'Raw materials received at Production work center.',
        },
        update: {
          receivedBy: userId,
          remarks: remarks || 'Raw materials receipt updated.',
        },
      }),
      this.prisma.workflowHistory.create({
        data: {
          indentId: id,
          toDepartmentId: txData.departmentId,
          movedBy: userId,
          remarks: remarks || 'Production work center received materials.',
        },
      }),
    ]);

    await this.eventService.dispatchNotification(id, txData.indentNumber, targetState, userId);
    await this.eventService.logAudit(
      AuditEventType.PRODUCTION_UPDATE,
      id,
      userId,
      { state: txData.currentState },
      { state: targetState, action: 'RECEIVE_MATERIALS' },
    );

    return this.findTransactionById(id);
  }

  /**
   * PRODUCTION START WORK: Production starts manufacturing operations
   */
  public async productionStartWork(id: string, userId: string, remarks?: string): Promise<any> {
    const txData = await this.findTransactionById(id);
    if (txData.currentState !== WorkflowState.PRODUCTION_PROCESSING) {
      throw new BadRequestException(
        `Production cannot start in state '${txData.currentState}'. Must be PRODUCTION_PROCESSING (materials received).`,
      );
    }

    const updatedRemarks = `${txData.remarks || ''}\n[PRODUCTION_STARTED] Manufacturing started at work center. ${remarks ? `Remarks: ${remarks}` : ''}`;

    await this.prisma.$transaction([
      this.prisma.indent.update({
        where: { id },
        data: {
          remarks: updatedRemarks,
          updatedBy: userId,
        },
      }),
      this.prisma.workflowHistory.create({
        data: {
          indentId: id,
          toDepartmentId: txData.departmentId,
          movedBy: userId,
          remarks: remarks || 'Production department started manufacturing processes.',
        },
      }),
    ]);

    await this.eventService.logAudit(
      AuditEventType.PRODUCTION_UPDATE,
      id,
      userId,
      { state: txData.currentState },
      { action: 'START_PRODUCTION', remarks },
    );

    return this.findTransactionById(id);
  }

  /**
   * PRODUCTION UPDATE PROGRESS: Updates status notes and logs updates
   */
  public async productionUpdateProgress(
    id: string,
    userId: string,
    dto: ProductionUpdateDto,
  ): Promise<any> {
    const txData = await this.findTransactionById(id);
    if (txData.currentState !== WorkflowState.PRODUCTION_PROCESSING) {
      throw new BadRequestException(
        `Production status updates allowed only in state PRODUCTION_PROCESSING. Current state: ${txData.currentState}`,
      );
    }

    const updatedRemarks = `${txData.remarks || ''}\n[${new Date().toISOString()}] Progress: ${dto.statusNotes}${dto.remarks ? ` (${dto.remarks})` : ''}`;

    await this.prisma.indent.update({
      where: { id },
      data: {
        remarks: updatedRemarks,
        updatedBy: userId,
      },
    });

    await this.eventService.logAudit(AuditEventType.PRODUCTION_UPDATE, id, userId, null, {
      statusNotes: dto.statusNotes,
      remarks: dto.remarks,
    });

    return this.findTransactionById(id);
  }

  /**
   * PRODUCTION COMPLETE WORK: Production completes manufacturing (PRODUCTION_PROCESSING -> PRODUCTION_COMPLETED)
   */
  public async productionCompleteWork(id: string, userId: string, remarks?: string): Promise<any> {
    const txData = await this.findTransactionById(id);
    const targetState = WorkflowState.PRODUCTION_COMPLETED;

    const transitionValidation = this.workflowStateMachine.validateTransition(
      txData.currentState,
      targetState,
      'PRODUCTION',
    );
    if (!transitionValidation.isValid) {
      throw new BadRequestException(transitionValidation.errors.join(', '));
    }

    const prismaTargetStatus = WorkflowStateMapper.toPrisma(targetState);

    await this.prisma.$transaction([
      this.prisma.indent.update({
        where: { id },
        data: {
          status: prismaTargetStatus,
          remarks: `${txData.remarks || ''}\n[PRODUCTION_COMPLETED] Manufacturing completed. ${remarks ? `Notes: ${remarks}` : ''}`,
          updatedBy: userId,
        },
      }),
      this.prisma.workflowHistory.create({
        data: {
          indentId: id,
          toDepartmentId: txData.departmentId,
          movedBy: userId,
          remarks: remarks || 'Production completed manufacturing.',
        },
      }),
    ]);

    await this.eventService.dispatchNotification(id, txData.indentNumber, targetState, userId);
    await this.eventService.logAudit(
      AuditEventType.PRODUCTION_UPDATE,
      id,
      userId,
      { state: txData.currentState },
      { state: targetState, remarks },
    );

    return this.findTransactionById(id);
  }

  /**
   * CUSTOMER DELIVERY: Confirms product delivery to customer (PRODUCTION_COMPLETED -> CUSTOMER_DELIVERED)
   * Completes Loop 1 (Manufacturing Workflow)!
   */
  public async deliverToCustomer(
    id: string,
    userId: string,
    dto: CustomerDeliveryDto,
  ): Promise<any> {
    const txData = await this.findTransactionById(id);
    const targetState = WorkflowState.CUSTOMER_DELIVERED;

    const transitionValidation = this.workflowStateMachine.validateTransition(
      txData.currentState,
      targetState,
      'PRODUCTION',
    );
    if (!transitionValidation.isValid) {
      throw new BadRequestException(transitionValidation.errors.join(', '));
    }

    const prismaTargetStatus = WorkflowStateMapper.toPrisma(targetState);

    const accountsDept = await this.prisma.department.findFirst({
      where: { departmentCode: 'ACCOUNTS', isDeleted: false },
    });

    await this.prisma.$transaction([
      this.prisma.indent.update({
        where: { id },
        data: {
          status: prismaTargetStatus,
          requiredDeliveryDate: new Date(dto.deliveryDate),
          updatedBy: userId,
          remarks: `${txData.remarks || ''}\nCustomer Delivery Notes: ${dto.deliveryNotes || 'Delivered'} (Ref: ${dto.customerReceiptReference || 'N/A'})`,
        },
      }),
      this.prisma.workflowHistory.create({
        data: {
          indentId: id,
          toDepartmentId: accountsDept ? accountsDept.id : txData.departmentId,
          movedBy: userId,
          remarks: `Finished goods delivered to customer on ${dto.deliveryDate}. Manufacturing Loop 1 complete.`,
        },
      }),
    ]);

    await this.eventService.dispatchNotification(id, txData.indentNumber, targetState, userId);
    await this.eventService.logAudit(
      AuditEventType.DELIVER_CUSTOMER,
      id,
      userId,
      { state: txData.currentState },
      {
        state: targetState,
        deliveryDate: dto.deliveryDate,
        reference: dto.customerReceiptReference,
      },
    );

    return this.findTransactionById(id);
  }

  // =========================================================================
  // LOOP 2: FINANCIAL WORKFLOW & ARCHIVAL METHODS
  // =========================================================================

  /**
   * STAGE 4 ACCOUNTS START: Start Accounts cost verification (CUSTOMER_DELIVERED -> ACCOUNTS_COST_VERIFICATION)
   */
  public async startAccountsVerification(
    id: string,
    userId: string,
    remarks?: string,
  ): Promise<any> {
    const txData = await this.findTransactionById(id);
    const targetState = WorkflowState.ACCOUNTS_COST_VERIFICATION;

    const transitionValidation = this.workflowStateMachine.validateTransition(
      txData.currentState,
      targetState,
      'ACCOUNTS',
    );
    if (!transitionValidation.isValid) {
      throw new BadRequestException(transitionValidation.errors.join(', '));
    }

    const prismaTargetStatus = WorkflowStateMapper.toPrisma(targetState);

    await this.prisma.$transaction([
      this.prisma.indent.update({
        where: { id },
        data: {
          status: prismaTargetStatus,
          updatedBy: userId,
          remarks: remarks
            ? `${txData.remarks || ''}\nAccounts Verification Notes: ${remarks}`
            : txData.remarks,
        },
      }),
      this.prisma.workflowHistory.create({
        data: {
          indentId: id,
          toDepartmentId: txData.departmentId,
          movedBy: userId,
          remarks: remarks || 'Accounts started actual cost verification.',
        },
      }),
    ]);

    await this.eventService.dispatchNotification(id, txData.indentNumber, targetState, userId);
    await this.eventService.logAudit(
      AuditEventType.VERIFY_COSTS,
      id,
      userId,
      { state: txData.currentState },
      { state: targetState },
    );

    return this.findTransactionById(id);
  }

  /**
   * STAGE 4 ACTUAL COST ENTRY: Accounts enters actual vendor and in-house process costs
   * Computes item variances, total actual cost, total variance amount, and variance percentage.
   * Transitions to ACTUAL_COST_UPDATED state.
   */
  public async enterActualCosts(id: string, userId: string, dto: any): Promise<any> {
    const txData = await this.findTransactionById(id);
    const targetState = WorkflowState.ACTUAL_COST_UPDATED;

    const transitionValidation = this.workflowStateMachine.validateTransition(
      txData.currentState,
      targetState,
      'ACCOUNTS',
    );
    if (!transitionValidation.isValid) {
      throw new BadRequestException(transitionValidation.errors.join(', '));
    }

    if (!txData.costSheet) {
      throw new NotFoundException(`Process Cost Sheet for Indent ID '${id}' not found.`);
    }

    const costSheetId = txData.costSheet.id;
    const prismaTargetStatus = WorkflowStateMapper.toPrisma(targetState);

    await this.prisma.$transaction(async (tx) => {
      let totalMaterialActual = 0;
      let totalProcessActual = 0;

      // 1. Update CostItems actual rate, quantity, and amount
      if (dto.costItems && dto.costItems.length > 0) {
        for (const ciDto of dto.costItems) {
          if ((ciDto.actualRate || 0) < 0 || (ciDto.actualQuantity || 0) < 0) {
            throw new BadRequestException('Actual rates and quantities must be non-negative.');
          }
          const actualAmount = (ciDto.actualRate || 0) * (ciDto.actualQuantity || 0);
          totalMaterialActual += actualAmount;
          await tx.costItem.update({
            where: { id: ciDto.costItemId },
            data: {
              actualRate: ciDto.actualRate,
              actualQuantity: ciDto.actualQuantity,
              actualAmount,
              remarks: ciDto.remarks || undefined,
              updatedBy: userId,
            },
          });
        }
      } else {
        const existingCostItems = await tx.costItem.findMany({
          where: { costSheetId },
        });
        totalMaterialActual = existingCostItems.reduce(
          (sum, item) => sum + Number(item.actualAmount || 0),
          0,
        );
      }

      // 2. Update ProcessCosts actual cost and actual hours
      if (dto.processCosts && dto.processCosts.length > 0) {
        for (const pcDto of dto.processCosts) {
          if ((pcDto.actualCost || 0) < 0 || (pcDto.actualHours || 0) < 0) {
            throw new BadRequestException('Actual costs and hours must be non-negative.');
          }
          totalProcessActual += pcDto.actualCost || 0;
          const existingPc = await tx.processCost.findUnique({
            where: { id: pcDto.processCostId },
          });
          const predicted = existingPc ? Number(existingPc.predictedCost) : 0;
          const variance = (pcDto.actualCost || 0) - predicted;

          await tx.processCost.update({
            where: { id: pcDto.processCostId },
            data: {
              actualCost: pcDto.actualCost,
              actualHours: pcDto.actualHours,
              variance,
              updatedBy: userId,
            },
          });
        }
      } else {
        const existingProcessCosts = await tx.processCost.findMany({
          where: { costSheetId },
        });
        totalProcessActual = existingProcessCosts.reduce(
          (sum, item) => sum + Number(item.actualCost || 0),
          0,
        );
      }

      // 3. Compute overall CostSheet actual total and variance
      const actualTotal = totalMaterialActual + totalProcessActual;
      const predictedTotal = Number(txData.costSheet.predictedTotal || 0);
      const varianceAmount = actualTotal - predictedTotal;
      const variancePercentage = predictedTotal > 0 ? (varianceAmount / predictedTotal) * 100 : 0;

      await tx.costSheet.update({
        where: { id: costSheetId },
        data: {
          actualTotal,
          varianceAmount,
          variancePercentage,
          updatedBy: userId,
        },
      });

      // 4. Update Indent state and append tag [ACTUAL_COST_UPDATED]
      const updatedRemarks = `${txData.remarks || ''}\n[ACTUAL_COST_UPDATED] Actual costs and variance calculations updated.`;
      await tx.indent.update({
        where: { id },
        data: {
          status: prismaTargetStatus,
          remarks: updatedRemarks,
          updatedBy: userId,
        },
      });

      // 5. Create workflow history record
      await tx.workflowHistory.create({
        data: {
          indentId: id,
          toDepartmentId: txData.departmentId,
          movedBy: userId,
          remarks: 'Accounts updated actual costs and process variances.',
        },
      });
    });

    await this.eventService.dispatchNotification(id, txData.indentNumber, targetState, userId);
    await this.eventService.logAudit(
      AuditEventType.VERIFY_COSTS,
      id,
      userId,
      { predictedTotal: txData.costSheet.predictedTotal },
      { actualCostEntered: true, costSheetId, state: targetState },
    );

    return this.findTransactionById(id);
  }

  /**
   * ACCOUNTS MATERIAL COST UPDATE: Updates single actual material item cost rate & quantity
   */
  public async updateMaterialActualCosts(
    id: string,
    userId: string,
    dto: { costItemId: string; actualRate: number; actualQuantity: number; remarks?: string },
  ): Promise<any> {
    const txData = await this.findTransactionById(id);

    if (
      txData.currentState !== WorkflowState.ACCOUNTS_COST_VERIFICATION &&
      txData.currentState !== WorkflowState.ACTUAL_COST_UPDATED
    ) {
      throw new BadRequestException(
        `Material actual cost updates allowed only in cost verification states. Current state: ${txData.currentState}`,
      );
    }

    if (dto.actualRate < 0 || dto.actualQuantity < 0) {
      throw new BadRequestException('Actual rates and quantities must be non-negative.');
    }

    if (!txData.costSheet) {
      throw new NotFoundException(`Process Cost Sheet for Indent ID '${id}' not found.`);
    }

    const costSheetId = txData.costSheet.id;

    await this.prisma.$transaction(async (tx) => {
      // 1. Update target CostItem
      const actualAmount = dto.actualRate * dto.actualQuantity;
      await tx.costItem.update({
        where: { id: dto.costItemId },
        data: {
          actualRate: dto.actualRate,
          actualQuantity: dto.actualQuantity,
          actualAmount,
          remarks: dto.remarks || undefined,
          updatedBy: userId,
        },
      });

      // 2. Fetch all materials and processes actual totals to recalculate
      const allCostItems = await tx.costItem.findMany({
        where: { costSheetId },
      });
      const allProcessCosts = await tx.processCost.findMany({
        where: { costSheetId },
      });

      const totalMaterialActual = allCostItems.reduce(
        (sum, item) => sum + Number(item.actualAmount || 0),
        0,
      );
      const totalProcessActual = allProcessCosts.reduce(
        (sum, item) => sum + Number(item.actualCost || 0),
        0,
      );

      const actualTotal = totalMaterialActual + totalProcessActual;
      const predictedTotal = Number(txData.costSheet.predictedTotal || 0);
      const varianceAmount = actualTotal - predictedTotal;
      const variancePercentage = predictedTotal > 0 ? (varianceAmount / predictedTotal) * 100 : 0;

      // 3. Update CostSheet calculations
      await tx.costSheet.update({
        where: { id: costSheetId },
        data: {
          actualTotal,
          varianceAmount,
          variancePercentage,
          updatedBy: userId,
        },
      });
    });

    await this.eventService.logAudit(
      AuditEventType.VERIFY_COSTS,
      id,
      userId,
      { costItemId: dto.costItemId },
      { actualRate: dto.actualRate, actualQuantity: dto.actualQuantity },
    );

    return this.findTransactionById(id);
  }

  /**
   * STAGE 4 FINANCIAL CLOSURE: Finalize cost sheet and close financial records (ACTUAL_COST_UPDATED -> ACCOUNTS_FINANCIAL_CLOSURE)
   */
  public async financialClosure(id: string, userId: string, dto: any): Promise<any> {
    const txData = await this.findTransactionById(id);
    const targetState = WorkflowState.ACCOUNTS_FINANCIAL_CLOSURE;

    const transitionValidation = this.workflowStateMachine.validateTransition(
      txData.currentState,
      targetState,
      'ACCOUNTS',
    );
    if (!transitionValidation.isValid) {
      throw new BadRequestException(transitionValidation.errors.join(', '));
    }

    const prismaTargetStatus = WorkflowStateMapper.toPrisma(targetState);

    await this.prisma.$transaction([
      this.prisma.indent.update({
        where: { id },
        data: {
          status: prismaTargetStatus,
          updatedBy: userId,
          remarks: dto.closureNotes
            ? `${txData.remarks || ''}\nFinancial Closure Notes: ${dto.closureNotes}`
            : txData.remarks,
        },
      }),
      this.prisma.costSheet.update({
        where: { id: txData.costSheet.id },
        data: {
          status: 'FINALIZED',
          updatedBy: userId,
        },
      }),
      this.prisma.workflowHistory.create({
        data: {
          indentId: id,
          toDepartmentId: txData.departmentId,
          movedBy: userId,
          remarks:
            dto.closureNotes || 'Accounts finalized financial records and variance calculation.',
        },
      }),
    ]);

    await this.eventService.dispatchNotification(id, txData.indentNumber, targetState, userId);
    await this.eventService.logAudit(
      AuditEventType.FINANCIAL_CLOSURE,
      id,
      userId,
      { state: txData.currentState },
      { state: targetState, costSheetStatus: 'FINALIZED' },
    );

    return this.findTransactionById(id);
  }

  /**
   * STAGE 5 ARCHIVE: System / Admin archives transaction (ACCOUNTS_FINANCIAL_CLOSURE -> ARCHIVED)
   */
  public async archiveTransaction(id: string, userId: string, remarks?: string): Promise<any> {
    const txData = await this.findTransactionById(id);
    const targetState = WorkflowState.ARCHIVED;

    const transitionValidation = this.workflowStateMachine.validateTransition(
      txData.currentState,
      targetState,
      'SYSTEM',
    );
    if (!transitionValidation.isValid) {
      throw new BadRequestException(transitionValidation.errors.join(', '));
    }

    const prismaTargetStatus = WorkflowStateMapper.toPrisma(targetState);

    await this.prisma.$transaction([
      this.prisma.indent.update({
        where: { id },
        data: {
          status: prismaTargetStatus,
          isLocked: true, // Lock record against edits
          updatedBy: userId,
        },
      }),
      this.prisma.workflowHistory.create({
        data: {
          indentId: id,
          toDepartmentId: txData.departmentId,
          movedBy: userId,
          remarks: remarks || 'Automated archival completed. Record locked.',
        },
      }),
    ]);

    await this.eventService.dispatchNotification(id, txData.indentNumber, targetState, userId);
    await this.eventService.logAudit(
      AuditEventType.ARCHIVE_TRANSACTION,
      id,
      userId,
      { state: txData.currentState, isLocked: false },
      { state: targetState, isLocked: true },
    );

    return this.findTransactionById(id);
  }

  /**
   * STAGE 5 COMPLETE: Complete Business Transaction across both loops (ARCHIVED -> COMPLETED)
   */
  public async completeTransaction(id: string, userId: string, remarks?: string): Promise<any> {
    const txData = await this.findTransactionById(id);
    const targetState = WorkflowState.COMPLETED;

    const transitionValidation = this.workflowStateMachine.validateTransition(
      txData.currentState,
      targetState,
      'SYSTEM',
    );
    if (!transitionValidation.isValid) {
      throw new BadRequestException(transitionValidation.errors.join(', '));
    }

    const prismaTargetStatus = WorkflowStateMapper.toPrisma(targetState);

    await this.prisma.$transaction([
      this.prisma.indent.update({
        where: { id },
        data: {
          status: prismaTargetStatus,
          isLocked: true,
          updatedBy: userId,
        },
      }),
      this.prisma.workflowHistory.create({
        data: {
          indentId: id,
          toDepartmentId: txData.departmentId,
          movedBy: userId,
          remarks: remarks || 'Business Transaction fully completed across Loop 1 and Loop 2.',
        },
      }),
    ]);

    await this.eventService.dispatchNotification(id, txData.indentNumber, targetState, userId);
    await this.eventService.logAudit(
      AuditEventType.ARCHIVE_TRANSACTION,
      id,
      userId,
      { state: txData.currentState },
      { state: targetState, businessTransactionCompleted: true },
    );

    return this.findTransactionById(id);
  }

  /**
   * Add drawing or document attachment to draft Indent Sheet
   */
  public async addAttachmentToIndent(id: string, dto: any, userId: string): Promise<any> {
    const txData = await this.findTransactionById(id);
    if (txData.currentState !== WorkflowState.DRAFT) {
      throw new BadRequestException(
        `Cannot add attachments in state '${txData.currentState}'. Design fields are locked.`,
      );
    }

    await this.prisma.indentAttachment.create({
      data: {
        indentId: id,
        fileName: dto.fileName,
        fileUrl: dto.fileUrl,
        fileType: dto.fileType,
        uploadedBy: userId,
        createdBy: userId,
      },
    });

    await this.eventService.logAudit(AuditEventType.CREATE_DRAFT, id, userId, null, {
      addedAttachment: dto.fileName,
    });

    return this.findTransactionById(id);
  }

  /**
   * Soft-delete drawing or document attachment from draft Indent Sheet
   */
  public async removeAttachmentFromIndent(
    id: string,
    attachmentId: string,
    userId: string,
  ): Promise<any> {
    const txData = await this.findTransactionById(id);
    if (txData.currentState !== WorkflowState.DRAFT) {
      throw new BadRequestException(
        `Cannot remove attachments in state '${txData.currentState}'. Design fields are locked.`,
      );
    }

    const attachment = await this.prisma.indentAttachment.findUnique({
      where: { id: attachmentId },
    });

    if (!attachment || attachment.indentId !== id || attachment.isDeleted) {
      throw new NotFoundException(`Attachment with ID '${attachmentId}' not found.`);
    }

    await this.prisma.indentAttachment.update({
      where: { id: attachmentId },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
        deletedBy: userId,
      },
    });

    await this.eventService.logAudit(
      AuditEventType.CREATE_DRAFT,
      id,
      userId,
      { removedAttachment: attachment.fileName },
      null,
    );

    return this.findTransactionById(id);
  }

  /**
   * Upload drawing/invoice attachment to Business Transaction, Indent, or Cost Sheet
   */
  public async uploadAttachmentToIndent(
    id: string,
    file: UploadedFileMetadata,
    userId: string,
    remarks?: string,
  ): Promise<any> {
    const txData = await this.findTransactionById(id);

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { department: true },
    });

    if (!user || !user.department) {
      throw new ForbiddenException('User department not found.');
    }

    const departmentCode = user.department.departmentCode;

    const MAX_SIZE = 10 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      throw new BadRequestException('File size exceeds the maximum limit of 10MB.');
    }

    const ext = path.extname(file.originalname).toLowerCase();
    let fileType: FileType = FileType.OTHER;

    if (departmentCode === 'DESIGN') {
      if (txData.currentState !== WorkflowState.DRAFT) {
        throw new BadRequestException('Design uploads allowed only in DRAFT state.');
      }
      const allowedExtensions = ['.pdf', '.xlsx', '.xls', '.jpg', '.jpeg', '.png', '.dwg', '.dxf'];
      if (!allowedExtensions.includes(ext)) {
        throw new BadRequestException(`Extension '${ext}' not supported for Design uploads.`);
      }

      if (ext === '.pdf') fileType = FileType.PDF;
      else if (ext === '.xlsx' || ext === '.xls') fileType = FileType.EXCEL;
      else if (ext === '.jpg' || ext === '.jpeg' || ext === '.png') fileType = FileType.IMAGE;
      else if (ext === '.dwg' || ext === '.dxf') fileType = FileType.CAD;
    } else if (departmentCode === 'ACCOUNTS') {
      if (
        txData.currentState !== WorkflowState.ACCOUNTS_COST_VERIFICATION &&
        txData.currentState !== WorkflowState.ACTUAL_COST_UPDATED
      ) {
        throw new BadRequestException('Accounts uploads allowed only in cost verification states.');
      }
      const allowedExtensions = ['.pdf', '.xlsx', '.xls'];
      if (!allowedExtensions.includes(ext)) {
        throw new BadRequestException(`Extension '${ext}' not supported for Accounts uploads.`);
      }

      if (ext === '.pdf') fileType = FileType.PDF;
      else if (ext === '.xlsx' || ext === '.xls') fileType = FileType.EXCEL;
    } else {
      throw new ForbiddenException(
        `Department '${departmentCode}' is not authorized to upload attachments.`,
      );
    }

    const saved = await this.attachmentStorage.saveFile(file);

    const meta = {
      originalName: file.originalname,
      mimeType: file.mimetype,
      fileSize: file.size,
      department: departmentCode,
      remarks: remarks || '',
      costSheetId: txData.costSheet ? txData.costSheet.id : null,
      storageFileName: saved.fileName,
    };

    await this.prisma.indentAttachment.create({
      data: {
        indentId: id,
        fileName: JSON.stringify(meta),
        fileUrl: saved.fileUrl,
        fileType,
        uploadedBy: userId,
        createdBy: userId,
      },
    });

    await this.eventService.logAudit(AuditEventType.PRODUCTION_UPDATE, id, userId, null, {
      uploadedAttachment: file.originalname,
      fileType,
      department: departmentCode,
    });

    try {
      const recipientUsers = await this.prisma.user.findMany({
        where: {
          isDeleted: false,
          status: 'ACTIVE',
          role: {
            roleName: {
              in: ['Senior Manager', 'General Manager'],
            },
          },
        },
        select: { id: true },
      });

      const uniqueUserIds = Array.from(new Set(recipientUsers.map((u) => u.id)));
      if (uniqueUserIds.length > 0) {
        const title =
          departmentCode === 'DESIGN' ? 'Design Drawing Uploaded' : 'Vendor Bill/Invoice Uploaded';
        const msg = `User has uploaded attachment '${file.originalname}' for Indent #${txData.indentNumber}.`;

        await this.prisma.notification.create({
          data: {
            title,
            message: msg,
            type: 'INFO',
            priority: 'MEDIUM',
            referenceId: id,
            referenceModule: 'Indent',
            createdBy: userId,
            recipients: {
              create: uniqueUserIds.map((uId) => ({
                userId: uId,
                isRead: false,
                deliveryStatus: 'DELIVERED',
              })),
            },
          },
        });
      }
    } catch (notifErr) {
      this.logger.error(`Failed to send attachment upload notification: ${notifErr.message}`);
    }

    return this.findTransactionById(id);
  }

  /**
   * Delete attachment (marks isDeleted = true and removes physical file)
   */
  public async deleteAttachment(id: string, attachmentId: string, userId: string): Promise<any> {
    const txData = await this.findTransactionById(id);

    const attachment = await this.prisma.indentAttachment.findUnique({
      where: { id: attachmentId },
    });

    if (!attachment || attachment.indentId !== id || attachment.isDeleted) {
      throw new NotFoundException(`Attachment with ID '${attachmentId}' not found.`);
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { department: true },
    });
    if (!user || !user.department) {
      throw new ForbiddenException('User department not found.');
    }

    const departmentCode = user.department.departmentCode;

    let storageFileName = attachment.fileName;
    try {
      const meta = JSON.parse(attachment.fileName);
      storageFileName = meta.storageFileName;

      if (meta.department === 'DESIGN') {
        if (departmentCode !== 'DESIGN') {
          throw new ForbiddenException('Only Design department can delete design files.');
        }
        if (txData.currentState !== WorkflowState.DRAFT) {
          throw new BadRequestException('Cannot delete Design files after submission.');
        }
      }
      if (meta.department === 'ACCOUNTS') {
        if (departmentCode !== 'ACCOUNTS') {
          throw new ForbiddenException('Only Accounts department can delete financial files.');
        }
        if (
          txData.currentState !== WorkflowState.ACCOUNTS_COST_VERIFICATION &&
          txData.currentState !== WorkflowState.ACTUAL_COST_UPDATED
        ) {
          throw new BadRequestException(
            'Cannot delete Accounts files outside verification states.',
          );
        }
      }
    } catch (err) {
      if (err instanceof ForbiddenException || err instanceof BadRequestException) {
        throw err;
      }
      if (txData.currentState !== WorkflowState.DRAFT) {
        throw new BadRequestException('Design files are locked post-submission.');
      }
    }

    await this.attachmentStorage.deleteFile(storageFileName);

    await this.prisma.indentAttachment.update({
      where: { id: attachmentId },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
        deletedBy: userId,
      },
    });

    await this.eventService.logAudit(
      AuditEventType.PRODUCTION_UPDATE,
      id,
      userId,
      { deletedAttachment: attachment.id },
      { action: 'DOCUMENT_DELETE', attachmentId },
    );

    try {
      const recipientUsers = await this.prisma.user.findMany({
        where: {
          isDeleted: false,
          status: 'ACTIVE',
          role: {
            roleName: {
              in: ['Senior Manager', 'General Manager'],
            },
          },
        },
        select: { id: true },
      });

      const uniqueUserIds = Array.from(new Set(recipientUsers.map((u: any) => u.id)));
      if (uniqueUserIds.length > 0) {
        let metaName = attachment.fileName;
        try {
          const meta = JSON.parse(attachment.fileName);
          metaName = meta.originalName;
        } catch {
          void 0;
        }

        await this.prisma.notification.create({
          data: {
            title: 'Document Deleted',
            message: `Document '${metaName}' has been deleted from Indent #${txData.indentNumber}.`,
            type: 'WARNING',
            priority: 'HIGH',
            referenceId: id,
            referenceModule: 'Indent',
            createdBy: userId,
            recipients: {
              create: uniqueUserIds.map((uId) => ({
                userId: uId,
                isRead: false,
                deliveryStatus: 'DELIVERED',
              })),
            },
          },
        });
      }
    } catch (notifErr) {
      this.logger.error(`Failed to send document delete notification: ${notifErr.message}`);
    }

    return this.findTransactionById(id);
  }

  /**
   * Get physical file path for download
   */
  public async getAttachmentFilePath(fileName: string): Promise<string> {
    return this.attachmentStorage.getFilePath(fileName);
  }

  /**
   * Search and filter attachments across all business transactions
   */
  public async searchAttachments(query: any): Promise<any[]> {
    const whereClause: any = {
      isDeleted: false,
    };

    if (query.businessTransactionId) {
      whereClause.indentId = query.businessTransactionId;
    }
    if (query.documentType) {
      whereClause.fileType = query.documentType;
    }
    if (query.uploadedBy) {
      whereClause.uploadedBy = query.uploadedBy;
    }
    if (query.uploadDate) {
      const date = new Date(query.uploadDate);
      if (!isNaN(date.getTime())) {
        const startOfDay = new Date(date.setHours(0, 0, 0, 0));
        const endOfDay = new Date(date.setHours(23, 59, 59, 999));
        whereClause.createdAt = {
          gte: startOfDay,
          lte: endOfDay,
        };
      }
    }

    const dbAttachments = await this.prisma.indentAttachment.findMany({
      where: whereClause,
      include: {
        uploader: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
    });

    const parsed = dbAttachments.map((att: any) => {
      try {
        const meta = JSON.parse(att.fileName);
        return {
          id: att.id,
          fileName: meta.originalName || att.fileName,
          fileUrl: att.fileUrl,
          fileType: att.fileType,
          uploadedBy: att.uploader,
          createdAt: att.createdAt,
          mimeType: meta.mimeType || 'application/octet-stream',
          fileSize: meta.fileSize || 0,
          department: meta.department || 'DESIGN',
          remarks: meta.remarks || '',
          costSheetId: meta.costSheetId || null,
          storageFileName: meta.storageFileName || att.fileName,
        };
      } catch {
        return {
          id: att.id,
          fileName: att.fileName,
          fileUrl: att.fileUrl,
          fileType: att.fileType,
          uploadedBy: att.uploader,
          createdAt: att.createdAt,
          mimeType: 'application/octet-stream',
          fileSize: 0,
          department: 'DESIGN',
          remarks: '',
          costSheetId: null,
          storageFileName: att.fileName,
        };
      }
    });

    return parsed.filter((att) => {
      if (query.costSheetId && att.costSheetId !== query.costSheetId) {
        return false;
      }
      if (query.department && att.department.toLowerCase() !== query.department.toLowerCase()) {
        return false;
      }
      if (query.fileName && !att.fileName.toLowerCase().includes(query.fileName.toLowerCase())) {
        return false;
      }
      return true;
    });
  }

  /**
   * Log document download action in audit logs
   */
  public async logDocumentDownload(storageFileName: string, userId: string): Promise<void> {
    try {
      const atts = await this.prisma.indentAttachment.findMany({
        where: {
          fileName: {
            contains: storageFileName,
          },
          isDeleted: false,
        },
      });

      if (atts.length > 0) {
        const att = atts[0];
        let originalName = storageFileName;
        try {
          const meta = JSON.parse(att.fileName);
          originalName = meta.originalName;
        } catch {
          void 0;
        }

        await this.eventService.logAudit(
          AuditEventType.PRODUCTION_UPDATE,
          att.indentId,
          userId,
          null,
          {
            action: 'DOCUMENT_DOWNLOAD',
            fileName: originalName,
            attachmentId: att.id,
          },
        );
      }
    } catch (err) {
      this.logger.error(`Failed to log document download audit event: ${err.message}`);
    }
  }

  /**
   * Generate document statistics and summary for a Business Transaction
   */
  public async getAttachmentSummary(id: string): Promise<any> {
    const tx = await this.findTransactionById(id);

    let totalDocs = 0;
    let designDocs = 0;
    let accountsDocs = 0;
    let cadFiles = 0;
    let pdfFiles = 0;
    let excelFiles = 0;
    let imageFiles = 0;
    let otherFiles = 0;
    let totalSize = 0;

    tx.attachments.forEach((att: any) => {
      totalDocs++;

      if (att.department === 'DESIGN') {
        designDocs++;
      } else if (att.department === 'ACCOUNTS') {
        accountsDocs++;
      }

      if (att.fileType === FileType.CAD) cadFiles++;
      else if (att.fileType === FileType.PDF) pdfFiles++;
      else if (att.fileType === FileType.EXCEL) excelFiles++;
      else if (att.fileType === FileType.IMAGE) imageFiles++;
      else otherFiles++;

      totalSize += att.fileSize || 0;
    });

    return {
      businessTransactionId: id,
      indentNumber: tx.indentNumber,
      totalDocuments: totalDocs,
      designDocuments: designDocs,
      accountsDocuments: accountsDocs,
      cadFiles,
      pdfFiles,
      excelFiles,
      imageFiles,
      otherFiles,
      totalFileSize: totalSize,
    };
  }

  /**
   * Get audit log history for a specific attachment
   */
  public async getAttachmentHistory(id: string, attachmentId: string): Promise<any[]> {
    const attachment = await this.prisma.indentAttachment.findUnique({
      where: { id: attachmentId },
    });
    if (!attachment || attachment.indentId !== id) {
      throw new NotFoundException('Attachment not found.');
    }

    const logs = await this.prisma.auditLog.findMany({
      where: {
        recordId: id,
      },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const attachmentLogs = logs.filter((log: any) => {
      const val = log.newValue ? (log.newValue as any) : {};
      const oldVal = log.oldValue ? (log.oldValue as any) : {};
      return (
        val.attachmentId === attachmentId ||
        val.deletedAttachment === attachmentId ||
        oldVal.deletedAttachment === attachmentId ||
        val.replacedAttachmentId === attachmentId ||
        (val.uploadedAttachment && val.uploadedAttachment === attachment.fileName)
      );
    });

    return attachmentLogs.map((log: any) => {
      const val = log.newValue ? (log.newValue as any) : {};
      return {
        action: val.action || log.action,
        performedBy: log.user,
        timestamp: log.createdAt,
        details: val,
      };
    });
  }

  /**
   * Replace an existing attachment with a new file
   */
  public async replaceAttachment(
    id: string,
    attachmentId: string,
    file: UploadedFileMetadata,
    userId: string,
    remarks?: string,
  ): Promise<any> {
    const txData = await this.findTransactionById(id);

    const attachment = await this.prisma.indentAttachment.findUnique({
      where: { id: attachmentId },
    });

    if (!attachment || attachment.indentId !== id || attachment.isDeleted) {
      throw new NotFoundException(`Attachment with ID '${attachmentId}' not found.`);
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { department: true },
    });
    if (!user || !user.department) {
      throw new ForbiddenException('User department not found.');
    }

    const departmentCode = user.department.departmentCode;

    let oldMeta: any = {};
    try {
      oldMeta = JSON.parse(attachment.fileName);
    } catch {
      oldMeta = { department: 'DESIGN', storageFileName: attachment.fileName };
    }

    if (oldMeta.department === 'DESIGN') {
      if (departmentCode !== 'DESIGN') {
        throw new ForbiddenException('Only Design department can replace design files.');
      }
      if (txData.currentState !== WorkflowState.DRAFT) {
        throw new BadRequestException('Cannot replace Design files after submission.');
      }
    } else if (oldMeta.department === 'ACCOUNTS') {
      if (departmentCode !== 'ACCOUNTS') {
        throw new ForbiddenException('Only Accounts department can replace financial files.');
      }
      if (
        txData.currentState !== WorkflowState.ACCOUNTS_COST_VERIFICATION &&
        txData.currentState !== WorkflowState.ACTUAL_COST_UPDATED
      ) {
        throw new BadRequestException('Cannot replace Accounts files outside verification states.');
      }
    }

    const MAX_SIZE = 10 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      throw new BadRequestException('File size exceeds the maximum limit of 10MB.');
    }

    const ext = path.extname(file.originalname).toLowerCase();
    const designExtensions = ['.pdf', '.xlsx', '.xls', '.jpg', '.jpeg', '.png', '.dwg', '.dxf'];
    const accountsExtensions = ['.pdf', '.xlsx', '.xls'];

    if (oldMeta.department === 'DESIGN' && !designExtensions.includes(ext)) {
      throw new BadRequestException(`Extension '${ext}' not supported for Design replace.`);
    }
    if (oldMeta.department === 'ACCOUNTS' && !accountsExtensions.includes(ext)) {
      throw new BadRequestException(`Extension '${ext}' not supported for Accounts replace.`);
    }

    await this.attachmentStorage.deleteFile(oldMeta.storageFileName || attachment.fileName);

    const saved = await this.attachmentStorage.saveFile(file);

    const newMeta = {
      originalName: file.originalname,
      mimeType: file.mimetype,
      fileSize: file.size,
      department: oldMeta.department,
      remarks: remarks || oldMeta.remarks || '',
      costSheetId: oldMeta.costSheetId,
      storageFileName: saved.fileName,
    };

    await this.prisma.indentAttachment.update({
      where: { id: attachmentId },
      data: {
        fileName: JSON.stringify(newMeta),
        fileUrl: saved.fileUrl,
        uploadedBy: userId,
      },
    });

    await this.eventService.logAudit(
      AuditEventType.PRODUCTION_UPDATE,
      id,
      userId,
      { oldFileName: oldMeta.originalName || attachment.fileName },
      {
        action: 'DOCUMENT_REPLACE',
        replacedAttachmentId: attachmentId,
        newFileName: file.originalname,
      },
    );

    try {
      const recipientUsers = await this.prisma.user.findMany({
        where: {
          isDeleted: false,
          status: 'ACTIVE',
          role: {
            roleName: {
              in: ['Senior Manager', 'General Manager'],
            },
          },
        },
        select: { id: true },
      });

      const uniqueUserIds = Array.from(new Set(recipientUsers.map((u) => u.id)));
      if (uniqueUserIds.length > 0) {
        await this.prisma.notification.create({
          data: {
            title: 'Document Replaced',
            message: `Document '${oldMeta.originalName || attachment.fileName}' has been replaced with '${file.originalname}' on Indent #${txData.indentNumber}.`,
            type: 'INFO',
            priority: 'MEDIUM',
            referenceId: id,
            referenceModule: 'Indent',
            createdBy: userId,
            recipients: {
              create: uniqueUserIds.map((uId) => ({
                userId: uId,
                isRead: false,
                deliveryStatus: 'DELIVERED',
              })),
            },
          },
        });
      }
    } catch (notifErr) {
      this.logger.error(`Failed to send document replace notification: ${notifErr.message}`);
    }

    return this.findTransactionById(id);
  }
}
