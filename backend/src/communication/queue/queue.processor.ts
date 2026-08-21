import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { observabilityEventBus } from '../../observability/observability-event-bus';
import { NodemailerProvider } from '../providers/nodemailer.provider';
import { TemplateEngine } from '../templates/template.engine';
import { QueueService } from './queue.service';
import { IJobPayload, EmailState } from './queue.constants';

@Injectable()
export class QueueProcessor {
  private readonly logger = new Logger(QueueProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly nodemailerProvider: NodemailerProvider,
    private readonly templateEngine: TemplateEngine,
    private readonly queueService: QueueService,
  ) {}

  /**
   * Processes a queued email job outbox transaction.
   * Compiles layouts, triggers transporter, updates metrics/DB logs, and triggers retry strategy on SMTP errors.
   */
  public async processJob(payload: IJobPayload): Promise<void> {
    this.logger.log(`Processing email job: ${payload.jobId} (Attempt: ${payload.retryCount + 1})`);
    const startTime = Date.now();

    // 1. Update DB outbox status to PROCESSING
    const logIds = payload.emailLogIds || [payload.jobId];
    await this.updateLogStatus(logIds, EmailState.PROCESSING);

    try {
      // 2. Render templates
      const html = this.templateEngine.render(payload.template, payload.payload);

      // 3. Dispatch via SMTP
      const mailPayload: any = {
        to: payload.recipients,
        subject: payload.subject,
        body: `MERC Notification. Please view in HTML mode.`,
        html,
        attachments: payload.attachments,
      };

      const result = await this.nodemailerProvider.sendEmail(mailPayload);
      const duration = Date.now() - startTime;

      // 4. Update logs as SENT/DELIVERED
      await this.finalizeLogStatus(logIds, EmailState.SENT, duration, result.messageId);
      this.logger.log(`Job ${payload.jobId} processed successfully in ${duration}ms`);
      observabilityEventBus.emit('notification.event', { action: 'delivered', success: true });
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error(
        `Error processing job ${payload.jobId} after ${duration}ms: ${error?.message || error}`,
        error?.stack,
      );

      // Throw error to trigger BullMQ native retry
      throw error;
    }
  }

  /**
   * Called by the Worker when an attempt fails and will be retried
   */
  public async handleRetry(
    payload: IJobPayload,
    errorMessage: string,
    attempt: number,
  ): Promise<void> {
    const logIds = payload.emailLogIds || [payload.jobId];
    await this.updateLogStatus(
      logIds,
      EmailState.RETRYING,
      `Retry #${attempt} scheduled. Error: ${errorMessage}`,
    );
    this.logger.log(`Job ${payload.jobId} failed attempt ${attempt}. Scheduled for retry.`);
    observabilityEventBus.emit('notification.event', {
      action: 'retried',
      success: false,
      attempt,
      error: errorMessage,
    });
  }

  /**
   * Called by the Worker when a job reaches maximum attempts (Final Failure)
   */
  public async handleFinalFailure(payload: IJobPayload, errorMessage: string): Promise<void> {
    const logIds = payload.emailLogIds || [payload.jobId];
    await this.updateLogStatus(logIds, EmailState.DEAD_LETTER, errorMessage);
    await this.queueService.addDeadJob(payload);
    this.logger.warn(`Max retries reached. Job ${payload.jobId} moved to DLQ.`);
    observabilityEventBus.emit('notification.event', {
      action: 'failed',
      success: false,
      error: `Max retries reached: ${errorMessage}`,
    });
  }

  // ──────────────────────────────────────────────────────────────
  // LOGGINGS & STATUS PERSISTENCE HELPER METHODS
  // ──────────────────────────────────────────────────────────────

  private async updateLogStatus(
    logIds: string[],
    status: EmailState,
    errorMessage?: string,
  ): Promise<void> {
    try {
      if (!logIds || logIds.length === 0) return;
      await this.prisma.emailLog.updateMany({
        where: { id: { in: logIds } },
        data: {
          status,
          errorMessage: errorMessage || null,
        },
      });
    } catch (err) {
      this.logger.error(`Database log update failed for jobs`, err);
    }
  }

  private async finalizeLogStatus(
    logIds: string[],
    status: EmailState,
    durationMs: number,
    messageId?: string,
  ): Promise<void> {
    try {
      if (!logIds || logIds.length === 0) return;
      await this.prisma.emailLog.updateMany({
        where: { id: { in: logIds } },
        data: {
          status,
          errorMessage: null,
          retryCount: { increment: 1 },
          sentAt: new Date(),
          durationMs,
          messageId: messageId || null,
        },
      });
    } catch (err) {
      this.logger.error(`Database log finalize failed for jobs`, err);
    }
  }
}
