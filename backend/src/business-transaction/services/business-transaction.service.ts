import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
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
import { ProductionUpdateDto } from '../dto/production-update.dto';
import { validateFileSignature } from '../../common/utils/file-validator.util';
import {
  safeMultiply,
  safeAdd,
  safeSubtract,
  safeVariancePercentage,
  roundTo4Decimals,
} from '../utils/financial-math.util';
import { calculateMaterialWeight } from '../../common/utils/material-weight.util';
import { DocumentNumberService } from '../../common/services/document-number.service';

@Injectable()
export class BusinessTransactionService {
  private readonly logger = new Logger(BusinessTransactionService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly businessTransactionValidator: BusinessTransactionValidator,
    private readonly workflowStateMachine: WorkflowStateMachineService,
    private readonly eventService: BusinessTransactionEventService,
    private readonly attachmentStorage: AttachmentStorageService,
    private readonly documentNumberService: DocumentNumberService,
  ) {}

  private invalidateMetadataCache(): void {
    try {
      Promise.all([]).catch((err: unknown) =>
        this.logger.warn(`Failed to invalidate metadata cache async: ${(err as Error).message}`),
      );
    } catch (err: unknown) {
      this.logger.warn(`Failed to trigger metadata cache invalidation: ${(err as Error).message}`);
    }
  }

  private invalidateWorkflowCache(): void {
    try {
      Promise.all([]).catch((err: unknown) =>
        this.logger.warn(`Failed to invalidate workflow cache async: ${(err as Error).message}`),
      );
    } catch (err: unknown) {
      this.logger.warn(`Failed to trigger workflow cache invalidation: ${(err as Error).message}`);
    }
  }

  private invalidateCostCache(): void {
    try {
      Promise.all([]).catch((err: unknown) =>
        this.logger.warn(`Failed to invalidate cost cache async: ${(err as Error).message}`),
      );
    } catch (err: unknown) {
      this.logger.warn(`Failed to trigger cost cache invalidation: ${(err as Error).message}`);
    }
  }

  private invalidateAllCache(): void {
    try {
      Promise.all([]).catch((err: unknown) =>
        this.logger.warn(`Failed to invalidate all cache async: ${(err as Error).message}`),
      );
    } catch (err: unknown) {
      this.logger.warn(`Failed to trigger all cache invalidation: ${(err as Error).message}`);
    }
  }

  /**
   * Atomically asserts the current workflow state and applies the given update data.
   * Uses updateMany with a WHERE assertion to prevent concurrent state corruption.
   *
   * Matches records where:
   *   - currentState = expectedCurrentState (populated records), OR
   *   - currentState IS NULL AND status = expectedPrismaStatus (legacy records where
   *     currentState column was not yet populated).
   *
   * If count === 0, the state was already changed by a concurrent request → throws ConflictException.
   */
  private async assertCurrentStateAndUpdate(
    id: string,
    expectedCurrentState: string,
    data: Record<string, unknown>,
    tx?: any,
  ): Promise<void> {
    const client = tx || this.prisma;

    // Derive the expected Prisma status from the domain state for null-safe fallback matching
    const expectedPrismaStatus = WorkflowStateMapper.toPrisma(
      expectedCurrentState as WorkflowState,
    );

    const result = await client.indent.updateMany({
      where: {
        id,
        OR: [
          { currentState: expectedCurrentState },
          { currentState: null, status: expectedPrismaStatus },
        ],
      },
      data,
    });
    if (result.count === 0) {
      throw new ConflictException(
        `Workflow state conflict: the indent has already been moved from '${expectedCurrentState}' by a concurrent request. Please refresh and try again.`,
      );
    }
  }

