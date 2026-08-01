import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { WorkflowState, AuditEventType } from '../enums/workflow-state.enum';
import { NOTIFICATION_EVENT_RULES } from '../definitions/notification-event.definition';
import { AUDIT_EVENT_DEFINITIONS } from '../definitions/audit-event.definition';

@Injectable()
export class BusinessTransactionEventService {
  private readonly logger = new Logger(BusinessTransactionEventService.name);

  constructor(private readonly prisma: PrismaService) {}

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
