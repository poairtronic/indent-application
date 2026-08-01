import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Subscription } from 'rxjs';
import {
  CommunicationEventBus,
  CommunicationEventType,
  ICommunicationEvent,
} from '../events/communication-event.bus';
import { CommunicationService } from '../communication.service';

@Injectable()
export class NotificationDispatcher implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(NotificationDispatcher.name);
  private subscription: Subscription | null = null;

  constructor(
    private readonly eventBus: CommunicationEventBus,
    private readonly communicationService: CommunicationService,
  ) {}

  public onModuleInit(): void {
    this.logger.log('Subscribing NotificationDispatcher to CommunicationEventBus stream...');
    this.subscription = this.eventBus.getStream().subscribe({
      next: (event) => this.handleEvent(event),
      error: (err) => this.logger.error('Error on event stream subscription', err),
    });
  }

  public onModuleDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
      this.logger.log('NotificationDispatcher subscription cleared.');
    }
  }

  private async handleEvent(event: ICommunicationEvent): Promise<void> {
    const { type, payload } = event;
    this.logger.log(`Dispatching event payload for type: ${type}`);

    try {
      switch (type) {
        // ────────────────────────────────────────────────────────
        // AUTHENTICATION EVENTS
        // ────────────────────────────────────────────────────────
        case CommunicationEventType.USER_REGISTERED:
          await this.communicationService.sendEmail({
            to: payload.email,
            subject: 'Welcome to IMCMS ERP Portal',
            templateName: 'welcome',
            templateContext: {
              name: `${payload.firstName} ${payload.lastName}`,
              employeeCode: payload.employeeCode,
              department: payload.departmentName,
              role: payload.roleName,
              loginUrl: payload.loginUrl,
            },
          });
          break;

        case CommunicationEventType.EMAIL_VERIFICATION:
          await this.communicationService.sendEmail({
            to: payload.email,
            subject: 'Verify Your Email Address',
            templateName: 'verify_email',
            templateContext: {
              name: payload.name,
              verificationUrl: payload.verificationUrl,
            },
          });
          break;

        case CommunicationEventType.PASSWORD_RESET:
          await this.communicationService.sendEmail({
            to: payload.email,
            subject: 'Reset Password Request',
            templateName: 'password_reset',
            templateContext: {
              name: payload.name,
              resetUrl: payload.resetUrl,
            },
          });
          break;

        case CommunicationEventType.PASSWORD_CHANGED:
          await this.communicationService.sendEmail({
            to: payload.email,
            subject: 'Password Changed Successfully',
            templateName: 'password_changed',
            templateContext: {
              name: payload.name,
              changeDate: payload.changeDate || new Date().toLocaleString(),
              securityUrl: payload.securityUrl,
            },
          });
          break;

        case CommunicationEventType.ACCOUNT_ACTIVATED:
          await this.communicationService.sendEmail({
            to: payload.email,
            subject: 'Your Account Has Been Activated',
            templateName: 'account_activated',
            templateContext: {
              name: payload.name,
              role: payload.roleName,
              loginUrl: payload.loginUrl,
            },
          });
          break;

        case CommunicationEventType.ACCOUNT_DISABLED:
          await this.communicationService.sendEmail({
            to: payload.email,
            subject: 'Your Account Has Been Suspended',
            templateName: 'account_disabled',
            templateContext: {
              name: payload.name,
              reason: payload.reason,
            },
          });
          break;

        // ────────────────────────────────────────────────────────
        // MANUFACTURING WORKFLOW EVENTS
        // ────────────────────────────────────────────────────────
        case CommunicationEventType.INDENT_SUBMITTED:
          await this.communicationService.sendEmail({
            to: { departmentCode: 'DESIGN' }, // resolve designers to process layout specs
            subject: `Indent Submitted: #${payload.indentNumber}`,
            templateName: 'indent_submitted',
            templateContext: {
              indentNumber: payload.indentNumber,
              productName: payload.productName,
              requestedBy: payload.requestedBy,
              purpose: payload.purpose,
              transactionUrl: payload.transactionUrl,
            },
            correlationId: payload.correlationId,
          });
          break;

        case CommunicationEventType.DESIGN_COMPLETED:
          await this.communicationService.sendEmail({
            to: { departmentCode: 'STORES' }, // resolve stores to check stocks
            subject: `Design Specs Completed: #${payload.indentNumber}`,
            templateName: 'design_completed',
            templateContext: {
              indentNumber: payload.indentNumber,
              productName: payload.productName,
              designedBy: payload.designedBy,
              transactionUrl: payload.transactionUrl,
            },
            correlationId: payload.correlationId,
          });
          break;

        case CommunicationEventType.STORES_PENDING:
          await this.communicationService.sendEmail({
            to: { departmentCode: 'STORES' },
            subject: `Stock Check Pending: #${payload.indentNumber}`,
            templateName: 'stores_pending',
            templateContext: {
              indentNumber: payload.indentNumber,
              productName: payload.productName,
              transactionUrl: payload.transactionUrl,
            },
            correlationId: payload.correlationId,
          });
          break;

        case CommunicationEventType.MATERIAL_ISSUED:
          await this.communicationService.sendEmail({
            to: { departmentCode: 'PRODUCTION' }, // notify production team
            subject: `Materials Issued for Indent: #${payload.indentNumber}`,
            templateName: 'material_issued',
            templateContext: {
              indentNumber: payload.indentNumber,
              productName: payload.productName,
              issuedBy: payload.issuedBy,
              transactionUrl: payload.transactionUrl,
            },
            correlationId: payload.correlationId,
          });
          break;

        case CommunicationEventType.PRODUCTION_STARTED:
          await this.communicationService.sendEmail({
            to: { indentId: payload.indentId }, // notify creator
            subject: `Production Started: #${payload.indentNumber}`,
            templateName: 'production_started',
            templateContext: {
              indentNumber: payload.indentNumber,
              productName: payload.productName,
              transactionUrl: payload.transactionUrl,
            },
            correlationId: payload.correlationId,
          });
          break;

        case CommunicationEventType.PRODUCTION_COMPLETED:
          await this.communicationService.sendEmail({
            to: { roleName: 'Senior Manager' }, // notify manager to view shipping details
            subject: `Production Completed: #${payload.indentNumber}`,
            templateName: 'production_completed',
            templateContext: {
              indentNumber: payload.indentNumber,
              productName: payload.productName,
              transactionUrl: payload.transactionUrl,
            },
            correlationId: payload.correlationId,
          });
          break;

        case CommunicationEventType.CUSTOMER_DELIVERED:
          await this.communicationService.sendEmail({
            to: { departmentCode: 'ACCOUNTS' }, // notify accounts to verify costs
            subject: `Delivered to Customer: #${payload.indentNumber}`,
            templateName: 'customer_delivered',
            templateContext: {
              indentNumber: payload.indentNumber,
              productName: payload.productName,
              transactionUrl: payload.transactionUrl,
            },
            correlationId: payload.correlationId,
          });
          break;

        // ────────────────────────────────────────────────────────
        // ACCOUNTS EVENTS
        // ────────────────────────────────────────────────────────
        case CommunicationEventType.FINANCIAL_CLOSURE:
          await this.communicationService.sendEmail({
            to: { roleName: 'General Manager' }, // notify executives of closure
            subject: `Financial Closure Completed: #${payload.indentNumber}`,
            templateName: 'financial_closure',
            templateContext: {
              indentNumber: payload.indentNumber,
              plannedTotal: payload.plannedTotal,
              actualTotal: payload.actualTotal,
              varianceAmount: payload.varianceAmount,
              variancePercentage: payload.variancePercentage,
              transactionUrl: payload.transactionUrl,
            },
            correlationId: payload.correlationId,
          });
          break;

        // ────────────────────────────────────────────────────────
        // SYSTEM ALERTS
        // ────────────────────────────────────────────────────────
        case CommunicationEventType.SYSTEM_ALERT:
          await this.communicationService.sendEmail({
            to: payload.to,
            subject: `[SYSTEM ALERT] ${payload.alertTitle}`,
            templateName: payload.alertType, // smtp_failure, queue_failure, template_failure
            templateContext: payload.context,
          });
          break;

        default:
          this.logger.warn(`Unregistered communication event type skipped: ${type}`);
          break;
      }
    } catch (err) {
      this.logger.error(
        `Failed executing notification dispatch for event '${type}': ${err?.message || err}`,
        err?.stack,
      );
    }
  }
}