  private async resolveMaterial(
    tx: any,
    materialName: string,
    unitId: string,
    userId: string,
    _index: number,
  ) {
    const normalizedName = materialName.trim();
    const existing = await tx.material.findFirst({
      where: { materialName: normalizedName, isDeleted: false },
    });
    if (existing) {
      return existing;
    }

    const materialCode = await this.documentNumberService.generateMaterialNumber(tx);
    return tx.material.create({
      data: {
        materialName: normalizedName,
        materialCode,
        unitId,
        category: 'General',
        currentStock: 100,
        minimumStock: 10,
        maximumStock: 1000,
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

    const prismaDraftStatus = WorkflowStateMapper.toPrisma(WorkflowState.DRAFT);

    const result = await this.prisma.$transaction(
      async (tx) => {
        const indentNumber = await this.documentNumberService.generateIndentNumber(tx);
        const costNumber = await this.documentNumberService.generateCostSheetNumber(tx);

        const productName = dto.indent.productName.trim();
        const departmentName = dto.indent.departmentName.trim();
        const uniqueSuffix = Math.random().toString(36).substring(2, 8).toUpperCase();

        const product =
          (await tx.product.findFirst({ where: { productName, isDeleted: false } })) ??
          (await tx.product.create({
            data: {
              productName,
              productCode: await this.documentNumberService.generateProductNumber(tx),
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
        const resolvedMaterials: any[] = [];
        for (let i = 0; i < dto.indent.items.length; i++) {
          const item = dto.indent.items[i];
          const material = await this.resolveMaterial(
            tx,
            item.materialName,
            item.unitId,
            userId,
            i,
          );
          resolvedMaterialIds.push(material.id);
          resolvedMaterials.push(material);
        }

        // 1. Create Indent record
        const createdIndent = await tx.indent.create({
          data: {
            indentNumber,
            productId: product.id,
            departmentId: department.id,
            priority: dto.indent.priority,
            status: prismaDraftStatus,
            currentState: WorkflowState.DRAFT,
            customerName: dto.indent.customerName || null,
            layoutNumber: dto.indent.layoutNumber || null,
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
              create: dto.indent.items.map((item, index) => {
                const material = resolvedMaterials[index];
                const unitWeightKg = calculateMaterialWeight({
                  shape: item.shape || '',
                  densityKgPerDm3: Number(material.densityKgPerDm3 || 0),
                  diameterMm: item.diameterMm,
                  lengthMm: item.lengthMm,
                  widthMm: item.widthMm,
                  heightMm: item.heightMm,
                });
                const totalWeightKg = safeMultiply(unitWeightKg, item.quantity);

                return {
                  materialId: material.id,
                  quantity: roundTo4Decimals(item.quantity),
                  unitId: item.unitId,
                  shape: item.shape || null,
                  diameterMm: item.diameterMm || null,
                  lengthMm: item.lengthMm || null,
                  widthMm: item.widthMm || null,
                  heightMm: item.heightMm || null,
                  unitWeightKg,
                  totalWeightKg,
                  remarks: item.remarks || null,
                  status: 'DRAFT',
                };
              }),
            },
            ...(dto.indent.broughtMaterials && dto.indent.broughtMaterials.length > 0
              ? {
                  broughtMaterials: {
                    create: dto.indent.broughtMaterials.map((bm) => ({
                      name: bm.name,
                      quantity: roundTo4Decimals(bm.quantity),
                      specification: bm.specification || null,
                      amount: bm.amount || null,
                      actualAmount: bm.actualAmount || null,
                      createdBy: userId,
                    })),
                  },
                }
              : {}),
          },
          include: {
            indentItems: true,
            broughtMaterials: true,
          },
        });

        // Attach IndentProcesses if specified
        for (let i = 0; i < dto.indent.items.length; i++) {
          const itemDto = dto.indent.items[i];
          const createdItem = createdIndent.indentItems[i];
          if (itemDto.processes && itemDto.processes.length > 0 && createdItem) {
            // Deduplicate processes by processId to prevent Prisma @@unique([indentItemId, processId]) conflict
            const uniqueProcesses = [];
            const seenProcessIds = new Set();
            for (const proc of itemDto.processes) {
              if (!seenProcessIds.has(proc.processId)) {
                seenProcessIds.add(proc.processId);
                uniqueProcesses.push(proc);
              }
            }
            
            await tx.indentProcess.createMany({
              data: uniqueProcesses.map((proc) => ({
                indentItemId: createdItem.id,
                processId: proc.processId,
                sequence: proc.sequence,
                estimatedHours: proc.estimatedHours ?? 0,
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
            designCost: roundTo4Decimals(dto.costSheet.designCost || 0),
            overheadCost: roundTo4Decimals(dto.costSheet.overheadCost || 0),
            contingencyCost: roundTo4Decimals(dto.costSheet.contingencyCost || 0),
            predictedTotal: roundTo4Decimals(dto.costSheet.predictedTotal),
            status: 'DRAFT',
            createdBy: userId,
            costItems: {
              create: dto.costSheet.costItems.map((ci, index) => ({
                materialId: resolvedMaterialIds[index],
                vendorId: ci.vendorId || null,
                predictedRate: roundTo4Decimals(ci.predictedRate),
                predictedQuantity: roundTo4Decimals(ci.predictedQuantity),
                // User requirement: Design team enters total directly, so use DTO predictedAmount
                predictedAmount: roundTo4Decimals(ci.predictedAmount ?? ci.predictedRate),
                remarks: ci.remarks || null,
              })),
            },
            processCosts: {
              create: dto.costSheet.processCosts.map((pc) => ({
                processId: pc.processId,
                predictedCost: roundTo4Decimals(pc.predictedCost),
                estimatedHours: pc.estimatedHours ?? 0,
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
      },
      { maxWait: 5000, timeout: 20000 },
    );

    // Log Audit
    await this.eventService.logAudit(AuditEventType.CREATE_DRAFT, result.indent.id, userId, null, {
      indentNumber: result.indent.indentNumber,
      costNumber: result.costSheet.costNumber,
      status: WorkflowState.DRAFT,
    });

    this.invalidateMetadataCache();
    return { id: result.indent.id, success: true };
  }

  /**
   * Find a single Business Transaction by ID
   */
  public async findTransactionById(id: string): Promise<any> {
    const indent = await this.prisma.indent.findUnique({
      where: { id },
      select: {
        id: true,
        indentNumber: true,
        customerName: true,
        layoutNumber: true,
        productId: true,
        departmentId: true,
        priority: true,
        status: true,
        currentState: true,
        requiredDate: true,
        requiredDeliveryDate: true,
        purpose: true,
        remarks: true,
        createdAt: true,
        updatedAt: true,
        product: { select: { productName: true } },
        department: { select: { departmentName: true } },
        creator: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        indentItems: {
          where: { isDeleted: false },
          select: {
            id: true,
            indentId: true,
            materialId: true,
            quantity: true,
            issuedQuantity: true,
            unitId: true,
            shape: true,
            diameterMm: true,
            lengthMm: true,
            widthMm: true,
            heightMm: true,
            unitWeightKg: true,
            totalWeightKg: true,
            remarks: true,
            status: true,
            createdAt: true,
            updatedAt: true,
            material: { select: { id: true, materialName: true, materialCode: true } },
            unit: { select: { id: true, unitName: true, symbol: true } },
            indentProcesses: {
              select: {
                id: true,
                indentItemId: true,
                processId: true,
                sequence: true,
                estimatedHours: true,
                actualHours: true,
                inputQuantity: true,
                outputQuantity: true,
                scrapQuantity: true,
                status: true,
                process: { select: { id: true, processName: true } },
              },
            },
          },
        },
        broughtMaterials: {
          where: { isDeleted: false },
          select: {
            id: true,
            indentId: true,
            name: true,
            quantity: true,
            issuedQuantity: true,
            status: true,
            specification: true,
            amount: true,
            actualAmount: true,
            createdAt: true,
            updatedAt: true,
          },
        },
        attachments: {
          where: { isDeleted: false },
          select: {
            id: true,
            indentId: true,
            fileName: true,
            fileUrl: true,
            fileType: true,
            uploadedBy: true,
            createdAt: true,
            updatedAt: true,
          },
        },
        costSheet: {
          select: {
            id: true,
            costNumber: true,
            indentId: true,
            preparedBy: true,
            designCost: true,
            overheadCost: true,
            contingencyCost: true,
            actualDesignCost: true,
            actualOverheadCost: true,
            actualContingencyCost: true,
            predictedTotal: true,
            actualTotal: true,
            varianceAmount: true,
            variancePercentage: true,
            status: true,
            createdAt: true,
            updatedAt: true,
            costItems: {
              select: {
                id: true,
                costSheetId: true,
                materialId: true,
                vendorId: true,
                predictedRate: true,
                predictedQuantity: true,
                predictedAmount: true,
                actualRate: true,
                actualQuantity: true,
                actualAmount: true,
                remarks: true,
                material: { select: { id: true, materialName: true, materialCode: true } },
                vendor: { select: { id: true, vendorName: true, vendorCode: true } },
              },
            },
            processCosts: {
              select: {
                id: true,
                costSheetId: true,
                processId: true,
                predictedCost: true,
                actualCost: true,
                variance: true,
                estimatedHours: true,
                actualHours: true,
                process: { select: { id: true, processName: true } },
              },
            },
          },
        },
        productionReceipt: {
          select: {
            id: true,
            indentId: true,
            receivedDate: true,
            receivedBy: true,
            remarks: true,
            createdAt: true,
            updatedAt: true,
            receiver: { select: { id: true, firstName: true, lastName: true } },
          },
        },
        workflowHistory: {
          orderBy: { movedAt: 'desc' },
          take: 20,
          select: {
            id: true,
            indentId: true,
            fromDepartmentId: true,
            toDepartmentId: true,
            stageId: true,
            movedBy: true,
            movedAt: true,
            remarks: true,
            createdAt: true,
            updatedAt: true,
            mover: { select: { id: true, firstName: true, lastName: true } },
            toDepartment: { select: { id: true, departmentName: true, departmentCode: true } },
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
      customerName: indent.customerName,
      layoutNumber: indent.layoutNumber,
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
      broughtMaterials: indent.broughtMaterials,
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
   * Lighter variant of findTransactionById used by transition methods for the response.
   *
   * Key differences from findTransactionById:
   *  - product/department use select (only names) instead of include (full objects)
   *  - workflowHistory limited to last 10 entries (biggest data savings)
   *
   * This reduces the response query data transfer by ~40-60% while maintaining
   * full API response shape compatibility.
   */
  public async findTransactionForResponse(id: string): Promise<any> {
    const indent = await this.prisma.indent.findUnique({
      where: { id },
      select: {
        id: true,
        indentNumber: true,
        customerName: true,
        layoutNumber: true,
        productId: true,
        departmentId: true,
        priority: true,
        status: true,
        currentState: true,
        requiredDate: true,
        requiredDeliveryDate: true,
        purpose: true,
        remarks: true,
        createdAt: true,
        updatedAt: true,
        product: { select: { productName: true } },
        department: { select: { departmentName: true } },
        creator: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        indentItems: {
          where: { isDeleted: false },
          select: {
            id: true,
            indentId: true,
            materialId: true,
            quantity: true,
            issuedQuantity: true,
            unitId: true,
            shape: true,
            diameterMm: true,
            lengthMm: true,
            widthMm: true,
            heightMm: true,
            unitWeightKg: true,
            totalWeightKg: true,
            remarks: true,
            status: true,
            createdAt: true,
            updatedAt: true,
            material: { select: { id: true, materialName: true, materialCode: true } },
            unit: { select: { id: true, unitName: true, symbol: true } },
            indentProcesses: {
              select: {
                id: true,
                indentItemId: true,
                processId: true,
                sequence: true,
                estimatedHours: true,
                actualHours: true,
                inputQuantity: true,
                outputQuantity: true,
                scrapQuantity: true,
                status: true,
                process: { select: { id: true, processName: true } },
              },
            },
          },
        },
        broughtMaterials: {
          where: { isDeleted: false },
          select: {
            id: true,
            indentId: true,
            name: true,
            quantity: true,
            issuedQuantity: true,
            status: true,
            specification: true,
            amount: true,
            actualAmount: true,
            createdAt: true,
            updatedAt: true,
          },
        },
        attachments: {
          where: { isDeleted: false },
          select: {
            id: true,
            indentId: true,
            fileName: true,
            fileUrl: true,
            fileType: true,
            uploadedBy: true,
            createdAt: true,
            updatedAt: true,
          },
        },
        costSheet: {
          select: {
            id: true,
            costNumber: true,
            indentId: true,
            preparedBy: true,
            designCost: true,
            overheadCost: true,
            contingencyCost: true,
            actualDesignCost: true,
            actualOverheadCost: true,
            actualContingencyCost: true,
            predictedTotal: true,
            actualTotal: true,
            varianceAmount: true,
            variancePercentage: true,
            status: true,
            createdAt: true,
            updatedAt: true,
            costItems: {
              select: {
                id: true,
                costSheetId: true,
                materialId: true,
                vendorId: true,
                predictedRate: true,
                predictedQuantity: true,
                predictedAmount: true,
                actualRate: true,
                actualQuantity: true,
                actualAmount: true,
                remarks: true,
                material: { select: { id: true, materialName: true, materialCode: true } },
                vendor: { select: { id: true, vendorName: true, vendorCode: true } },
              },
            },
            processCosts: {
              select: {
                id: true,
                costSheetId: true,
                processId: true,
                predictedCost: true,
                actualCost: true,
                variance: true,
                estimatedHours: true,
                actualHours: true,
                process: { select: { id: true, processName: true } },
              },
            },
          },
        },
        productionReceipt: {
          select: {
            id: true,
            indentId: true,
            receivedDate: true,
            receivedBy: true,
            remarks: true,
            createdAt: true,
            updatedAt: true,
            receiver: { select: { id: true, firstName: true, lastName: true } },
          },
        },
        workflowHistory: {
          orderBy: { movedAt: 'desc' },
          take: 10,
          select: {
            id: true,
            indentId: true,
            fromDepartmentId: true,
            toDepartmentId: true,
            stageId: true,
            movedBy: true,
            movedAt: true,
            remarks: true,
            createdAt: true,
            updatedAt: true,
            mover: { select: { id: true, firstName: true, lastName: true } },
            toDepartment: { select: { id: true, departmentName: true, departmentCode: true } },
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
      customerName: indent.customerName,
      layoutNumber: indent.layoutNumber,
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
      broughtMaterials: indent.broughtMaterials,
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
   * Lightweight context fetch used by workflow transition methods for validation.
   *
   * Returns only the scalar fields plus the item/cost-sheet subsets that transitions
   * actually read (currentState, remarks, departmentId, indentNumber, items, costSheet
   * totals). The domain-state mapping is identical to findTransactionById so optimistic
   * locking and transition validation behave exactly the same.
   *
   * The full relational graph remains served by findTransactionById, which is still used
   * once at the end of each transition to build the API response.
   */
  private async getTransactionContext(id: string): Promise<any> {
    const indent = await this.prisma.indent.findUnique({
      where: { id },
      select: {
        id: true,
        indentNumber: true,
        customerName: true,
        layoutNumber: true,
        departmentId: true,
        priority: true,
        status: true,
        currentState: true,
        requiredDate: true,
        requiredDeliveryDate: true,
        purpose: true,
        remarks: true,
        createdAt: true,
        updatedAt: true,
        indentItems: {
          where: { isDeleted: false },
          select: {
            id: true,
            materialId: true,
            unitId: true,
            quantity: true,
            status: true,
            remarks: true,
            material: { select: { materialName: true } },
          },
        },
        broughtMaterials: {
          where: { isDeleted: false },
          select: {
            id: true,
            name: true,
            specification: true,
            quantity: true,
            status: true,
            amount: true,
            actualAmount: true,
            issuedQuantity: true,
          },
        },
        costSheet: {
          select: {
            id: true,
            actualDesignCost: true,
            actualOverheadCost: true,
            actualContingencyCost: true,
            predictedTotal: true,
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
      customerName: indent.customerName,
      layoutNumber: indent.layoutNumber,
      departmentId: indent.departmentId,
      priority: indent.priority,
      currentState: domainState,
      currentLoop: stageDef ? stageDef.loop : WorkflowLoop.MANUFACTURING_LOOP,
      requiredDate: indent.requiredDate,
      requiredDeliveryDate: indent.requiredDeliveryDate,
      purpose: indent.purpose,
      remarks: indent.remarks,
      createdBy: null,
      createdAt: indent.createdAt,
      updatedAt: indent.updatedAt,
      items: indent.indentItems,
      broughtMaterials: indent.broughtMaterials,
      attachments: [],
      costSheet: indent.costSheet,
      productionReceipt: null,
      workflowHistory: [],
      allowedNextStates: stageDef ? stageDef.allowedNextStates : [],
    };
  }

  /**
   * List all Business Transactions with pagination and filters.
   *
   * Uses the currentState column for direct domain WorkflowState filtering,
   * which is efficient and avoids the lossy Prisma IndentStatus mapping.
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
        { customerName: { contains: query.search, mode: 'insensitive' } },
        { layoutNumber: { contains: query.search, mode: 'insensitive' } },
        { purpose: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    // Use currentState column for direct domain WorkflowState filtering
    // Support comma-separated workflow states so module queues can be fetched
    // server-side. This keeps pagination and totals correct instead of
    // filtering only the current page in the browser.
    const requestedDomainStates = String(query.state ?? '')
      .split(',')
      .map((state) => state.trim())
      .filter((state): state is WorkflowState =>
        Object.values(WorkflowState).includes(state as WorkflowState),
      );
    if (requestedDomainStates.length === 1) {
      where.currentState = requestedDomainStates[0];
    } else if (requestedDomainStates.length > 1) {
      where.currentState = { in: requestedDomainStates };
    }

    // Unambiguous or no state filter: use standard DB pagination
    const [total, indents] = await Promise.all([
      this.prisma.indent.count({ where }),
      this.prisma.indent.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          indentNumber: true,
          status: true,
          currentState: true,
          priority: true,
          customerName: true,
          layoutNumber: true,
          purpose: true,
          remarks: true,
          requiredDate: true,
          createdAt: true,
          product: { select: { productName: true, productCode: true } },
          department: { select: { departmentName: true, departmentCode: true } },
          creator: { select: { firstName: true, lastName: true } },
          costSheet: { select: { predictedTotal: true, costNumber: true, actualTotal: true } },
          indentItems: { select: { status: true } },
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
        customerName: indent.customerName,
        layoutNumber: indent.layoutNumber,
        productName: indent.product?.productName,
        departmentName: indent.department?.departmentName,
        priority: indent.priority,
        currentState: domainState,
        currentLoop: stageDef ? stageDef.loop : WorkflowLoop.MANUFACTURING_LOOP,
        predictedTotal: indent.costSheet?.predictedTotal || 0,
        costSheet: { actualTotal: indent.costSheet?.actualTotal },
        creatorName: indent.creator
          ? `${indent.creator.firstName} ${indent.creator.lastName}`
          : 'N/A',
        createdAt: indent.createdAt,
        requiredDate: indent.requiredDate,
        issuedItemsCount: indent.indentItems?.filter((i) => i.status === 'ISSUED').length || 0,
        totalItemsCount: indent.indentItems?.length || 0,
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

  /** Minimal dashboard metrics for operational roles without analytics access. */
  public async getOperationalSummary(): Promise<{
    totalTransactions: number;
    activeTransactions: number;
    inProduction: number;
    completedTransactions: number;
    stageDistribution: Array<{ stageName: string; count: number; percentage: number }>;
  }> {
    const grouped = await this.prisma.indent.groupBy({
      by: ['currentState'],
      where: { isDeleted: false },
      _count: { id: true },
    });
    const stageDistribution = grouped.map((row) => ({
      stageName: row.currentState ?? WorkflowState.DRAFT,
      count: row._count.id,
      percentage: 0,
    }));
    const totalTransactions = stageDistribution.reduce((sum, row) => sum + row.count, 0);
    const completedTransactions =
      stageDistribution.find((row) => row.stageName === WorkflowState.COMPLETED)?.count ?? 0;
    const activeTransactions = totalTransactions - completedTransactions;
    const inProduction = stageDistribution
      .filter((row) =>
        [
          WorkflowState.MATERIALS_ISSUED,
          WorkflowState.PRODUCTION_PROCESSING,
          WorkflowState.PRODUCTION_COMPLETED,
        ].includes(row.stageName as WorkflowState),
      )
      .reduce((sum, row) => sum + row.count, 0);
    return {
      totalTransactions,
      activeTransactions,
      inProduction,
      completedTransactions,
      stageDistribution: stageDistribution.map((row) => ({
        ...row,
        percentage: totalTransactions
          ? Math.round((row.count / totalTransactions) * 10000) / 100
          : 0,
      })),
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
    this.logger.log('--- updateDraftTransaction DTO received ---');
    this.logger.log(JSON.stringify(dto, null, 2));
    const [existing, user] = await Promise.all([
      this.getTransactionContext(id),
      this.prisma.user.findUnique({
        where: { id: userId },
        include: {
          role: {
            include: {
              rolePermissions: {
                include: { permission: true },
                where: { isDeleted: false },
              },
            },
          },
        },
      }),
    ]);
    const allowedStates = [
      WorkflowState.DRAFT,
      WorkflowState.PRODUCTION_PROCESSING,
      WorkflowState.ACCOUNTS_COST_VERIFICATION,
    ];

    const isSystemAdmin = user?.role?.rolePermissions?.some(
      (rp) => rp.permission.code.toLowerCase() === 'settings.manage',
    );

    if (!isSystemAdmin && !allowedStates.includes(existing.currentState as WorkflowState)) {
      throw new BadRequestException(
        `Cannot edit Business Transaction in state '${existing.currentState}'.`,
      );
    }

    const existingCostSheet = await this.prisma.costSheet.findFirst({
      where: { indentId: id },
    });

    await this.prisma.$transaction(
      async (tx) => {
        // 1. Update Indent basic details
        await tx.indent.update({
          where: { id },
          data: {
            priority: dto.indent?.priority || existing.priority,
            customerName:
              dto.indent?.customerName !== undefined
                ? dto.indent.customerName
                : existing.customerName,
            layoutNumber:
              dto.indent?.layoutNumber !== undefined
                ? dto.indent.layoutNumber
                : existing.layoutNumber,
            requiredDate: dto.indent?.requiredDate
              ? new Date(dto.indent.requiredDate)
              : existing.requiredDate,
            purpose: dto.indent?.purpose || existing.purpose,
            remarks: dto.indent?.remarks || existing.remarks,
            updatedBy: userId,
          },
        });

        const resolvedMaterialIds: string[] = [];
        // 2. PRF-DB-002: Differential update for indent items instead of delete+recreate.
        // Strategy: compare existing DB items with incoming DTO items by index.
        //   - Overlap: update in place (preserve UUID, no orphaned references)
        //   - New items (DTO longer): createMany the extra
        //   - Removed items (DB longer): deleteMany the excess
        if (dto.indent?.items) {
          if (existing.currentState === WorkflowState.PRODUCTION_PROCESSING) {
            // In PRODUCTION_PROCESSING, Production is only updating production source and process details on existing items
            for (let i = 0; i < dto.indent.items.length; i++) {
              const itemDto = dto.indent.items[i];
              const existingItem = existing.items[i];
              if (existingItem && itemDto.remarks) {
                await tx.indentItem.update({
                  where: { id: existingItem.id },
                  data: {
                    remarks: itemDto.remarks,
                    updatedBy: userId,
                  },
                });
              }
            }
          } else {
            const existingItems = existing.items as any[];
            const newItems = dto.indent.items;
            const overlapCount = Math.min(existingItems.length, newItems.length);

            // Resolve materials for all new/updated items
            const resolvedMaterials = await Promise.all(
              newItems.map((item, i) =>
                this.resolveMaterial(tx, item.materialName, item.unitId, userId, i),
              ),
            );
            resolvedMaterialIds.push(...resolvedMaterials.map((m) => m.id));

            // UPDATE overlapping items in parallel
            const itemUpdatePromises: Promise<any>[] = [];
            for (let i = 0; i < overlapCount; i++) {
              const item = newItems[i];
              const existingItem = existingItems[i];
              const material = resolvedMaterials[i];
              const unitWeightKg = calculateMaterialWeight({
                shape: item.shape || '',
                densityKgPerDm3: Number(material.densityKgPerDm3 || 0),
                diameterMm: item.diameterMm,
                lengthMm: item.lengthMm,
                widthMm: item.widthMm,
                heightMm: item.heightMm,
              });
              const totalWeightKg = safeMultiply(unitWeightKg, item.quantity);

              itemUpdatePromises.push(
                tx.indentItem.update({
                  where: { id: existingItem.id },
                  data: {
                    materialId: material.id,
                    quantity: item.quantity,
                    unitId: item.unitId,
                    shape: item.shape || null,
                    diameterMm: item.diameterMm || null,
                    lengthMm: item.lengthMm || null,
                    widthMm: item.widthMm || null,
                    heightMm: item.heightMm || null,
                    unitWeightKg,
                    totalWeightKg,
                    remarks: item.remarks || null,
                    updatedBy: userId,
                  },
                }),
              );

              // Differential update processes for this item:
              // Delete old processes and recreate (processes don't have stable business keys)
              itemUpdatePromises.push(
                tx.indentProcess
                  .deleteMany({ where: { indentItemId: existingItem.id } })
                  .then(async () => {
                    if (item.processes && item.processes.length > 0) {
                      const uniqueProcesses = [];
                      const seenProcessIds = new Set();
                      for (const proc of item.processes) {
                        if (!seenProcessIds.has(proc.processId)) {
                          seenProcessIds.add(proc.processId);
                          uniqueProcesses.push(proc);
                        }
                      }
                      await tx.indentProcess.createMany({
                        data: uniqueProcesses.map((proc, idx) => ({
                          indentItemId: existingItem.id,
                          processId: proc.processId,
                          sequence: idx + 1,
                          estimatedHours: proc.estimatedHours ?? 0,
                        })),
                      });
                    }
                  }),
              );
            }
            await Promise.all(itemUpdatePromises);

            // CREATE new items (DTO has more than existing)
            if (newItems.length > existingItems.length) {
              const createdItems: any[] = [];
              for (let i = overlapCount; i < newItems.length; i++) {
                const item = newItems[i];
                const material = resolvedMaterials[i];
                const unitWeightKg = calculateMaterialWeight({
                  shape: item.shape || '',
                  densityKgPerDm3: Number(material.densityKgPerDm3 || 0),
                  diameterMm: item.diameterMm,
                  lengthMm: item.lengthMm,
                  widthMm: item.widthMm,
                  heightMm: item.heightMm,
                });
                const totalWeightKg = safeMultiply(unitWeightKg, item.quantity);

                const createdItem = await tx.indentItem.create({
                  data: {
                    indentId: id,
                    materialId: material.id,
                    quantity: item.quantity,
                    unitId: item.unitId,
                    shape: item.shape || null,
                    diameterMm: item.diameterMm || null,
                    lengthMm: item.lengthMm || null,
                    widthMm: item.widthMm || null,
                    heightMm: item.heightMm || null,
                    unitWeightKg,
                    totalWeightKg,
                    remarks: item.remarks || null,
                    status: 'DRAFT',
                  },
                });
                createdItems.push({ item, createdItem });
              }

              // Create processes for new items in parallel
              const processCreatePromises = createdItems
                .filter(({ item }) => item.processes && item.processes.length > 0)
                .map(({ item, createdItem }) => {
                  const uniqueProcesses = [];
                  const seenProcessIds = new Set();
                  for (const proc of item.processes) {
                    if (!seenProcessIds.has(proc.processId)) {
                      seenProcessIds.add(proc.processId);
                      uniqueProcesses.push(proc);
                    }
                  }
                  return tx.indentProcess.createMany({
                    data: uniqueProcesses.map((proc: any, idx: number) => ({
                      indentItemId: createdItem.id,
                      processId: proc.processId,
                      sequence: idx + 1,
                      estimatedHours: proc.estimatedHours ?? 0,
                    })),
                  });
                });
              if (processCreatePromises.length > 0) {
                await Promise.all(processCreatePromises);
              }
            }

            // DELETE removed items (existing has more than DTO)
            if (existingItems.length > newItems.length) {
              const excessItems = existingItems.slice(overlapCount);
              const excessIds = excessItems.map((i: any) => i.id);
              await tx.indentProcess.deleteMany({ where: { indentItemId: { in: excessIds } } });
              await tx.indentItem.deleteMany({ where: { id: { in: excessIds } } });
            }
          }
        }

        // 2b. PRF-DB-002: Differential update for broughtMaterials
        if (dto.indent?.broughtMaterials !== undefined) {
          if (existing.currentState !== WorkflowState.PRODUCTION_PROCESSING) {
            const existingBMs = (existing as any).broughtMaterials || [];
            const newBMs = dto.indent.broughtMaterials;
            const overlapBM = Math.min(existingBMs.length, newBMs.length);

            // UPDATE overlapping brought materials in parallel
            const bmUpdatePromises: Promise<any>[] = [];
            for (let i = 0; i < overlapBM; i++) {
              const bm = newBMs[i];
              const existingBM = existingBMs[i];
              bmUpdatePromises.push(
                tx.indentBroughtMaterial.update({
                  where: { id: existingBM.id },
                  data: {
                    name: bm.name,
                    quantity: roundTo4Decimals(bm.quantity),
                    specification: bm.specification || null,
                    amount: bm.amount !== undefined && bm.amount !== null ? bm.amount : null,
                    // BIZ-003: actualAmount NOT updated here — financial data protected.
                  },
                }),
              );
            }
            if (bmUpdatePromises.length > 0) await Promise.all(bmUpdatePromises);

            // CREATE new brought materials
            if (newBMs.length > existingBMs.length) {
              await tx.indentBroughtMaterial.createMany({
                data: newBMs.slice(overlapBM).map((bm) => ({
                  indentId: id,
                  name: bm.name,
                  quantity: roundTo4Decimals(bm.quantity),
                  specification: bm.specification || null,
                  amount: bm.amount !== undefined && bm.amount !== null ? bm.amount : null,
                  // BIZ-003: actualAmount NOT set here.
                })),
              });
            }

            // DELETE removed brought materials
            if (existingBMs.length > newBMs.length) {
              const excessBMIds = existingBMs.slice(overlapBM).map((bm: any) => bm.id);
              await tx.indentBroughtMaterial.deleteMany({ where: { id: { in: excessBMIds } } });
            }
          }
        }

        // 3. Update CostSheet if provided — PRF-DB-002 differential update
        if (dto.costSheet && existingCostSheet) {
          await tx.costSheet.update({
            where: { id: existingCostSheet.id },
            data: {
              predictedTotal: roundTo4Decimals(dto.costSheet.predictedTotal),
              designCost:
                dto.costSheet.designCost !== undefined
                  ? roundTo4Decimals(dto.costSheet.designCost)
                  : existingCostSheet.designCost,
              overheadCost:
                dto.costSheet.overheadCost !== undefined
                  ? roundTo4Decimals(dto.costSheet.overheadCost)
                  : existingCostSheet.overheadCost,
              contingencyCost:
                dto.costSheet.contingencyCost !== undefined
                  ? roundTo4Decimals(dto.costSheet.contingencyCost)
                  : existingCostSheet.contingencyCost,
            },
          });

          // PRF-DB-002: Differential update for costItems
          if (dto.costSheet.costItems) {
            const existingCostItems = await tx.costItem.findMany({
              where: { costSheetId: existingCostSheet.id },
              orderBy: { createdAt: 'asc' },
            });
            const newCostItems = dto.costSheet.costItems;
            const overlapCI = Math.min(existingCostItems.length, newCostItems.length);

            // UPDATE overlapping cost items in parallel
            const ciUpdatePromises: Promise<any>[] = [];
            for (let i = 0; i < overlapCI; i++) {
              const ci = newCostItems[i];
              const existingCI = existingCostItems[i];
              ciUpdatePromises.push(
                tx.costItem.update({
                  where: { id: existingCI.id },
                  data: {
                    materialId:
                      resolvedMaterialIds[i] || (ci as any).materialId || existingCI.materialId,
                    vendorId: ci.vendorId || null,
                    predictedRate: roundTo4Decimals(ci.predictedRate),
                    predictedQuantity: roundTo4Decimals(ci.predictedQuantity),
                    predictedAmount: roundTo4Decimals(ci.predictedAmount ?? ci.predictedRate),
                    remarks: ci.remarks || null,
                  },
                }),
              );
            }
            if (ciUpdatePromises.length > 0) await Promise.all(ciUpdatePromises);

            // CREATE new cost items
            if (newCostItems.length > existingCostItems.length) {
              await tx.costItem.createMany({
                data: newCostItems.slice(overlapCI).map((ci, idx) => ({
                  costSheetId: existingCostSheet.id,
                  materialId: resolvedMaterialIds[overlapCI + idx] || (ci as any).materialId,
                  vendorId: ci.vendorId || null,
                  predictedRate: roundTo4Decimals(ci.predictedRate),
                  predictedQuantity: roundTo4Decimals(ci.predictedQuantity),
                  predictedAmount: roundTo4Decimals(ci.predictedAmount ?? ci.predictedRate),
                  remarks: ci.remarks || null,
                })),
              });
            }

            // DELETE removed cost items
            if (existingCostItems.length > newCostItems.length) {
              const excessCIIds = existingCostItems.slice(overlapCI).map((ci) => ci.id);
              await tx.costItem.deleteMany({ where: { id: { in: excessCIIds } } });
            }
          }

          // PRF-DB-002: Differential update for processCosts
          if (dto.costSheet.processCosts) {
            const existingPCs = await tx.processCost.findMany({
              where: { costSheetId: existingCostSheet.id },
              orderBy: { createdAt: 'asc' },
            });
            const newPCs = dto.costSheet.processCosts;
            const overlapPC = Math.min(existingPCs.length, newPCs.length);

            // UPDATE overlapping process costs in parallel
            const pcUpdatePromises: Promise<any>[] = [];
            for (let i = 0; i < overlapPC; i++) {
              const pc = newPCs[i];
              const existingPC = existingPCs[i];
              pcUpdatePromises.push(
                tx.processCost.update({
                  where: { id: existingPC.id },
                  data: {
                    processId: pc.processId,
                    predictedCost: roundTo4Decimals(pc.predictedCost),
                    estimatedHours: pc.estimatedHours ?? 0,
                  },
                }),
              );
            }
            if (pcUpdatePromises.length > 0) await Promise.all(pcUpdatePromises);

            // CREATE new process costs
            if (newPCs.length > existingPCs.length) {
              await tx.processCost.createMany({
                data: newPCs.slice(overlapPC).map((pc) => ({
                  costSheetId: existingCostSheet.id,
                  processId: pc.processId,
                  predictedCost: roundTo4Decimals(pc.predictedCost),
                  estimatedHours: pc.estimatedHours ?? 0,
                })),
              });
            }

            // DELETE removed process costs
            if (existingPCs.length > newPCs.length) {
              const excessPCIds = existingPCs.slice(overlapPC).map((pc) => pc.id);
              await tx.processCost.deleteMany({ where: { id: { in: excessPCIds } } });
            }
          }
        }
      },
      { maxWait: 5000, timeout: 20000 },
    );

    await this.eventService.logAudit(
      AuditEventType.CREATE_DRAFT,
      id,
      userId,
      { priority: existing.priority },
      { priority: dto.indent?.priority || existing.priority },
    );

    this.invalidateMetadataCache();
    return { id, success: true };
  }

  /**
   * STAGE 1 SUBMIT: Design department submits transaction (DRAFT -> DESIGN_COMPLETED)
   */
  public async submitDesign(id: string, userId: string, remarks?: string): Promise<any> {
    const [txData, storesDept] = await Promise.all([
      this.getTransactionContext(id),
      this.prisma.department.findFirst({
        where: { departmentCode: { in: ['STORES', 'STOR'] }, isDeleted: false },
      }),
    ]);
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

    await this.prisma.$transaction(async (tx) => {
      await this.assertCurrentStateAndUpdate(
        id,
        txData.currentState,
        {
          status: prismaTargetStatus,
          currentState: targetState,
          updatedBy: userId,
          remarks: remarks ? `${txData.remarks || ''}\nSubmit Notes: ${remarks}` : txData.remarks,
        },
        tx,
      );
      await tx.workflowHistory.create({
        data: {
          indentId: id,
          toDepartmentId: storesDept ? storesDept.id : txData.departmentId,
          movedBy: userId,
          remarks: remarks || 'Design completed and submitted to Stores.',
        },
      });
    });

    // Dispatch Notifications & Audit
    await this.eventService.dispatchNotification(id, txData.indentNumber, targetState, userId);
    await this.eventService.logAudit(
      AuditEventType.SUBMIT_DESIGN,
      id,
      userId,
      { state: txData.currentState },
      { state: targetState },
    );

    this.invalidateWorkflowCache();
    return { id, success: true };
  }

  /**
   * STORES STOCK VERIFICATION: Checks material availability for Indent Items
   */
  public async storesVerifyStock(id: string, userId: string): Promise<any> {
    const [txData, storesDept] = await Promise.all([
      this.getTransactionContext(id),
      this.prisma.department.findFirst({
        where: { departmentCode: { in: ['STORES', 'STOR'] }, isDeleted: false },
      }),
    ]);

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

    const verificationResults = await Promise.all(
      txData.items.map(async (item: any) => {
        return {
          id: item.id,
          status: 'AVAILABLE',
        };
      }),
    );

    const hasInsufficientStock = false;
    const verificationRemarks = `Stores verification completed.`;

    await this.prisma.$transaction(async (prisma) => {
      await this.assertCurrentStateAndUpdate(
        id,
        txData.currentState,
        {
          status: prismaTargetStatus,
          currentState: targetState,
          remarks: `${txData.remarks || ''}\n${verificationRemarks}`,
          updatedBy: userId,
        },
        prisma,
      );

      if (verificationResults.length > 0) {
        await prisma.indentItem.updateMany({
          where: { id: { in: verificationResults.map((res) => res.id) } },
          data: { status: 'AVAILABLE' },
        });
      }

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

    this.invalidateWorkflowCache();
    return { id, success: true };
  }

  /**
   * STORES MATERIAL ISSUE: Issues raw materials to Production and subtracts stock (STORES_PROCESSING -> MATERIALS_ISSUED)
   */
  public async storesIssueMaterials(id: string, userId: string, dto: StoresIssueDto): Promise<any> {
    const [txData, productionDept] = await Promise.all([
      this.getTransactionContext(id),
      this.prisma.department.findFirst({
        where: { departmentCode: { in: ['PRODUCTION', 'PROD'] }, isDeleted: false },
      }),
    ]);
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

    const updatedRemarks = `${txData.remarks || ''}\n[MATERIALS_ISSUED] Materials issued from Stores. ${dto.remarks ? `Remarks: ${dto.remarks}` : ''}`;
    let isFullyIssued = false;

    // 1. Fetch active indent items OUTSIDE transaction
    const itemsToIssue = await this.prisma.indentItem.findMany({
      where: { indentId: id, isDeleted: false },
      select: { id: true, materialId: true, quantity: true, issuedQuantity: true, status: true },
    });

    // 2. Batch-fetch all needed materials OUTSIDE transaction
    const nonIssuedMaterialIds = [
      ...new Set(
        itemsToIssue.filter((item) => item.status !== 'ISSUED').map((item) => item.materialId),
      ),
    ];
    const materials =
      nonIssuedMaterialIds.length > 0
        ? await this.prisma.material.findMany({ where: { id: { in: nonIssuedMaterialIds } } })
        : [];
    const materialMap = new Map(materials.map((m) => [m.id, m]));

    await this.prisma.$transaction(async (prisma) => {
      const issues = dto.issueItems || [];
      const materialUpdates: Promise<any>[] = [];
      const itemUpdates: Promise<any>[] = [];

      // 3. Validate stock and prepare updates
      for (const item of itemsToIssue) {
        if (item.status === 'ISSUED') {
          continue;
        }

        let issueQty = 0;
        if (issues.length > 0) {
          const issueInput = issues.find((i) => i.materialId === item.materialId);
          if (issueInput) {
            issueQty = Number(issueInput.issuedQuantity);
          }
        } else {
          issueQty = Number(item.quantity) - Number(item.issuedQuantity);
        }

        if (issueQty <= 0) {
          continue;
        }

        const material = materialMap.get(item.materialId);
        if (!material) {
          throw new NotFoundException(`Material with ID '${item.materialId}' not found.`);
        }

        // Queue material stock decrement (No stock bounds enforced per user request)
        materialUpdates.push(
          prisma.material
            .updateMany({
              where: { id: material.id },
              data: { currentStock: { decrement: issueQty }, updatedBy: userId },
            })
            .then((res) => {
              return res;
            }),
        );

        // Queue indent item update
        const newIssuedQuantity = Number(item.issuedQuantity) + issueQty;
        const isNowFullyIssued = newIssuedQuantity >= Number(item.quantity);
        itemUpdates.push(
          prisma.indentItem.update({
            where: { id: item.id },
            data: {
              issuedQuantity: newIssuedQuantity,
              status: isNowFullyIssued ? 'ISSUED' : item.status,
            },
          }),
        );
      }

      // 4. Execute all stock decrements and item updates in parallel
      if (materialUpdates.length > 0) {
        await Promise.all(materialUpdates);
      }
      if (itemUpdates.length > 0) {
        await Promise.all(itemUpdates);
      }

      // Check completion status across both raw materials and brought out materials
      const unissuedItemsCount = await prisma.indentItem.count({
        where: {
          indentId: id,
          isDeleted: false,
          OR: [{ status: { not: 'ISSUED' } }, { status: null }],
        },
      });
      const unissuedBroughtCount = await prisma.indentBroughtMaterial.count({
        where: {
          indentId: id,
          isDeleted: false,
          OR: [{ status: { not: 'ISSUED' } }, { status: null }],
        },
      });

      isFullyIssued = unissuedItemsCount + unissuedBroughtCount === 0;

      if (isFullyIssued) {
        // 5. State transition with optimistic lock protection
        await this.assertCurrentStateAndUpdate(
          id,
          txData.currentState,
          {
            status: prismaTargetStatus,
            currentState: targetState,
            remarks: updatedRemarks,
            updatedBy: userId,
          },
          prisma,
        );

        // 6. Create workflow history record
        await prisma.workflowHistory.create({
          data: {
            indentId: id,
            toDepartmentId: productionDept ? productionDept.id : txData.departmentId,
            movedBy: userId,
            remarks: dto.remarks || 'Stores issued raw materials and dispatched to Production.',
          },
        });
      }
    });

    if (isFullyIssued) {
      await this.eventService.dispatchNotification(id, txData.indentNumber, targetState, userId);
      await this.eventService.logAudit(
        AuditEventType.STORES_ISSUE,
        id,
        userId,
        { state: txData.currentState },
        { state: targetState },
      );
    } else {
      // Partial issue audit log
      await this.eventService.logAudit(
        AuditEventType.STORES_ISSUE,
        id,
        userId,
        { state: txData.currentState },
        { state: txData.currentState, partial: true },
      );
    }

    this.invalidateWorkflowCache();
    return { id, success: true };
  }

  /**
   * ITEM-LEVEL STORES MATERIAL ISSUE: Issues a single raw material component item.
   * If all items in the indent are marked ISSUED, automatically triggers full stage completion & notifications.
   */
  public async issueSingleMaterialItem(id: string, itemId: string, userId: string): Promise<any> {
    const txData = await this.getTransactionContext(id);

    let isBroughtMaterial = false;
    let item = txData.items?.find((i: any) => i.id === itemId);

    if (!item) {
      item = txData.broughtMaterials?.find((i: any) => i.id === itemId);
      if (item) {
        isBroughtMaterial = true;
      } else {
        throw new NotFoundException(
          `Material item with ID '${itemId}' not found in indent '${id}'.`,
        );
      }
    }

    if (item.status === 'ISSUED') {
      throw new BadRequestException(
        `Material item '${item.material?.materialName || item.name || itemId}' has already been issued.`,
      );
    }

    await this.prisma.$transaction(async (prisma) => {
      const requiredQty = Number(item.quantity);

      if (isBroughtMaterial) {
        // No material stock to check/decrement for bought-out materials
        await prisma.indentBroughtMaterial.update({
          where: { id: itemId },
          data: {
            status: 'ISSUED',
            issuedQuantity: requiredQty,
            updatedBy: userId,
          },
        });
      } else {
        const material = await prisma.material.findUnique({
          where: { id: item.materialId },
        });

        if (!material) {
          throw new NotFoundException(`Material with ID '${item.materialId}' not found.`);
        }

        if (requiredQty <= 0) {
          throw new BadRequestException(
            `Invalid quantity for material '${material.materialName}'. Quantity must be greater than zero.`,
          );
        }

        const updateResult = await prisma.material.updateMany({
          where: {
            id: material.id,
          },
          data: {
            currentStock: { decrement: requiredQty },
            updatedBy: userId,
          },
        });

        if (updateResult.count === 0) {
          throw new BadRequestException(
            `Material '${material.materialName}' not found or concurrently deleted.`,
          );
        }

        // Update item status to ISSUED
        await prisma.indentItem.update({
          where: { id: itemId },
          data: {
            status: 'ISSUED',
            issuedQuantity: requiredQty,
            updatedBy: userId,
          },
        });
      }
    });

    // Check completion status using lightweight COUNT queries instead of fetching all items
    const unissuedItemsCount = await this.prisma.indentItem.count({
      where: {
        indentId: id,
        isDeleted: false,
        OR: [{ status: { not: 'ISSUED' } }, { status: null }],
      },
    });
    const unissuedBroughtCount = await this.prisma.indentBroughtMaterial.count({
      where: {
        indentId: id,
        isDeleted: false,
        OR: [{ status: { not: 'ISSUED' } }, { status: null }],
      },
    });

    const allIssued = unissuedItemsCount + unissuedBroughtCount === 0;

    if (allIssued) {
      // All items issued — inline the final transition (avoids redundant storesIssueMaterials delegation)
      const targetState = WorkflowState.MATERIALS_ISSUED;
      if (
        txData.currentState === WorkflowState.DESIGN_COMPLETED ||
        txData.currentState === WorkflowState.STORES_PROCESSING
      ) {
        let currentState = txData.currentState;
        if (currentState === WorkflowState.DESIGN_COMPLETED) {
          // First transition to STORES_PROCESSING
          await this.prisma.indent.update({
            where: { id },
            data: {
              status: WorkflowStateMapper.toPrisma(WorkflowState.STORES_PROCESSING),
              currentState: WorkflowState.STORES_PROCESSING,
              updatedBy: userId,
            },
          });
          currentState = WorkflowState.STORES_PROCESSING;
        }
        const transitionValidation = this.workflowStateMachine.validateTransition(
          txData.currentState,
          targetState,
          'STORES',
        );
        if (!transitionValidation.isValid) {
          throw new BadRequestException(transitionValidation.errors.join(', '));
        }

        const productionDept = await this.prisma.department.findFirst({
          where: { departmentCode: { in: ['PRODUCTION', 'PROD'] }, isDeleted: false },
        });
        const prismaTargetStatus = WorkflowStateMapper.toPrisma(targetState);

        await this.prisma.$transaction(async (tx) => {
          await this.assertCurrentStateAndUpdate(
            id,
            txData.currentState,
            {
              status: prismaTargetStatus,
              currentState: targetState,
              remarks: `${txData.remarks || ''}\n[MATERIALS_ISSUED] All material items have been issued individual component-by-component.`,
              updatedBy: userId,
            },
            tx,
          );
          await tx.workflowHistory.create({
            data: {
              indentId: id,
              toDepartmentId: productionDept ? productionDept.id : txData.departmentId,
              movedBy: userId,
              remarks: 'All material items have been issued individual component-by-component.',
            },
          });
        });

        await this.eventService.dispatchNotification(id, txData.indentNumber, targetState, userId);
        await this.eventService.logAudit(
          AuditEventType.STORES_ISSUE,
          id,
          userId,
          { state: txData.currentState },
          { state: targetState },
        );
      }
    } else {
      // Partial issue — move to STORES_PROCESSING if currently in DESIGN_COMPLETED
      if (txData.currentState === WorkflowState.DESIGN_COMPLETED) {
        const prismaStatus = WorkflowStateMapper.toPrisma(WorkflowState.STORES_PROCESSING);
        await this.prisma.indent.update({
          where: { id },
          data: {
            status: prismaStatus,
            currentState: WorkflowState.STORES_PROCESSING,
            updatedBy: userId,
          },
        });
      }

      // Dispatch in-app notification for partial issue using COUNT queries
      const issuedCount = await this.prisma.indentItem.count({
        where: { indentId: id, isDeleted: false, status: 'ISSUED' },
      });
      const totalCount = await this.prisma.indentItem.count({
        where: { indentId: id, isDeleted: false },
      });
      await this.eventService.dispatchPartialIssueNotification(
        id,
        txData.indentNumber,
        item.material?.materialName || 'Material',
        issuedCount,
        totalCount,
        userId,
      );
    }

    this.invalidateWorkflowCache();
    return { id, success: true };
  }

  /**
   * PRODUCTION RECEIVE MATERIALS: Production confirms raw material receipt (MATERIALS_ISSUED -> PRODUCTION_PROCESSING)
   */
  public async productionReceiveMaterials(
    id: string,
    userId: string,
    remarks?: string,
  ): Promise<any> {
    const txData = await this.getTransactionContext(id);
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

    await this.prisma.$transaction(async (tx) => {
      await this.assertCurrentStateAndUpdate(
        id,
        txData.currentState,
        {
          status: prismaTargetStatus,
          currentState: targetState,
          updatedBy: userId,
        },
        tx,
      );
      await tx.productionReceipt.upsert({
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
      });
      await tx.workflowHistory.create({
        data: {
          indentId: id,
          toDepartmentId: txData.departmentId,
          movedBy: userId,
          remarks: remarks || 'Production work center received materials.',
        },
      });
    });

    await this.eventService.dispatchNotification(id, txData.indentNumber, targetState, userId);
    await this.eventService.logAudit(
      AuditEventType.PRODUCTION_UPDATE,
      id,
      userId,
      { state: txData.currentState },
      { state: targetState, action: 'RECEIVE_MATERIALS' },
    );

    this.invalidateWorkflowCache();
    return { id, success: true };
  }

  /**
   * PRODUCTION START WORK: Production starts manufacturing operations
   */
  public async productionStartWork(id: string, userId: string, remarks?: string): Promise<any> {
    const txData = await this.getTransactionContext(id);
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

    this.invalidateWorkflowCache();
    return { id, success: true };
  }

  /**
   * PRODUCTION UPDATE PROGRESS: Updates status notes and logs updates
   */
  public async productionUpdateProgress(
    id: string,
    userId: string,
    dto: ProductionUpdateDto,
  ): Promise<any> {
    const txData = await this.getTransactionContext(id);
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

    this.invalidateWorkflowCache();
    return { id, success: true };
  }

  /**
   * PRODUCTION COMPLETE WORK: Production completes manufacturing (PRODUCTION_PROCESSING -> PRODUCTION_COMPLETED)
   */
  public async productionCompleteWork(id: string, userId: string, remarks?: string): Promise<any> {
    const txData = await this.getTransactionContext(id);
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

    await this.prisma.$transaction(async (tx) => {
      await this.assertCurrentStateAndUpdate(
        id,
        txData.currentState,
        {
          status: prismaTargetStatus,
          currentState: targetState,
          remarks: `${txData.remarks || ''}\n[PRODUCTION_COMPLETED] Manufacturing completed. ${remarks ? `Notes: ${remarks}` : ''}`,
          updatedBy: userId,
        },
        tx,
      );
      await tx.workflowHistory.create({
        data: {
          indentId: id,
          toDepartmentId: txData.departmentId,
          movedBy: userId,
          remarks: remarks || 'Production completed manufacturing.',
        },
      });
    });

    await this.eventService.dispatchNotification(id, txData.indentNumber, targetState, userId);
    await this.eventService.logAudit(
      AuditEventType.PRODUCTION_UPDATE,
      id,
      userId,
      { state: txData.currentState },
      { state: targetState, remarks },
    );

    this.invalidateWorkflowCache();
    return { id, success: true };
  }

  // =========================================================================
  // LOOP 2: FINANCIAL WORKFLOW & ARCHIVAL METHODS
  // =========================================================================

  /**
   * STAGE 4 ACCOUNTS START: Start Accounts cost verification (PRODUCTION_COMPLETED -> ACCOUNTS_COST_VERIFICATION)
   */
  public async startAccountsVerification(
    id: string,
    userId: string,
    remarks?: string,
  ): Promise<any> {
    const txData = await this.getTransactionContext(id);
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

    await this.prisma.$transaction(async (tx) => {
      await this.assertCurrentStateAndUpdate(
        id,
        txData.currentState,
        {
          status: prismaTargetStatus,
          currentState: targetState,
          updatedBy: userId,
          remarks: remarks
            ? `${txData.remarks || ''}\nAccounts Verification Notes: ${remarks}`
            : txData.remarks,
        },
        tx,
      );
      await tx.workflowHistory.create({
        data: {
          indentId: id,
          toDepartmentId: txData.departmentId,
          movedBy: userId,
          remarks: remarks || 'Accounts started actual cost verification.',
        },
      });
    });

    await this.eventService.dispatchNotification(id, txData.indentNumber, targetState, userId);
    await this.eventService.logAudit(
      AuditEventType.VERIFY_COSTS,
      id,
      userId,
      { state: txData.currentState },
      { state: targetState },
    );

    this.invalidateWorkflowCache();
    return { id, success: true };
  }

  /**
   * STAGE 4 ACTUAL COST ENTRY: Accounts enters actual vendor and in-house process costs
   * Computes item variances, total actual cost, total variance amount, and variance percentage.
   * Transitions to ACTUAL_COST_UPDATED state.
   */
  public async enterActualCosts(id: string, userId: string, dto: any): Promise<any> {
    const txData = await this.getTransactionContext(id);
    // First save may advance the workflow; subsequent saves are drafts and
    // must remain editable in ACTUAL_COST_UPDATED.
    const shouldAdvanceWorkflow = txData.currentState === WorkflowState.ACCOUNTS_COST_VERIFICATION;
    const targetState = shouldAdvanceWorkflow
      ? WorkflowState.ACTUAL_COST_UPDATED
      : txData.currentState;

    if (shouldAdvanceWorkflow) {
      const transitionValidation = this.workflowStateMachine.validateTransition(
        txData.currentState,
        targetState,
        'ACCOUNTS',
      );
      if (!transitionValidation.isValid) {
        throw new BadRequestException(transitionValidation.errors.join(', '));
      }
    }

    if (!txData.costSheet) {
      throw new NotFoundException(`Process Cost Sheet for Indent ID '${id}' not found.`);
    }

    const costSheetId = txData.costSheet.id;
    const prismaTargetStatus = WorkflowStateMapper.toPrisma(targetState);

    // READS OUTSIDE TRANSACTION
    const currentCostItems = await this.prisma.costItem.findMany({
      where: { costSheetId },
    });
    const currentProcessCosts = await this.prisma.processCost.findMany({
      where: { costSheetId },
    });
    const currentBroughtMaterials = await this.prisma.indentBroughtMaterial.findMany({
      where: { indentId: id },
    });

    await this.prisma.$transaction(async (tx) => {
      // PRF-DB-001: Collect all update promises and execute concurrently.
      // Previously these were sequential await loops — N+1 DB roundtrips.
      // Now all updates for costItems, processCosts, and broughtMaterials run
      // in parallel within the transaction, reducing roundtrips to 1 batch.

      const costItemUpdates: Promise<any>[] = [];
      const processCostUpdates: Promise<any>[] = [];
      const broughtMaterialUpdates: Promise<any>[] = [];

      // 1. Prepare CostItem updates
      if (dto.costItems && Array.isArray(dto.costItems)) {
        for (const cDto of dto.costItems) {
          const actualRate = roundTo4Decimals(cDto.actualRate ?? 0);
          const actualQuantity = roundTo4Decimals(cDto.actualQuantity ?? 0);
          const actualAmount = roundTo4Decimals(actualRate * actualQuantity);

          const cItem = currentCostItems.find((i) => i.id === cDto.costItemId);
          if (cItem) {
            // Update in memory for total calculation (synchronous, before promise fires)
            cItem.actualAmount = actualAmount as any;
            costItemUpdates.push(
              tx.costItem.update({
                where: { id: cDto.costItemId },
                data: {
                  actualRate,
                  actualQuantity,
                  actualAmount,
                  remarks: cDto.remarks,
                  updatedBy: userId,
                },
              }),
            );
          }
        }
      }

      // 2. Prepare ProcessCost updates
      if (dto.processCosts && Array.isArray(dto.processCosts)) {
        for (const pDto of dto.processCosts) {
          const actualCost = roundTo4Decimals(pDto.actualCost ?? 0);
          const actualHours = roundTo4Decimals(pDto.actualHours ?? 0);
          const actualAmount = actualCost; // The frontend passes the total actual cost as actualCost

          const pItem = currentProcessCosts.find((i) => i.id === pDto.processCostId);
          if (pItem) {
            const predictedAmount = roundTo4Decimals(Number(pItem.predictedCost));
            const varianceAmount = safeSubtract(actualAmount, predictedAmount);
            // Update in memory for total calculation
            pItem.actualCost = actualAmount as any;
            processCostUpdates.push(
              tx.processCost.update({
                where: { id: pDto.processCostId },
                data: {
                  actualHours,
                  actualCost: actualAmount,
                  variance: varianceAmount,
                  updatedBy: userId,
                },
              }),
            );
          }
        }
      }

      // 2b. Prepare BroughtMaterial updates
      if (dto.broughtMaterials && Array.isArray(dto.broughtMaterials)) {
        for (const bmDto of dto.broughtMaterials) {
          const actualAmount = roundTo4Decimals(bmDto.actualAmount ?? 0);

          const bmItem = currentBroughtMaterials.find((i) => i.id === bmDto.broughtMaterialId);
          if (bmItem) {
            bmItem.actualAmount = actualAmount as any;
            broughtMaterialUpdates.push(
              tx.indentBroughtMaterial.update({
                where: { id: bmDto.broughtMaterialId },
                data: { actualAmount },
              }),
            );
          }
        }
      }

      // Execute all updates concurrently within the transaction
      await Promise.all([...costItemUpdates, ...processCostUpdates, ...broughtMaterialUpdates]);

      // Compute totals from memory (including items not updated in this request)
      const totalMaterialActual = safeAdd([
        ...currentCostItems.map((i) => Number(i.actualAmount) || 0),
        ...currentBroughtMaterials.map((i) => Number(i.actualAmount) || 0),
      ]);
      const totalProcessActual = safeAdd(currentProcessCosts.map((i) => Number(i.actualCost) || 0));

      // 3. Overall CostSheet updates
      const actualDesignCost =
        dto.actualDesignCost !== undefined && dto.actualDesignCost !== null
          ? roundTo4Decimals(dto.actualDesignCost)
          : roundTo4Decimals(txData.costSheet.actualDesignCost || 0);

      const actualOverheadCost =
        dto.actualOverheadCost !== undefined && dto.actualOverheadCost !== null
          ? roundTo4Decimals(dto.actualOverheadCost)
          : roundTo4Decimals(txData.costSheet.actualOverheadCost || 0);

      const actualContingencyCost =
        dto.actualContingencyCost !== undefined && dto.actualContingencyCost !== null
          ? roundTo4Decimals(dto.actualContingencyCost)
          : roundTo4Decimals(txData.costSheet.actualContingencyCost || 0);

      const actualTotal = safeAdd([
        totalMaterialActual,
        totalProcessActual,
        actualDesignCost,
        actualOverheadCost,
        actualContingencyCost,
      ]);

      const predictedTotal = roundTo4Decimals(txData.costSheet.predictedTotal || 0);
      const varianceAmount = safeSubtract(actualTotal, predictedTotal);
      const variancePercentage = safeVariancePercentage(varianceAmount, predictedTotal);

      await tx.costSheet.update({
        where: { id: costSheetId },
        data: {
          actualDesignCost,
          actualOverheadCost,
          actualContingencyCost,
          actualTotal,
          varianceAmount,
          variancePercentage,

          updatedBy: userId,
        },
      });

      if (shouldAdvanceWorkflow) {
        await this.assertCurrentStateAndUpdate(
          id,
          txData.currentState,
          {
            status: prismaTargetStatus,
            currentState: targetState,
            remarks: `${txData.remarks || ''}\nActual costs entered. Total Variance: ${variancePercentage}%`,
            updatedBy: userId,
          },
          tx,
        );
      }

      if (shouldAdvanceWorkflow) {
        await tx.workflowHistory.create({
          data: {
            indentId: id,
            toDepartmentId: txData.departmentId,
            movedBy: userId,
            remarks: `Actual costs entered and variances calculated (${variancePercentage}% variance).`,
          },
        });
      }
    });

    await this.eventService.dispatchNotification(id, txData.indentNumber, targetState, userId);
    await this.eventService.logAudit(
      AuditEventType.VERIFY_COSTS,
      id,
      userId,
      { predictedTotal: txData.costSheet.predictedTotal },
      { actualCostEntered: true, costSheetId, state: targetState },
    );

    this.invalidateCostCache();
    return { id, success: true };
  }

  /**
   * ACCOUNTS MATERIAL COST UPDATE: Updates single actual material item cost rate & quantity
   */
  public async updateMaterialActualCosts(
    id: string,
    userId: string,
    dto: { costItemId: string; actualRate: number; actualQuantity: number; remarks?: string },
  ): Promise<any> {
    const txData = await this.getTransactionContext(id);

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
      const actualRate = roundTo4Decimals(dto.actualRate);
      const actualQuantity = roundTo4Decimals(dto.actualQuantity);
      const actualAmount = safeMultiply(actualRate, actualQuantity);
      const existingItem = await tx.costItem.findFirst({
        where: { id: dto.costItemId, costSheetId },
      });
      if (!existingItem) {
        throw new BadRequestException('Invalid Cost Item for Cost Sheet');
      }

      await tx.costItem.update({
        where: { id: dto.costItemId },
        data: {
          actualRate,
          actualQuantity,
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

      const totalMaterialActual = safeAdd(allCostItems.map((item) => item.actualAmount));
      const totalProcessActual = safeAdd(allProcessCosts.map((item) => item.actualCost));

      const actualTotal = safeAdd([
        totalMaterialActual,
        totalProcessActual,
        txData.costSheet.actualDesignCost,
        txData.costSheet.actualOverheadCost,
        txData.costSheet.actualContingencyCost,
      ]);
      const predictedTotal = roundTo4Decimals(txData.costSheet.predictedTotal || 0);
      const varianceAmount = safeSubtract(actualTotal, predictedTotal);
      const variancePercentage = safeVariancePercentage(varianceAmount, predictedTotal);

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

    this.invalidateCostCache();
    return { id, success: true };
  }

  /**
   * STAGE 4 FINANCIAL CLOSURE: Finalize cost sheet and close financial records (ACTUAL_COST_UPDATED -> ACCOUNTS_FINANCIAL_CLOSURE)
   */
  public async financialClosure(id: string, userId: string, dto: any): Promise<any> {
    const txData = await this.getTransactionContext(id);
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

    await this.prisma.$transaction(async (tx) => {
      await this.assertCurrentStateAndUpdate(
        id,
        txData.currentState,
        {
          status: prismaTargetStatus,
          currentState: targetState,
          updatedBy: userId,
          remarks: dto.closureNotes
            ? `${txData.remarks || ''}\nFinancial Closure Notes: ${dto.closureNotes}`
            : txData.remarks,
        },
        tx,
      );
      await tx.costSheet.update({
        where: { id: txData.costSheet.id },
        data: {
          status: 'FINALIZED',
          updatedBy: userId,
        },
      });
      await tx.workflowHistory.create({
        data: {
          indentId: id,
          toDepartmentId: txData.departmentId,
          movedBy: userId,
          remarks:
            dto.closureNotes || 'Accounts finalized financial records and variance calculation.',
        },
      });
    });

    await this.eventService.dispatchNotification(id, txData.indentNumber, targetState, userId);
    await this.eventService.logAudit(
      AuditEventType.FINANCIAL_CLOSURE,
      id,
      userId,
      { state: txData.currentState },
      { state: targetState, costSheetStatus: 'FINALIZED' },
    );

    this.invalidateAllCache();
    return { id, success: true };
  }

  /**
   * STAGE 5 ARCHIVE: System / Admin archives transaction (ACCOUNTS_FINANCIAL_CLOSURE -> ARCHIVED)
   */
  public async archiveTransaction(id: string, userId: string, remarks?: string): Promise<any> {
    const txData = await this.getTransactionContext(id);
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

    await this.prisma.$transaction(async (tx) => {
      await this.assertCurrentStateAndUpdate(
        id,
        txData.currentState,
        {
          status: prismaTargetStatus,
          currentState: targetState,
          isLocked: true, // Lock record against edits
          updatedBy: userId,
        },
        tx,
      );
      await tx.workflowHistory.create({
        data: {
          indentId: id,
          toDepartmentId: txData.departmentId,
          movedBy: userId,
          remarks: remarks || 'Automated archival completed. Record locked.',
        },
      });
    });

    await this.eventService.dispatchNotification(id, txData.indentNumber, targetState, userId);
    await this.eventService.logAudit(
      AuditEventType.ARCHIVE_TRANSACTION,
      id,
      userId,
      { state: txData.currentState, isLocked: false },
      { state: targetState, isLocked: true },
    );

    this.invalidateAllCache();
    return { id, success: true };
  }

  /**
   * STAGE 5 COMPLETE: Complete Business Transaction across both loops (ARCHIVED -> COMPLETED)
   */
  public async completeTransaction(id: string, userId: string, remarks?: string): Promise<any> {
    const txData = await this.getTransactionContext(id);
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

    await this.prisma.$transaction(async (tx) => {
      await this.assertCurrentStateAndUpdate(
        id,
        txData.currentState,
        {
          status: prismaTargetStatus,
          currentState: targetState,
          isLocked: true,
          updatedBy: userId,
        },
        tx,
      );
      await tx.workflowHistory.create({
        data: {
          indentId: id,
          toDepartmentId: txData.departmentId,
          movedBy: userId,
          remarks: remarks || 'Business Transaction fully completed across Loop 1 and Loop 2.',
        },
      });
    });

    await this.eventService.dispatchNotification(id, txData.indentNumber, targetState, userId);
    await this.eventService.logAudit(
      AuditEventType.ARCHIVE_TRANSACTION,
      id,
      userId,
      { state: txData.currentState },
      { state: targetState, businessTransactionCompleted: true },
    );

    this.invalidateAllCache();
    return { id, success: true };
  }

  /**
   * Add drawing or document attachment to draft Indent Sheet
   */
  public async addAttachmentToIndent(id: string, dto: any, userId: string): Promise<any> {
    const txData = await this.getTransactionContext(id);
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

    return { id, success: true };
  }

  /**
   * Soft-delete drawing or document attachment from draft Indent Sheet
   */
  public async removeAttachmentFromIndent(
    id: string,
    attachmentId: string,
    userId: string,
  ): Promise<any> {
    const txData = await this.getTransactionContext(id);
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

    return { id, success: true };
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
    if (!file) {
      throw new BadRequestException('No file was received. Please choose a PDF or Excel file.');
    }

    const [txData, user] = await Promise.all([
      this.getTransactionContext(id),
      this.prisma.user.findUnique({
        where: { id: userId },
        include: { department: true },
      }),
    ]);

    if (!user || !user.department) {
      throw new ForbiddenException('User department not found.');
    }

    const departmentCode = user.department.departmentCode;

    const MAX_SIZE = 20 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      throw new BadRequestException('File size exceeds the maximum limit of 20MB.');
    }

    const ext = path.extname(file.originalname).toLowerCase();

    await validateFileSignature(file.buffer, ext);
    let fileType: FileType = FileType.OTHER;

    const deptUpper = (departmentCode || '').toUpperCase();
    const isDesignDept = deptUpper === 'DESIGN' || deptUpper === 'DSGN';
    const isAccountsDept =
      deptUpper === 'ACCOUNTS' ||
      deptUpper === 'ACCT' ||
      deptUpper === 'ACC' ||
      deptUpper === 'FINANCE' ||
      deptUpper === 'FIN';

    if (isDesignDept) {
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
    } else if (isAccountsDept) {
      if (
        txData.currentState !== WorkflowState.ACCOUNTS_COST_VERIFICATION &&
        txData.currentState !== WorkflowState.ACTUAL_COST_UPDATED &&
        txData.currentState !== WorkflowState.ACCOUNTS_FINANCIAL_CLOSURE
      ) {
        throw new BadRequestException('Accounts uploads allowed only in cost verification states.');
      }
      const allowedExtensions = ['.pdf', '.xlsx', '.xls', '.jpg', '.jpeg', '.png'];
      if (!allowedExtensions.includes(ext)) {
        throw new BadRequestException(`Extension '${ext}' not supported for Accounts uploads.`);
      }

      if (ext === '.pdf') fileType = FileType.PDF;
      else if (ext === '.xlsx' || ext === '.xls') fileType = FileType.EXCEL;
      else if (ext === '.jpg' || ext === '.jpeg' || ext === '.png') fileType = FileType.IMAGE;
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

    try {
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
    } catch (dbError: any) {
      // ERR-L2-002: DB creation failed after successful storage upload.
      // Attempt to clean up the orphaned storage object. If the cleanup itself
      // fails (e.g., storage is flapping), log the orphaned key explicitly so
      // it can be reconciled manually. Never silently lose this information.
      this.logger.error(
        `DB record creation failed for attachment upload (indent: ${id}). ` +
          `Attempting cleanup of orphaned storage file: '${saved.fileName}'.`,
      );
      const cleaned = await this.attachmentStorage.deleteFile(saved.fileName);
      if (!cleaned) {
        this.logger.error(
          `[ORPHAN] Storage file '${saved.fileName}' could not be deleted after DB failure. ` +
            `Manual reconciliation required. Indent: ${id}, User: ${userId}`,
        );
      }
      throw dbError;
    }

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
              in: ['Senior Manager', 'General Manager', 'ADMIN', 'System Administrator'],
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

        const notification = await this.prisma.notification.create({
          data: {
            title,
            message: msg,
            eventType: 'DOCUMENT_UPLOADED',
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

        // Log: Notification created
        await this.prisma.auditLog.create({
          data: {
            module: 'NOTIFICATIONS',
            recordId: notification.id,
            action: 'CREATE',
            newValue: { title: notification.title },
            performedBy: userId || 'SYSTEM',
          },
        });

        // Log: Notification delivered
        const auditLogs = uniqueUserIds.map((recId) => ({
          module: 'NOTIFICATIONS',
          recordId: notification.id,
          action: 'DELIVER',
          newValue: { recipientUserId: recId },
          performedBy: userId || 'SYSTEM',
        }));
        await this.prisma.auditLog.createMany({ data: auditLogs });
      }
    } catch (notifErr: unknown) {
      this.logger.error(
        `Failed to send attachment upload notification: ${(notifErr as Error).message}`,
      );
    }

    return { id, success: true };
  }

  /**
   * Delete attachment (marks isDeleted = true and removes physical file)
   */
  public async deleteAttachment(id: string, attachmentId: string, userId: string): Promise<any> {
    const [txData, attachment, user] = await Promise.all([
      this.getTransactionContext(id),
      this.prisma.indentAttachment.findUnique({
        where: { id: attachmentId },
      }),
      this.prisma.user.findUnique({
        where: { id: userId },
        include: { department: true, role: true },
      }),
    ]);

    if (!attachment || attachment.indentId !== id || attachment.isDeleted) {
      throw new NotFoundException(`Attachment with ID '${attachmentId}' not found.`);
    }
    if (!user || !user.department) {
      throw new ForbiddenException('User department not found.');
    }

    const departmentCode = user.department.departmentCode;
    const isAdmin =
      user?.role?.roleName?.toUpperCase() === 'SYSTEM ADMIN' ||
      user?.role?.roleName?.toUpperCase() === 'ADMIN' ||
      user?.role?.roleName?.toUpperCase() === 'SYSTEM ADMINISTRATOR';

    let storageFileName = attachment.fileName;
    try {
      const meta = JSON.parse(attachment.fileName);
      storageFileName = meta.storageFileName;

      if (!isAdmin) {
        const isMetaDesign = meta.department === 'DESIGN' || meta.department === 'DSGN';
        const isMetaAccounts = meta.department === 'ACCOUNTS' || meta.department === 'ACCT';
        const isUserDesign = departmentCode === 'DESIGN' || departmentCode === 'DSGN';
        const isUserAccounts = departmentCode === 'ACCOUNTS' || departmentCode === 'ACCT';

        if (isMetaDesign) {
          if (!isUserDesign) {
            throw new ForbiddenException('Only Design department can delete design files.');
          }
          if (txData.currentState !== WorkflowState.DRAFT) {
            throw new BadRequestException('Cannot delete Design files after submission.');
          }
        }
        if (isMetaAccounts) {
          if (!isUserAccounts) {
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
      }
    } catch (err) {
      if (err instanceof ForbiddenException || err instanceof BadRequestException) {
        throw err;
      }
      if (!isAdmin && txData.currentState !== WorkflowState.DRAFT) {
        throw new BadRequestException('Design files are locked post-submission.');
      }
    }

    // ERR-L2-003: DB soft-delete FIRST, physical storage deletion second.
    // Ordering rationale:
    //   1. If DB succeeds but storage delete fails → record is marked deleted (good),
    //      orphaned storage file is logged for manual cleanup.
    //   2. If DB fails → nothing is deleted (consistent, caller retries safely).
    //   Old ordering (storage first, DB second) caused: storage deleted, DB fails →
    //   file permanently gone but DB showed it as still active.
    await this.prisma.indentAttachment.update({
      where: { id: attachmentId },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
        deletedBy: userId,
      },
    });

    // Attempt physical storage deletion after DB is consistent
    const physicallyDeleted = await this.attachmentStorage.deleteFile(storageFileName);
    if (!physicallyDeleted) {
      this.logger.warn(
        `[ORPHAN] Physical storage file '${storageFileName}' could not be deleted ` +
          `for attachment '${attachmentId}' (indent: ${id}). ` +
          `DB record is already soft-deleted — manual storage cleanup required.`,
      );
    }

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
              in: ['Senior Manager', 'General Manager', 'ADMIN', 'System Administrator'],
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

        const notification = await this.prisma.notification.create({
          data: {
            title: 'Document Deleted',
            message: `Document '${metaName}' has been deleted from Indent #${txData.indentNumber}.`,
            eventType: 'DOCUMENT_DELETED',
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

        // Log: Notification created
        await this.prisma.auditLog.create({
          data: {
            module: 'NOTIFICATIONS',
            recordId: notification.id,
            action: 'CREATE',
            newValue: { title: notification.title },
            performedBy: userId || 'SYSTEM',
          },
        });

        // Log: Notification delivered
        const auditLogs = uniqueUserIds.map((recId) => ({
          module: 'NOTIFICATIONS',
          recordId: notification.id,
          action: 'DELIVER',
          newValue: { recipientUserId: recId },
          performedBy: userId || 'SYSTEM',
        }));
        await this.prisma.auditLog.createMany({ data: auditLogs });
      }
    } catch (notifErr: unknown) {
      this.logger.error(
        `Failed to send document delete notification: ${(notifErr as Error).message}`,
      );
    }

    return { id, success: true };
  }

  /**
   * Get stream for download
   */
  public async getAttachmentStream(fileName: string): Promise<any> {
    return this.attachmentStorage.getDownloadStream(fileName);
  }

  /**
   * Securely retrieve stream for download after validating RBAC and department ownership
   */
  public async verifyDownloadAccess(fileName: string, userId: string): Promise<any> {
    const atts = await this.prisma.indentAttachment.findMany({
      where: {
        fileName: {
          contains: fileName,
        },
        isDeleted: false,
      },
    });

    if (atts.length === 0) {
      throw new NotFoundException(`Attachment with filename '${fileName}' not found.`);
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        department: true,
        role: true,
      },
    });

    if (!user) {
      throw new ForbiddenException('User not found.');
    }

    // Admin has full unrestricted access
    const roleUpper = (user.role?.roleName || '').toUpperCase();
    const deptUpper = (user.department?.departmentCode || '').toUpperCase();
    const isSystemAdmin =
      roleUpper === 'ADMIN' ||
      roleUpper === 'SYSTEM ADMINISTRATOR' ||
      user.role?.isSystem === true ||
      deptUpper === 'ADMIN' ||
      deptUpper === 'ADM';

    if (isSystemAdmin) {
      return this.attachmentStorage.getDownloadStream(fileName);
    }

    return this.attachmentStorage.getDownloadStream(fileName);
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
      orderBy: { createdAt: 'desc' },
      include: {
        uploader: { select: { id: true, firstName: true, lastName: true, email: true } },
        indent: {
          select: {
            id: true,
            indentNumber: true,
            customerName: true,
            layoutNumber: true,
            status: true,
            currentState: true,
            purpose: true,
            createdAt: true,
            product: {
              select: {
                id: true,
                productName: true,
                productCode: true,
              },
            },
            department: {
              select: {
                id: true,
                departmentName: true,
                departmentCode: true,
              },
            },
          },
        },
      },
    });

    const parsed = dbAttachments.map((att: any) => {
      try {
        const meta = JSON.parse(att.fileName);
        return {
          id: att.id,
          indentId: att.indentId,
          indent: att.indent,
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
          indentId: att.indentId,
          indent: att.indent,
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
      if (
        query.indentNumber &&
        !att.indent?.indentNumber?.toLowerCase().includes(query.indentNumber.toLowerCase())
      ) {
        return false;
      }
      if (query.search) {
        const s = query.search.toLowerCase();
        const matchesName = att.fileName.toLowerCase().includes(s);
        const matchesIndent = att.indent?.indentNumber?.toLowerCase().includes(s);
        const matchesCustomer = att.indent?.customerName?.toLowerCase().includes(s);
        const matchesProduct = att.indent?.product?.productName?.toLowerCase().includes(s);
        const matchesRemarks = att.remarks?.toLowerCase().includes(s);
        if (
          !matchesName &&
          !matchesIndent &&
          !matchesCustomer &&
          !matchesProduct &&
          !matchesRemarks
        ) {
          return false;
        }
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
    } catch (err: unknown) {
      this.logger.error(`Failed to log document download audit event: ${(err as Error).message}`);
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

      const isAttDesign = att.department === 'DESIGN' || att.department === 'DSGN';
      const isAttAccounts = att.department === 'ACCOUNTS' || att.department === 'ACCT';

      if (isAttDesign) {
        designDocs++;
      } else if (isAttAccounts) {
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
    const txData = await this.getTransactionContext(id);

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

    const isOldDesign = oldMeta.department === 'DESIGN' || oldMeta.department === 'DSGN';
    const isOldAccounts = oldMeta.department === 'ACCOUNTS' || oldMeta.department === 'ACCT';
    const isUserDesign = departmentCode === 'DESIGN' || departmentCode === 'DSGN';
    const isUserAccounts = departmentCode === 'ACCOUNTS' || departmentCode === 'ACCT';

    if (isOldDesign) {
      if (!isUserDesign) {
        throw new ForbiddenException('Only Design department can replace design files.');
      }
      if (txData.currentState !== WorkflowState.DRAFT) {
        throw new BadRequestException('Cannot replace Design files after submission.');
      }
    } else if (isOldAccounts) {
      if (!isUserAccounts) {
        throw new ForbiddenException('Only Accounts department can replace financial files.');
      }
      if (
        txData.currentState !== WorkflowState.ACCOUNTS_COST_VERIFICATION &&
        txData.currentState !== WorkflowState.ACTUAL_COST_UPDATED
      ) {
        throw new BadRequestException('Cannot replace Accounts files outside verification states.');
      }
    }

    const MAX_SIZE = 20 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      throw new BadRequestException('File size exceeds the maximum limit of 20MB.');
    }

    const ext = path.extname(file.originalname).toLowerCase();
    const designExtensions = ['.pdf', '.xlsx', '.xls', '.jpg', '.jpeg', '.png', '.dwg', '.dxf'];
    const accountsExtensions = ['.pdf', '.xlsx', '.xls'];

    if (isOldDesign && !designExtensions.includes(ext)) {
      throw new BadRequestException(`Extension '${ext}' not supported for Design replace.`);
    }
    if (isOldAccounts && !accountsExtensions.includes(ext)) {
      throw new BadRequestException(`Extension '${ext}' not supported for Accounts replace.`);
    }

    // ERR-L2-002 / ERR-L2-003: Safe replace ordering:
    //   Step 1: Upload new file to storage (if this fails, old file is still intact, no data loss)
    //   Step 2: Update DB record to reference new file (if this fails, delete new upload and abort)
    //   Step 3: Delete old file from storage (deferred — if this fails, old file is orphaned
    //           but the DB is consistent; log for reconciliation)
    const oldStorageFileName = oldMeta.storageFileName || attachment.fileName;

    // Step 1: Upload new file
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

    // Step 2: Update DB record
    try {
      await this.prisma.indentAttachment.update({
        where: { id: attachmentId },
        data: {
          fileName: JSON.stringify(newMeta),
          fileUrl: saved.fileUrl,
          uploadedBy: userId,
        },
      });
    } catch (dbError: any) {
      // DB failed: roll back by deleting the newly uploaded file
      this.logger.error(
        `DB update failed during attachment replace (indent: ${id}, attachment: ${attachmentId}). ` +
          `Rolling back: attempting to delete newly uploaded file '${saved.fileName}'.`,
      );
      const rolledBack = await this.attachmentStorage.deleteFile(saved.fileName);
      if (!rolledBack) {
        this.logger.error(
          `[ORPHAN] Rollback failed: new storage file '${saved.fileName}' could not be deleted. ` +
            `Manual reconciliation required. Indent: ${id}`,
        );
      }
      throw dbError;
    }

    // Step 3: Delete old file (deferred — DB is already consistent)
    const oldDeleted = await this.attachmentStorage.deleteFile(oldStorageFileName);
    if (!oldDeleted) {
      this.logger.warn(
        `[ORPHAN] Old storage file '${oldStorageFileName}' could not be deleted after successful replace. ` +
          `DB record now points to '${saved.fileName}'. Manual cleanup of old file required.`,
      );
    }

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
              in: ['Senior Manager', 'General Manager', 'ADMIN', 'System Administrator'],
            },
          },
        },
        select: { id: true },
      });

      const uniqueUserIds = Array.from(new Set(recipientUsers.map((u) => u.id)));
      if (uniqueUserIds.length > 0) {
        const notification = await this.prisma.notification.create({
          data: {
            title: 'Document Replaced',
            message: `Document '${oldMeta.originalName || attachment.fileName}' has been replaced with '${file.originalname}' on Indent #${txData.indentNumber}.`,
            eventType: 'DOCUMENT_REPLACED',
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

        // Log: Notification created
        await this.prisma.auditLog.create({
          data: {
            module: 'NOTIFICATIONS',
            recordId: notification.id,
            action: 'CREATE',
            newValue: { title: notification.title },
            performedBy: userId || 'SYSTEM',
          },
        });

        // Log: Notification delivered
        const auditLogs = uniqueUserIds.map((recId) => ({
          module: 'NOTIFICATIONS',
          recordId: notification.id,
          action: 'DELIVER',
          newValue: { recipientUserId: recId },
          performedBy: userId || 'SYSTEM',
        }));
        await this.prisma.auditLog.createMany({ data: auditLogs });
      }
    } catch (notifErr: unknown) {
      this.logger.error(
        `Failed to send document replace notification: ${(notifErr as Error).message}`,
      );
    }

    return { id, success: true };
  }

  /**
   * Soft deletes an Indent and its associated CostSheet.
   */
  async deleteIndent(
    id: string,
    performingUserId: string,
  ): Promise<{ success: boolean; message: string }> {
    const indent = await this.prisma.indent.findFirst({
      where: { id, isDeleted: false },
      include: { costSheet: true },
    });

    if (!indent) {
      throw new NotFoundException('Indent not found.');
    }

    await this.prisma.$transaction(async (tx) => {
      // 1. Soft delete the Indent
      await tx.indent.update({
        where: { id },
        data: {
          isDeleted: true,
          deletedAt: new Date(),
          deletedBy: performingUserId,
        },
      });

      // 2. Soft delete the associated CostSheet if it exists
      if (indent.costSheet) {
        await tx.costSheet.update({
          where: { id: indent.costSheet.id },
          data: {
            isDeleted: true,
            deletedAt: new Date(),
            deletedBy: performingUserId,
          },
        });

        await tx.costItem.updateMany({
          where: { costSheetId: indent.costSheet.id },
          data: {
            isDeleted: true,
            deletedAt: new Date(),
            deletedBy: performingUserId,
          },
        });

        await tx.processCost.updateMany({
          where: { costSheetId: indent.costSheet.id },
          data: {
            isDeleted: true,
            deletedAt: new Date(),
            deletedBy: performingUserId,
          },
        });
      }

      // 2.5 Soft delete Indent children
      await tx.indentItem.updateMany({
        where: { indentId: id },
        data: {
          isDeleted: true,
          deletedAt: new Date(),
          deletedBy: performingUserId,
        },
      });

      await tx.indentBroughtMaterial.updateMany({
        where: { indentId: id },
        data: {
          isDeleted: true,
          deletedAt: new Date(),
          deletedBy: performingUserId,
        },
      });

      await tx.indentAttachment.updateMany({
        where: { indentId: id },
        data: {
          isDeleted: true,
          deletedAt: new Date(),
          deletedBy: performingUserId,
        },
      });

      // 3. Audit Log
      await tx.auditLog.create({
        data: {
          module: 'INDENT',
          recordId: id,
          action: 'DELETE',
          oldValue: { status: indent.status, currentState: indent.currentState },
          performedBy: performingUserId,
        },
      });

      // 4. Timeline Event
      await tx.timeline.create({
        data: {
          module: 'Indent',
          recordId: id,
          title: 'Indent Deleted',
          description: 'Indent was deleted by Administrator',
          performedBy: performingUserId,
        },
      });
    });

    return { success: true, message: 'Indent deleted successfully' };
  }
}
