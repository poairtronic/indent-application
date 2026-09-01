import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { EmailProviderFactory } from '../providers/email-provider.factory';
import { TemplateEngine } from '../templates/template.engine';
import { IJobPayload, EmailState } from './queue.constants';
import { observabilityEventBus } from '../../observability/observability-event-bus';
import * as crypto from 'crypto';

@Injectable()
export class PostgresMailWorker implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PostgresMailWorker.name);
  private workerId: string;
  private isShuttingDown = false;
  private pollTimer: NodeJS.Timeout | null = null;
  private concurrency: number;
  private activeJobs = 0;
  private basePollInterval = 2000;
  private maxPollInterval = 10000;
  private currentPollInterval = 2000;

  constructor(
    private readonly prisma: PrismaService,
    private readonly emailProviderFactory: EmailProviderFactory,
    private readonly templateEngine: TemplateEngine,
  ) {
    this.workerId = crypto.randomUUID();
    this.concurrency = parseInt(process.env.SMTP_CONCURRENCY || '2', 10);
  }

  onModuleInit() {
    this.logger.log(
      `Starting PostgresMailWorker (ID: ${this.workerId}, Concurrency: ${this.concurrency})`,
    );
    this.scheduleNextPoll(this.basePollInterval);

    // Recovery of stuck jobs
    setInterval(() => this.recoverStuckJobs(), 60000);
  }

  private scheduleNextPoll(delayMs: number) {
    if (this.isShuttingDown) return;
    this.pollTimer = setTimeout(() => {
      this.poll().then((jobsClaimed) => {
        if (jobsClaimed > 0) {
          this.currentPollInterval = this.basePollInterval;
        } else {
          this.currentPollInterval = Math.min(this.currentPollInterval * 2, this.maxPollInterval);
        }
        this.scheduleNextPoll(this.currentPollInterval);
      });
    }, delayMs);
  }

  async onModuleDestroy() {
    this.isShuttingDown = true;
    if (this.pollTimer) {
      clearTimeout(this.pollTimer);
    }
    this.logger.log(
      `PostgresMailWorker shutting down. Waiting for ${this.activeJobs} active jobs to finish...`,
    );

    let waitTime = 0;
    while (this.activeJobs > 0 && waitTime < 10000) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      waitTime += 500;
    }

    if (this.activeJobs > 0) {
      this.logger.warn(
        `PostgresMailWorker shut down forcefully with ${this.activeJobs} jobs still processing.`,
      );
    } else {
      this.logger.log('PostgresMailWorker shut down gracefully.');
    }
  }

  private async recoverStuckJobs() {
    try {
      const lockDurationMs = parseInt(process.env.SMTP_LOCK_DURATION || '30000', 10);
      const staleDate = new Date(Date.now() - lockDurationMs);

      const updated = await this.prisma.emailJob.updateMany({
        where: {
          status: 'PROCESSING',
          lockedAt: { lt: staleDate },
        },
        data: {
          status: 'PENDING',
          lockedAt: null,
          lockedBy: null,
        },
      });
      if (updated.count > 0) {
        this.logger.warn(`Recovered ${updated.count} stuck email jobs.`);
      }
    } catch (e) {
      this.logger.error('Error recovering stuck jobs', e);
    }
  }

  private async poll(): Promise<number> {
    if (this.isShuttingDown) return 0;

    const availableSlots = this.concurrency - this.activeJobs;
    if (availableSlots <= 0) return 0;

    try {
      // Atomic claim
      const claimedJobs = await this.prisma.$queryRaw<any[]>`
        UPDATE email_jobs
        SET status = 'PROCESSING',
            "lockedAt" = NOW(),
            "lockedBy" = ${this.workerId}
        WHERE id IN (
          SELECT id FROM email_jobs
          WHERE status = 'PENDING' AND "availableAt" <= NOW()
          ORDER BY priority ASC, "createdAt" ASC
          FOR UPDATE SKIP LOCKED
          LIMIT ${availableSlots}
        )
        RETURNING id, payload, attempts, "maxAttempts";
      `;

      if (claimedJobs && Array.isArray(claimedJobs) && claimedJobs.length > 0) {
        for (const job of claimedJobs) {
          this.activeJobs++;
          this.processJob(job)
            .catch((err) => {
              this.logger.error(`Unhandled error processing job ${job?.id}:`, err);
            })
            .finally(() => {
              this.activeJobs--;
            });
        }
        return claimedJobs.length;
      }
      return 0;
    } catch (error) {
      this.logger.error('Error polling email_jobs', error);
      return 0;
    }
  }

  private async processJob(job: any) {
    const payload: IJobPayload = job.payload || {};
    const rawLogIds = payload.emailLogIds || (payload.jobId ? [payload.jobId] : []);
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    const logIds = (Array.isArray(rawLogIds) ? rawLogIds : [rawLogIds]).filter(
      (id): id is string => typeof id === 'string' && uuidRegex.test(id),
    );
    const startTime = Date.now();

    // ENFORCE: Global Email Notification Toggle
    const globalToggle = await this.prisma.applicationSetting.findUnique({
      where: { key: 'GLOBAL_EMAIL_NOTIFICATIONS_ENABLED' },
    });

    if (globalToggle && globalToggle.value === 'false') {
      const errorMessage = 'Global email notifications are disabled. Job permanently suppressed.';
      const attempts = (job.attempts || 0) + 1;

      await this.prisma.emailJob.updateMany({
        where: { id: job.id },
        data: {
          status: 'DEAD_LETTER',
          lastError: errorMessage,
          attempts,
          lockedAt: null,
          lockedBy: null,
        },
      });

      if (logIds.length > 0) {
        await this.prisma.emailLog.updateMany({
          where: { id: { in: logIds } },
          data: { status: EmailState.DEAD_LETTER, errorMessage },
        });
      }

      this.logger.warn(`Job ${job.id} suppressed because global emails are disabled.`);
      observabilityEventBus.emit('notification.event', {
        action: 'suppressed',
        success: false,
        error: errorMessage,
      });
      return;
    }

    try {
      if (logIds.length > 0) {
        await this.updateLogStatus(logIds, EmailState.PROCESSING);
      }

      let html = '';
      if (payload.html) {
        html = payload.html;
      } else if (payload.template) {
        html = this.templateEngine.render(payload.template, payload.payload || {});
      } else {
        html = `<p>${payload.body || payload.subject || 'MERC Notification'}</p>`;
      }

      const recipients = Array.isArray(payload.recipients)
        ? payload.recipients.filter(
            (recipient) => typeof recipient === 'string' && recipient.trim(),
          )
        : typeof payload.recipient === 'string' && payload.recipient.trim()
          ? [payload.recipient]
          : [];

      if (recipients.length === 0) {
        throw new Error(`Email job ${job.id} has no valid recipients`);
      }

      const mailPayload: any = {
        to: recipients,
        subject: payload.subject,
        body: payload.body || 'MERC Notification. Please view in HTML mode.',
        html,
        attachments: payload.attachments,
      };

      const result = await this.emailProviderFactory.sendEmail(mailPayload);
      const duration = Date.now() - startTime;

      try {
        await this.prisma.emailJob.deleteMany({ where: { id: job.id } });

        if (logIds.length > 0) {
          await this.prisma.emailLog.updateMany({
            where: { id: { in: logIds } },
            data: {
              status: EmailState.SENT,
              errorMessage: null,
              retryCount: { increment: 1 },
              sentAt: new Date(),
              durationMs: duration,
              messageId: result?.messageId || null,
            },
          });
        }
      } catch (dbErr) {
        this.logger.error(`Error finalizing successful email job ${job.id}:`, dbErr);
      }

      this.logger.log(`Job ${job.id} processed successfully in ${duration}ms`);
      observabilityEventBus.emit('notification.event', { action: 'delivered', success: true });
    } catch (error: any) {
      const errorMessage = error?.message || String(error);
      const attempts = (job.attempts || 0) + 1;
      // ERR-L2-010: Rich structured error context for every worker failure.
      // Includes all required diagnostic fields for actionable incident response.
      const errorContext = {
        jobId: job.id,
        jobType: payload.template || 'unknown',
        attempt: attempts,
        maxAttempts: job.maxAttempts || 4,
        failureReason: errorMessage,
        timestamp: new Date().toISOString(),
        correlationId: payload.correlationId || null,
        relatedEntity: payload.payload?.indentId || payload.payload?.entityId || null,
        recipients: payload.recipients?.length || 0,
        isDead: attempts >= (job.maxAttempts || 4),
      };

      try {
        if (attempts >= (job.maxAttempts || 4)) {
          await this.prisma.emailJob.updateMany({
            where: { id: job.id },
            data: {
              status: 'DEAD_LETTER',
              attempts,
              lastError: errorMessage,
              lockedAt: null,
              lockedBy: null,
            },
          });
          if (logIds.length > 0) {
            await this.prisma.emailLog.updateMany({
              where: { id: { in: logIds } },
              data: { status: EmailState.DEAD_LETTER, errorMessage },
            });
          }
          // ERR-L2-010: Log DEAD_LETTER with full context including final reason
          this.logger.error(
            `[DEAD_LETTER] Job permanently failed after max retries. Context: ${JSON.stringify(errorContext)}`,
          );
          observabilityEventBus.emit('notification.event', {
            action: 'failed',
            success: false,
            error: errorMessage,
          });
        } else {
          const backoffDelay = 5 * 60 * 1000 * Math.pow(2, attempts - 1); // Exponential backoff

          await this.prisma.emailJob.updateMany({
            where: { id: job.id },
            data: {
              status: 'PENDING',
              attempts,
              lastError: errorMessage,
              availableAt: new Date(Date.now() + backoffDelay),
              lockedAt: null,
              lockedBy: null,
            },
          });
          if (logIds.length > 0) {
            await this.prisma.emailLog.updateMany({
              where: { id: { in: logIds } },
              data: {
                status: EmailState.RETRYING,
                errorMessage: `Retry #${attempts} scheduled. Error: ${errorMessage}`,
              },
            });
          }

          // ERR-L2-010: Log retry with full structured context
          this.logger.warn(
            `[RETRY] Job failed attempt ${attempts}/${errorContext.maxAttempts}. ` +
              `Retry in ${Math.round(backoffDelay / 1000)}s. Context: ${JSON.stringify(errorContext)}`,
          );
          observabilityEventBus.emit('notification.event', {
            action: 'retried',
            success: false,
            attempt: attempts,
            error: errorMessage,
          });
        }
      } catch (innerErr: any) {
        // ERR-L2-010: Inner error (DB update failure during error handling) also logged with context
        this.logger.error(
          `[WORKER_INNER_ERROR] Failed to update job status after error. ` +
            `Job: ${job.id}, innerError: ${innerErr.message}, outerContext: ${JSON.stringify(errorContext)}`,
        );
      }
      throw error;
    }
  }

  private async updateLogStatus(logIds: string[], status: EmailState, errorMessage?: string) {
    try {
      const validIds = (logIds || []).filter(
        (id): id is string => typeof id === 'string' && id.trim().length > 0,
      );
      if (validIds.length === 0) return;
      await this.prisma.emailLog.updateMany({
        where: { id: { in: validIds } },
        data: { status, errorMessage: errorMessage || null },
      });
    } catch (err) {
      this.logger.error(`Database log update failed`, err);
    }
  }

  private async finalizeLogStatus(
    logIds: string[],
    status: EmailState,
    durationMs: number,
    messageId?: string,
  ) {
    try {
      const validIds = (logIds || []).filter(
        (id): id is string => typeof id === 'string' && id.trim().length > 0,
      );
      if (validIds.length === 0) return;
      await this.prisma.emailLog.updateMany({
        where: { id: { in: validIds } },
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
      this.logger.error(`Database log finalize failed`, err);
    }
  }
}
