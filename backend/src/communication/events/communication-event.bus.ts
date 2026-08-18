import { Injectable, Logger } from '@nestjs/common';
import { Subject } from 'rxjs';

export enum CommunicationEventType {
  USER_REGISTERED = 'USER_REGISTERED',
  EMAIL_VERIFICATION = 'EMAIL_VERIFICATION',
  PASSWORD_RESET = 'PASSWORD_RESET',
  PASSWORD_CHANGED = 'PASSWORD_CHANGED',
  ACCOUNT_ACTIVATED = 'ACCOUNT_ACTIVATED',
  ACCOUNT_DISABLED = 'ACCOUNT_DISABLED',
  INDENT_SUBMITTED = 'INDENT_SUBMITTED',
  DESIGN_COMPLETED = 'DESIGN_COMPLETED',
  STORES_PENDING = 'STORES_PENDING',
  MATERIAL_ISSUED = 'MATERIAL_ISSUED',
  PRODUCTION_STARTED = 'PRODUCTION_STARTED',
  PRODUCTION_COMPLETED = 'PRODUCTION_COMPLETED',
  CUSTOMER_DELIVERED = 'CUSTOMER_DELIVERED',
  ACCOUNTS_COST_VERIFICATION = 'ACCOUNTS_COST_VERIFICATION',
  ACTUAL_COST_UPDATED = 'ACTUAL_COST_UPDATED',
  FINANCIAL_CLOSURE = 'FINANCIAL_CLOSURE',
  TRANSACTION_ARCHIVED = 'TRANSACTION_ARCHIVED',
  TRANSACTION_COMPLETED = 'TRANSACTION_COMPLETED',
  DOCUMENT_UPLOADED = 'DOCUMENT_UPLOADED',
  DOCUMENT_DELETED = 'DOCUMENT_DELETED',
  DOCUMENT_REPLACED = 'DOCUMENT_REPLACED',
  SYSTEM_ALERT = 'SYSTEM_ALERT',
}

export interface ICommunicationEvent<T = any> {
  type: CommunicationEventType;
  payload: T;
}

@Injectable()
export class CommunicationEventBus {
  private readonly bus$ = new Subject<ICommunicationEvent>();
  private readonly logger = new Logger(CommunicationEventBus.name);

  /**
   * Publishes a communication event to the asynchronous bus.
   */
  public emit<T>(type: CommunicationEventType, payload: T): void {
    this.logger.log(`Publishing communication event: ${type}`);
    this.bus$.next({ type, payload });
  }

  /**
   * Returns the event stream for subscribers.
   */
  public getStream() {
    return this.bus$.asObservable();
  }
}
