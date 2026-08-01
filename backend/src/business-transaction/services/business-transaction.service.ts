import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { BusinessTransactionValidator } from '../validators/business-transaction.validator';
import { WorkflowStateMachineService } from './workflow-state-machine.service';
import { BusinessTransactionEventService } from './business-transaction-event.service';
import { WorkflowStateMapper } from '../mappers/workflow-state.mapper';
import { WorkflowState, WorkflowLoop, AuditEventType } from '../enums/workflow-state.enum';
import {
  CreateBusinessTransactionDto,
  UpdateBusinessTransactionDto,
} from '../dto/create-business-transaction.dto';
import { StoresIssueDto } from '../dto/stores-issue.dto';
import { ProductionUpdateDto, CustomerDeliveryDto } from '../dto/production-update.dto';

@Injectable()
export class BusinessTransactionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly businessTransactionValidator: BusinessTransactionValidator,
    private readonly workflowStateMachine: WorkflowStateMachineService,
    private readonly eventService: BusinessTransactionEventService,
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
      // 1. Create Indent record
      const createdIndent = await tx.indent.create({
        data: {
          indentNumber,
          productId: dto.indent.productId,
          departmentId: dto.indent.departmentId,
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
            create: dto.indent.items.map((item) => ({
              materialId: item.materialId,
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
            create: dto.costSheet.costItems.map((ci) => ({
              materialId: ci.materialId,
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
          toDepartmentId: dto.indent.departmentId,
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
      attachments: indent.attachments,
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
}
