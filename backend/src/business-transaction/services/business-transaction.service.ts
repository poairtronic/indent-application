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

    const domainState = WorkflowStateMapper.toDomain(indent.status);
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
      const domainState = WorkflowStateMapper.toDomain(indent.status);
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
   * STAGE 2 STORES ISSUE: Stores department verifies stock & issues materials (DESIGN_COMPLETED -> STORES_PROCESSING)
   */
  public async storesIssueMaterials(id: string, userId: string, dto: StoresIssueDto): Promise<any> {
    const txData = await this.findTransactionById(id);
    const targetState = WorkflowState.STORES_PROCESSING;

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

    await this.prisma.$transaction([
      this.prisma.indent.update({
        where: { id },
        data: {
          status: prismaTargetStatus,
          updatedBy: userId,
          remarks: dto.remarks
            ? `${txData.remarks || ''}\nStores Issue Notes: ${dto.remarks}`
            : txData.remarks,
        },
      }),
      this.prisma.workflowHistory.create({
        data: {
          indentId: id,
          toDepartmentId: productionDept ? productionDept.id : txData.departmentId,
          movedBy: userId,
          remarks: dto.remarks || 'Stores issued raw materials and dispatched to Production.',
        },
      }),
    ]);

    // Dispatch Notifications & Audit
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
   * STAGE 3 PRODUCTION RECEIVE: Production confirms material receipt (STORES_PROCESSING -> PRODUCTION_PROCESSING)
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

    // Dispatch Notifications & Audit
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
   * STAGE 3 PRODUCTION UPDATE: Record manufacturing progress notes
   */
  public async productionUpdateStatus(
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
    });

    return this.findTransactionById(id);
  }

  /**
   * STAGE 3 CUSTOMER DELIVERY: Production confirms delivery to customer (PRODUCTION_PROCESSING -> CUSTOMER_DELIVERED)
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

    // Dispatch Notifications & Audit
    await this.eventService.dispatchNotification(id, txData.indentNumber, targetState, userId);
    await this.eventService.logAudit(
      AuditEventType.DELIVER_CUSTOMER,
      id,
      userId,
      { state: txData.currentState },
      { state: targetState, deliveryDate: dto.deliveryDate, loop1Completed: true },
    );

    return this.findTransactionById(id);
  }
}
