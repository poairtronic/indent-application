import { Injectable, Logger, NotFoundException, Optional } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ItemIssuedDto } from './dto/item-issued.dto';
import {
  CommunicationEventBus,
  CommunicationEventType,
} from '../communication/events/communication-event.bus';
import { IndentStatus } from '@prisma/client';

@Injectable()
export class InternalService {
  private readonly logger = new Logger(InternalService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Optional() private readonly eventBus?: CommunicationEventBus,
  ) {}

  async handleItemIssued(dto: ItemIssuedDto): Promise<{
    success: boolean;
    indentNumber: string;
    updatedStatus: string;
  }> {
    // 1. Find indent — throw 404 if not found
    const indent = await this.prisma.indent.findUnique({
      where: { id: dto.indentId },
      include: {
        product: { select: { productName: true } },
      },
    });

    if (!indent) {
      throw new NotFoundException(`Indent with ID '${dto.indentId}' not found.`);
    }

    // 2. Resolve system user UUID for audit fields (must be valid UUID in schema)
    const systemUser = await this.prisma.user.findFirst({
      where: {
        role: {
          roleName: { in: ['Admin', 'ADMIN', 'System Administrator'] },
        },
        isDeleted: false,
      },
      select: { id: true },
    });
    const systemUserId = systemUser?.id || indent.createdBy;
    const issuedAt = dto.issuedAt ? new Date(dto.issuedAt) : new Date();

    // 3. Update the line item based on itemType
    if (dto.itemType === 'RAW_MATERIAL') {
      await this.prisma.indentItem.update({
        where: { id: dto.mercItemId },
        data: {
          issuedQuantity: { increment: dto.quantityIssued },
          status: dto.newItemStatus === 'ISSUED' ? 'ISSUED' : 'AVAILABLE',
          updatedBy: systemUserId,
          updatedAt: issuedAt,
          remarks: `Issued by ${dto.issuedByName} via RM`,
        },
      });
    } else {
      await this.prisma.indentBroughtMaterial.update({
        where: { id: dto.mercItemId },
        data: {
          issuedQuantity: { increment: dto.quantityIssued },
          status: dto.newItemStatus === 'ISSUED' ? 'ISSUED' : 'AVAILABLE',
          updatedBy: systemUserId,
          updatedAt: issuedAt,
        },
      });
    }

    // 4. Handle full issuance vs partial issuance
    if (dto.newIndentStatus === 'ISSUED') {
      const productionDept = await this.prisma.department.findFirst({
        where: { departmentCode: { in: ['PRODUCTION', 'PROD'] }, isDeleted: false },
      });

      const updatedRemarks = `${indent.remarks || ''}\n[MATERIALS_ISSUED] All items issued via RM/V-Smart by ${dto.issuedByName}.`;

      await this.prisma.$transaction(async (tx) => {
        await tx.indent.update({
          where: { id: indent.id },
          data: {
            status: IndentStatus.PENDING_STORES,
            currentState: 'MATERIALS_ISSUED',
            remarks: updatedRemarks,
            updatedBy: systemUserId,
            updatedAt: issuedAt,
          },
        });

        await tx.workflowHistory.create({
          data: {
            indentId: indent.id,
            toDepartmentId: productionDept ? productionDept.id : indent.departmentId,
            movedBy: systemUserId,
            remarks: `All material items have been issued from RM/V-Smart by ${dto.issuedByName}.`,
            movedAt: issuedAt,
          },
        });
      });

      // Trigger notifications to Production & Admin users
      try {
        const recipientUsers = await this.prisma.user.findMany({
          where: {
            isDeleted: false,
            status: 'ACTIVE',
            OR: [
              {
                role: {
                  roleName: { in: ['Admin', 'ADMIN', 'System Administrator'] },
                },
              },
              {
                department: {
                  departmentCode: { in: ['PRODUCTION', 'PROD'] },
                },
              },
              {
                role: {
                  roleName: { in: ['Senior Manager', 'General Manager'] },
                },
              },
            ],
          },
          select: { id: true },
        });

        const uniqueUserIds = Array.from(new Set(recipientUsers.map((u) => u.id)));

        if (uniqueUserIds.length > 0) {
          const notification = await this.prisma.notification.create({
            data: {
              title: `Materials Issued - Indent #${indent.indentNumber}`,
              message: `All materials for Indent #${indent.indentNumber} have been issued by ${dto.issuedByName} via RM and dispatched to Production.`,
              eventType: 'STORES_MATERIAL_ISSUED',
              type: 'INFO',
              priority: 'HIGH',
              referenceId: indent.id,
              referenceModule: 'Indent',
              createdBy: systemUserId,
              recipients: {
                create: uniqueUserIds.map((userId) => ({
                  userId,
                  isRead: false,
                  deliveryStatus: 'DELIVERED',
                })),
              },
            },
          });

          await this.prisma.auditLog.create({
            data: {
              module: 'NOTIFICATIONS',
              recordId: notification.id,
              action: 'CREATE',
              newValue: { title: notification.title },
              performedBy: systemUserId,
            },
          });
        }

        if (this.eventBus) {
          this.eventBus.emit(CommunicationEventType.MATERIAL_ISSUED, {
            indentId: indent.id,
            indentNumber: indent.indentNumber,
            productName: indent.product?.productName || 'Product',
            requestedBy: dto.issuedByName,
            issuedBy: dto.issuedByName,
            transactionUrl: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/transactions/${indent.id}`,
          });
        }
      } catch (notifyErr: any) {
        this.logger.warn(
          `Failed to dispatch notifications for Indent #${indent.indentNumber}: ${notifyErr.message}`,
        );
      }
    } else if (dto.newIndentStatus === 'PARTIAL') {
      // Partial issue: insert workflow history note
      await this.prisma.workflowHistory.create({
        data: {
          indentId: indent.id,
          toDepartmentId: indent.departmentId,
          movedBy: systemUserId,
          remarks: `Partial issue from RM/V-Smart by ${dto.issuedByName} (Item: ${dto.mercItemId}, Qty: ${dto.quantityIssued}).`,
          movedAt: issuedAt,
        },
      });
    }

    this.logger.log(
      `Item ${dto.mercItemId} (${dto.itemType}) issued via RM for Indent #${dto.indentNumber} (Status: ${dto.newIndentStatus}).`,
    );

    return {
      success: true,
      indentNumber: dto.indentNumber,
      updatedStatus: dto.newIndentStatus,
    };
  }

  /**
   * Returns all indents in DESIGN_COMPLETED, STORES_PROCESSING, or MATERIALS_ISSUED
   * formatted for RM/V-Smart stores sync.
   */
  async getPendingIndents(): Promise<any[]> {
    const indents = await this.prisma.indent.findMany({
      where: {
        currentState: { in: ['DESIGN_COMPLETED', 'STORES_PROCESSING', 'MATERIALS_ISSUED'] },
        isDeleted: false,
      },
      include: {
        indentItems: {
          include: { material: true, unit: true },
          where: { isDeleted: false },
        },
        broughtMaterials: {
          where: { isDeleted: false },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return indents.map((indent) => ({
      indentId: indent.id,
      indentNumber: indent.indentNumber,
      poNumber: (indent as any).poNumber || (indent as any).purpose || null,
      customerName: indent.customerName ?? null,
      layoutNumber: indent.layoutNumber ?? null,
      mercCurrentState: indent.currentState,
      lineItems: [
        ...(indent.indentItems ?? []).map((item: any) => {
          let itemRemarks: any = null;
          try {
            itemRemarks = item.remarks ? JSON.parse(item.remarks) : null;
          } catch {
            itemRemarks = null;
          }

          const rawSource = item.source ?? itemRemarks?.source ?? null;
          let source: string | null = null;
          let parsedVendorName: string | null = null;

          if (rawSource) {
            if (typeof rawSource === 'string' && rawSource.toLowerCase().startsWith('vendor')) {
              source = 'Vendor';
              const clean = rawSource
                .replace(/^Vendor:\s*/i, '')
                .replace(/^Vendor\s*-\s*/i, '')
                .trim();
              if (clean && clean.toLowerCase() !== 'vendor') {
                parsedVendorName = clean;
              }
            } else if (
              typeof rawSource === 'string' &&
              rawSource.toLowerCase().includes('in-house')
            ) {
              source = 'In-house';
            } else {
              source = rawSource;
            }
          }

          const vendorName =
            item.vendor?.vendorName ||
            item.vendor?.name ||
            item.vendorName ||
            parsedVendorName ||
            null;

          const materialName = item.material?.materialName || item.material?.name || null;
          const itemName = itemRemarks?.product || item.product || materialName || 'Unknown';

          return {
            mercItemId: item.id,
            itemType: 'RAW_MATERIAL',
            name: itemName,
            material: materialName,
            shape: item.shape ?? null,
            lengthMm: item.lengthMm ? Number(item.lengthMm) : null,
            widthMm: item.widthMm ? Number(item.widthMm) : null,
            heightMm: item.heightMm ? Number(item.heightMm) : null,
            diameterMm: item.diameterMm ? Number(item.diameterMm) : null,
            quantityRequired: Number(item.quantity),
            unit: item.unit?.unitName ?? item.unit?.name ?? null,
            source: source ?? item.source ?? null,
            vendorName,
          };
        }),
        ...(indent.broughtMaterials ?? []).map((item: any) => ({
          mercItemId: item.id,
          itemType: 'BROUGHT_OUT',
          name: item.name,
          material: item.specification ?? null,
          shape: null,
          lengthMm: null,
          widthMm: null,
          heightMm: null,
          diameterMm: null,
          quantityRequired: Number(item.quantity),
          unit: null,
          source: null,
          vendorName: null,
        })),
      ],
    }));
  }
}
