import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { WorkflowState, AuditEventType } from '../enums/workflow-state.enum';
import { NOTIFICATION_EVENT_RULES } from '../definitions/notification-event.definition';
import { AUDIT_EVENT_DEFINITIONS } from '../definitions/audit-event.definition';
import {
  CommunicationEventBus,
  CommunicationEventType,
} from '../../communication/events/communication-event.bus';

@Injectable()
export class BusinessTransactionEventService {
  private readonly logger = new Logger(BusinessTransactionEventService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventBus: CommunicationEventBus,
  ) {}

  /**
   * Dispatches Notification events to target department users and broadcasts to SM & GM executive roles.
   */
  public async dispatchNotification(
    indentId: string,
    indentNumber: string,
    toState: WorkflowState,
    triggeredByUserId: string,
  ): Promise<void> {
    const rule = NOTIFICATION_EVENT_RULES[toState];
    if (!rule) {
      return;
    }

    try {
      // Find executive roles (Senior Manager, General Manager) and target department users
      const recipientUsers = await this.prisma.user.findMany({
        where: {
          isDeleted: false,
          status: 'ACTIVE',
          OR: [
            {
              role: {
                roleName: {
                  in: ['Senior Manager', 'General Manager', 'ADMIN', 'System Administrator'],
                },
              },
            },
            ...(rule.targetDepartmentCode
              ? [
                  {
                    department: {
                      departmentCode: rule.targetDepartmentCode,
                    },
                  },
                ]
              : []),
          ],
        },
        select: { id: true },
      });

      const uniqueUserIds = Array.from(new Set(recipientUsers.map((u) => u.id)));
      if (uniqueUserIds.length === 0) {
        return;
      }

      const formattedTitle = rule.templateTitle;
      const formattedMessage = rule.templateMessage
        .replace('{indentNumber}', indentNumber)
        .replace('{productName}', 'Product Specification');

      const notification = await this.prisma.notification.create({
        data: {
          title: formattedTitle,
          message: formattedMessage,
          type: 'INFO',
          priority: 'MEDIUM',
          referenceId: indentId,
          referenceModule: 'Indent',
          createdBy: triggeredByUserId,
          recipients: {
            create: uniqueUserIds.map((userId) => ({
              userId,
              isRead: false,
              deliveryStatus: 'DELIVERED',
            })),
          },
        },
      });

      this.logger.log(
        `Dispatched Notification '${notification.title}' (ID: ${notification.id}) to ${uniqueUserIds.length} recipients for Indent #${indentNumber}.`,
      );

      // ────────────────────────────────────────────────────────
      // Emit CommunicationEvent for Asynchronous Email Queueing
      // ────────────────────────────────────────────────────────
      const indent = await this.prisma.indent.findUnique({
        where: { id: indentId },
        include: {
          creator: { select: { firstName: true, lastName: true } },
          product: { select: { productName: true } },
        },
      });

      const productName = indent?.product?.productName || 'Product';
      const requestedBy = indent?.creator
        ? `${indent.creator.firstName} ${indent.creator.lastName}`
        : 'System';

      let commType: CommunicationEventType | null = null;
      const context: Record<string, any> = {
        indentId,
        indentNumber,
        productName,
        requestedBy,
        purpose: indent?.purpose || 'Production requirements',
        transactionUrl: `http://localhost:5173/transactions/${indentId}`,
        correlationId: notification.id,
      };

      switch (toState) {
        case WorkflowState.DESIGN_COMPLETED:
          commType = CommunicationEventType.DESIGN_COMPLETED;
          context.designedBy = requestedBy;
          break;
        case WorkflowState.STORES_PROCESSING:
          commType = CommunicationEventType.STORES_PENDING;
          break;
        case WorkflowState.MATERIALS_ISSUED:
          commType = CommunicationEventType.MATERIAL_ISSUED;
          context.issuedBy = requestedBy;
          break;
        case WorkflowState.PRODUCTION_PROCESSING:
          commType = CommunicationEventType.PRODUCTION_STARTED;
          break;
        case WorkflowState.PRODUCTION_COMPLETED:
          commType = CommunicationEventType.PRODUCTION_COMPLETED;
          break;
        case WorkflowState.CUSTOMER_DELIVERED:
          commType = CommunicationEventType.CUSTOMER_DELIVERED;
          break;
        case WorkflowState.ACCOUNTS_FINANCIAL_CLOSURE: {
          commType = CommunicationEventType.FINANCIAL_CLOSURE;
          const costSheet = await this.prisma.costSheet.findFirst({ where: { indentId } });
          context.plannedTotal = costSheet?.predictedTotal ? Number(costSheet.predictedTotal) : 0;
          context.actualTotal = costSheet?.actualTotal ? Number(costSheet.actualTotal) : 0;
          context.varianceAmount = costSheet?.varianceAmount ? Number(costSheet.varianceAmount) : 0;
          context.variancePercentage = costSheet?.variancePercentage
            ? Number(costSheet.variancePercentage)
            : 0;
          break;
        }
      }

      if (commType) {
        this.eventBus.emit(commType, context);
      }
    } catch (error) {
      this.logger.error(
        `Failed to dispatch notification for Indent #${indentNumber} to state ${toState}: ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * Logs an AuditLog record in Neon PostgreSQL database.
   */
  public async logAudit(
    auditType: AuditEventType,
    recordId: string,
    performedByUserId: string,
    oldValue: Record<string, any> | null,
    newValue: Record<string, any> | null,
    ipAddress?: string,
  ): Promise<void> {
    const auditDef = AUDIT_EVENT_DEFINITIONS[auditType];
    const moduleName = auditDef ? auditDef.moduleName : 'BUSINESS_TRANSACTION';
    const actionCode = auditDef ? auditDef.actionCode : auditType;

    try {
      await this.prisma.auditLog.create({
        data: {
          module: moduleName,
          recordId,
          action: actionCode,
          oldValue: oldValue ? JSON.parse(JSON.stringify(oldValue)) : null,
          newValue: newValue ? JSON.parse(JSON.stringify(newValue)) : null,
          performedBy: performedByUserId,
          ipAddress: ipAddress || '127.0.0.1',
        },
      });
      this.logger.log(
        `Audit Log recorded: Action '${actionCode}' on Record '${recordId}' by User '${performedByUserId}'.`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to record audit log for action ${actionCode}: ${error.message}`,
        error.stack,
      );
    }
  }
}
