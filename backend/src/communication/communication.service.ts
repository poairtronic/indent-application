import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { observabilityEventBus } from '../observability/observability-event-bus';
import { TemplateEngine } from './templates/template.engine';
import { RecipientResolver, IResolverQuery } from './resolver/recipient.resolver';
import { QueueService } from './queue/queue.service';
import { IJobPayload } from './queue/queue.constants';
import * as crypto from 'crypto';

export interface ISendEmailOptions {
  to: string | string[] | IResolverQuery;
  subject: string;
  templateName: string;
  templateContext?: Record<string, any>;
  cc?: string | string[];
  bcc?: string | string[];
  attachments?: any[];
  replyTo?: string;
  priority?: number; // 1 = High, 5 = Low
  requestedBy?: string;
  correlationId?: string;
}

@Injectable()
export class CommunicationService {
  private readonly logger = new Logger(CommunicationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly templateEngine: TemplateEngine,
    private readonly recipientResolver: RecipientResolver,
    private readonly queueService: QueueService,
  ) {}

  /**
   * Main entrypoint to dispatch emails asynchronously via the BullMQ/Redis pipeline.
   * Resolves target addresses, logs transactions as QUEUED in DB, constructs job payload, and pushes to redis queue.
   */
  public async sendEmail(
    options: ISendEmailOptions,
  ): Promise<{ success: boolean; jobId?: string }> {
    this.logger.log(`Received sendEmail queue request for template: ${options.templateName}`);

    // 1. Resolve recipients
    let recipients: string[] = [];
    if (typeof options.to === 'string') {
      recipients = [options.to];
    } else if (Array.isArray(options.to)) {
      recipients = options.to;
    } else {
      recipients = await this.recipientResolver.resolve(options.to);
    }

    if (recipients.length === 0) {
      this.logger.warn('Recipient list is empty. Aborting queue dispatch.');
      return { success: false };
    }

    const jobId = crypto.randomUUID();
    const correlationId = options.correlationId || crypto.randomUUID();

    // 2. Pre-save log records in QUEUED state
    const bodyText = `IMCMS Notification. Please view in HTML mode.`;
    await this.saveEmailLogs(jobId, recipients, options, bodyText, 'QUEUED');
    observabilityEventBus.emit('notification.event', { action: 'created', success: true });

    // 3. Construct queue job payload
    const jobPayload: IJobPayload = {
      jobId,
      recipient: recipients[0],
      recipients,
      template: options.templateName,
      subject: options.subject,
      businessEvent: options.templateContext?.event || 'MANUAL',
      payload: options.templateContext || {},
      attachments: options.attachments,
      priority: options.priority || 3, // default medium
      retryCount: 0,
      createdTime: new Date().toISOString(),
      requestedBy: options.requestedBy || 'SYSTEM',
      correlationId,
    };

    // 4. Push to BullMQ queue
    try {
      await this.queueService.addJob(jobPayload);
      this.logger.log(`Job ${jobId} successfully queued.`);
      return {
        success: true,
        jobId,
      };
    } catch (err: any) {
      this.logger.error(`Failed to queue job ${jobId}`, err);
      await this.updateLogStatus(jobId, 'FAILED', err?.message || String(err));
      observabilityEventBus.emit('notification.event', {
        action: 'queue_failure',
        success: false,
        error: err.message || String(err),
      });
      return {
        success: false,
      };
    }
  }

  private async updateLogStatus(
    jobId: string,
    status: string,
    errorMessage?: string,
  ): Promise<void> {
    try {
      await this.prisma.emailLog.updateMany({
        where: { id: jobId },
        data: { status, errorMessage: errorMessage || null },
      });
    } catch (err) {
      this.logger.error(`Database log status update failed for job ${jobId}`, err);
    }
  }

  private async saveEmailLogs(
    jobId: string,
    recipients: string[],
    options: ISendEmailOptions,
    body: string,
    status: string,
  ): Promise<void> {
    try {
      const logPromises = recipients.map(async (recipient) => {
        const matchedUser = await this.prisma.user.findFirst({
          where: { email: { equals: recipient.trim(), mode: 'insensitive' }, isDeleted: false },
          select: { id: true },
        });

        return this.prisma.emailLog.create({
          data: {
            id: jobId,
            to: recipient,
            userId: matchedUser?.id || null,
            subject: options.subject,
            body: body,
            status: status,
            cc: options.cc
              ? Array.isArray(options.cc)
                ? options.cc.join(', ')
                : options.cc
              : null,
            bcc: options.bcc
              ? Array.isArray(options.bcc)
                ? options.bcc.join(', ')
                : options.bcc
              : null,
          },
        });
      });

      await Promise.all(logPromises);
    } catch (dbError) {
      this.logger.error(
        'Failed to write email transaction logs to Database',
        dbError?.stack || dbError,
      );
    }
  }
}
