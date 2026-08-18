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
   * Runs asynchronously in the background so it does not block the transition request-response lifecycle.
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

    this.runDispatchNotificationBackground(
      indentId,
      indentNumber,
      toState,
      triggeredByUserId,
      rule,
    ).catch((error) => {
      this.logger.error(
        `Failed in background dispatch notification for Indent #${indentNumber} to state ${toState}: ${error.message}`,
        error.stack,
      );
    });
  }

  private async runDispatchNotificationBackground(
    indentId: string,
    indentNumber: string,
    toState: WorkflowState,
    triggeredByUserId: string,
    rule: any,
  ): Promise<void> {
    try {
      // Determine allowed departments and whether to broadcast to managers for this state
      const targetDepts: string[] = [];
      let isManagerEvent = false;

      switch (toState) {
        case WorkflowState.DESIGN_COMPLETED:
        case WorkflowState.STORES_PROCESSING:
          targetDepts.push('STORES', 'STOR');
          break;
        case WorkflowState.MATERIALS_ISSUED:
        case WorkflowState.PRODUCTION_PROCESSING:
          targetDepts.push('PRODUCTION', 'PROD');
          break;
        case WorkflowState.PRODUCTION_COMPLETED:
        case WorkflowState.CUSTOMER_DELIVERED:
        case WorkflowState.ACCOUNTS_COST_VERIFICATION:
          targetDepts.push('ACCOUNTS', 'ACCT');
          break;
        case WorkflowState.ACTUAL_COST_UPDATED:
          targetDepts.push('DESIGN', 'DSGN', 'ACCOUNTS', 'ACCT');
          isManagerEvent = true;
          break;
        case WorkflowState.ACCOUNTS_FINANCIAL_CLOSURE:
        case WorkflowState.ARCHIVED:
        case WorkflowState.COMPLETED:
          isManagerEvent = true;
          break;
        default:
          break;
      }

      // Find recipient users
      const recipientUsers = await this.prisma.user.findMany({
        where: {
          isDeleted: false,
          status: 'ACTIVE',
          OR: [
            // Admin always receives everything
            {
              role: {
                roleName: {
                  in: ['ADMIN', 'System Administrator'],
                },
              },
            },
            // Managers receive monitoring events
            ...(isManagerEvent
              ? [
                  {
                    role: {
                      roleName: {
                        in: ['Senior Manager', 'General Manager'],
                      },
                    },
                  },
                ]
              : []),
            // Departments receive operational events
            ...(targetDepts.length > 0
              ? [
                  {
                    department: {
                      departmentCode: {
                        in: targetDepts,
                      },
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

      // Log: Notification created
      await this.prisma.auditLog.create({
        data: {
          module: 'NOTIFICATIONS',
          recordId: notification.id,
          action: 'CREATE',
          newValue: { title: notification.title },
          performedBy: triggeredByUserId || 'SYSTEM',
        },
      });

      // Log: Notification delivered for each recipient (bulk asynchronous insert)
      if (uniqueUserIds.length > 0) {
        const auditLogData = uniqueUserIds.map((recId) => ({
          module: 'NOTIFICATIONS',
          recordId: notification.id,
          action: 'DELIVER',
          newValue: { recipientUserId: recId } as any,
          performedBy: triggeredByUserId || 'SYSTEM',
          ipAddress: '127.0.0.1',
        }));
        await this.prisma.auditLog.createMany({ data: auditLogData });
      }

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
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      const context: Record<string, any> = {
        indentId,
        indentNumber,
        productName,
        requestedBy,
        purpose: indent?.purpose || 'Production requirements',
        transactionUrl: `${frontendUrl}/transactions/${indentId}`,
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

    // Execute asynchronously in the background so it doesn't block the request path
    this.prisma.auditLog
      .create({
        data: {
          module: moduleName,
          recordId,
          action: actionCode,
          oldValue: oldValue ? JSON.parse(JSON.stringify(oldValue)) : null,
          newValue: newValue ? JSON.parse(JSON.stringify(newValue)) : null,
          performedBy: performedByUserId,
          ipAddress: ipAddress || '127.0.0.1',
        },
      })
      .then(() => {
        this.logger.log(
          `Audit Log recorded: Action '${actionCode}' on Record '${recordId}' by User '${performedByUserId}'.`,
        );
      })
      .catch((error) => {
        this.logger.error(
          `Failed to record audit log for action ${actionCode}: ${error.message}`,
          error.stack,
        );
      });
  }
}
