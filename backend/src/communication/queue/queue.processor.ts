import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
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
    await this.updateLogStatus(payload.jobId, EmailState.PROCESSING);

    try {
      // 2. Render templates
      const html = this.templateEngine.render(payload.template, payload.payload);

      // 3. Dispatch via SMTP
      const mailPayload: any = {
        to: payload.recipients,
        subject: payload.subject,
        body: `IMCMS Notification. Please view in HTML mode.`,
        html,
        attachments: payload.attachments,
      };

      const result = await this.nodemailerProvider.sendEmail(mailPayload);
      const duration = Date.now() - startTime;

      // 4. Update logs as SENT/DELIVERED
      await this.finalizeLogStatus(payload.jobId, EmailState.SENT, duration, result.messageId);
      this.logger.log(`Job ${payload.jobId} processed successfully in ${duration}ms`);
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error(
        `Error processing job ${payload.jobId}: ${error?.message || error}`,
        error?.stack,
      );

      // Trigger Retry Engine / DLQ logic
      await this.handleFailure(payload, error?.message || String(error), duration);
    }
  }

  /**
   * Retry Strategy implementation with progressive delays or routing to DLQ.
   */
  private async handleFailure(
    payload: IJobPayload,
    errorMessage: string,
    _duration: number,
  ): Promise<void> {
    const nextRetryAttempt = payload.retryCount + 1;
    const maxRetries = parseInt(process.env.SMTP_MAX_RETRIES || '4', 10);

    // Save failure logs history
    const attemptHistory = payload.retryHistory || [];
    attemptHistory.push({
      attempt: nextRetryAttempt,
      timestamp: new Date().toISOString(),
      error: errorMessage,
    });

    const updatedPayload: IJobPayload = {
      ...payload,
      retryCount: nextRetryAttempt,
      retryHistory: attemptHistory,
    };

    if (nextRetryAttempt >= maxRetries) {
      // Final Failure -> Route to Dead Letter Queue (DLQ)
      await this.updateLogStatus(payload.jobId, EmailState.DEAD_LETTER, errorMessage);
      await this.queueService.addDeadJob(updatedPayload);
      this.logger.warn(`Max retries reached. Job ${payload.jobId} moved to DLQ.`);
    } else {
      // Calculate delay based on attempts count:
      // Attempt 1 -> 0 delay (immediate retry)
      // Attempt 2 -> 5 minutes (300,000ms)
      // Attempt 3 -> 15 minutes (900,000ms)
      // Attempt 4 -> 1 hour (3,600,000ms)
      let delayMs = 0;
      if (nextRetryAttempt === 2) delayMs = 5 * 60 * 1000;
      else if (nextRetryAttempt === 3) delayMs = 15 * 60 * 1000;
      else if (nextRetryAttempt >= 4) delayMs = 60 * 60 * 1000;

      await this.updateLogStatus(
        payload.jobId,
        EmailState.RETRYING,
        `Retry #${nextRetryAttempt} scheduled in ${delayMs}ms. Error: ${errorMessage}`,
      );
      await this.queueService.addJob(updatedPayload, delayMs);
      this.logger.log(
        `Scheduled retry #${nextRetryAttempt} for job ${payload.jobId} in ${delayMs}ms`,
      );
    }
  }

  // ──────────────────────────────────────────────────────────────
  // LOGGINGS & STATUS PERSISTENCE HELPER METHODS
  // ──────────────────────────────────────────────────────────────

  private async updateLogStatus(
    jobId: string,
    status: EmailState,
    errorMessage?: string,
  ): Promise<void> {
    try {
      await this.prisma.emailLog.updateMany({
        where: { id: jobId },
        data: {
          status,
          errorMessage: errorMessage || null,
        },
      });
    } catch (err) {
      this.logger.error(`Database log update failed for job ${jobId}`, err);
    }
  }

  private async finalizeLogStatus(
    jobId: string,
    status: EmailState,
    _durationMs: number,
    _messageId?: string,
  ): Promise<void> {
    try {
      // Match logs with details
      await this.prisma.emailLog.updateMany({
        where: { id: jobId },
        data: {
          status,
          errorMessage: null,
          retryCount: { increment: 1 },
          sentAt: new Date(),
        },
      });
    } catch (err) {
      this.logger.error(`Database log finalize failed for job ${jobId}`, err);
    }
  }
}
