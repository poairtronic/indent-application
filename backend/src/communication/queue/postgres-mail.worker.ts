import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { NodemailerProvider } from '../providers/nodemailer.provider';
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

  constructor(
    private readonly prisma: PrismaService,
    private readonly nodemailerProvider: NodemailerProvider,
    private readonly templateEngine: TemplateEngine,
  ) {
    this.workerId = crypto.randomUUID();
    this.concurrency = parseInt(process.env.SMTP_CONCURRENCY || '2', 10);
  }

  onModuleInit() {
    this.logger.log(
      `Starting PostgresMailWorker (ID: ${this.workerId}, Concurrency: ${this.concurrency})`,
    );
    this.pollTimer = setInterval(() => this.poll(), 2000); // Poll every 2s

    // Recovery of stuck jobs
    setInterval(() => this.recoverStuckJobs(), 60000);
  }

  onModuleDestroy() {
    this.isShuttingDown = true;
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
    }
    this.logger.log('PostgresMailWorker shutting down.');
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

  private async poll() {
    if (this.isShuttingDown) return;

    const availableSlots = this.concurrency - this.activeJobs;
    if (availableSlots <= 0) return;

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
          this.processJob(job).finally(() => {
            this.activeJobs--;
          });
        }
      }
    } catch (error) {
      this.logger.error('Error polling email_jobs', error);
    }
  }

  private async processJob(job: any) {
    const payload: IJobPayload = job.payload;
    const logIds = payload.emailLogIds || [payload.jobId];
    const startTime = Date.now();

    try {
      await this.updateLogStatus(logIds, EmailState.PROCESSING);

      const html = this.templateEngine.render(payload.template, payload.payload);
      const mailPayload: any = {
        to: payload.recipients,
        subject: payload.subject,
        body: 'MERC Notification. Please view in HTML mode.',
        html,
        attachments: payload.attachments,
      };

      const result = await this.nodemailerProvider.sendEmail(mailPayload);
      const duration = Date.now() - startTime;

      await this.prisma.emailJob.update({
        where: { id: job.id },
        data: { status: 'PENDING' }, // Will be deleted on success anyway, but safe
      });
      await this.prisma.emailJob.delete({ where: { id: job.id } });

      await this.finalizeLogStatus(logIds, EmailState.SENT, duration, result.messageId);
      this.logger.log(`Job ${job.id} processed successfully in ${duration}ms`);
      observabilityEventBus.emit('notification.event', { action: 'delivered', success: true });
    } catch (error: any) {
      const attempts = job.attempts + 1;
      const errorMessage = error?.message || String(error);

      if (attempts >= job.maxAttempts) {
        await this.prisma.emailJob.update({
          where: { id: job.id },
          data: {
            status: 'DEAD_LETTER',
            attempts,
            lastError: errorMessage,
            lockedAt: null,
            lockedBy: null,
          },
        });
        await this.updateLogStatus(logIds, EmailState.DEAD_LETTER, errorMessage);
        this.logger.warn(`Max retries reached. Job ${job.id} moved to DLQ.`);
        observabilityEventBus.emit('notification.event', {
          action: 'failed',
          success: false,
          error: errorMessage,
        });
      } else {
        const backoffDelay = 5 * 60 * 1000 * Math.pow(2, attempts - 1); // Exponential backoff (BullMQ default was 5m base)
        await this.prisma.emailJob.update({
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
        await this.updateLogStatus(
          logIds,
          EmailState.RETRYING,
          `Retry #${attempts} scheduled. Error: ${errorMessage}`,
        );
        this.logger.log(`Job ${job.id} failed attempt ${attempts}. Scheduled for retry.`);
        observabilityEventBus.emit('notification.event', {
          action: 'retried',
          success: false,
          attempt: attempts,
          error: errorMessage,
        });
      }
    }
  }

  private async updateLogStatus(logIds: string[], status: EmailState, errorMessage?: string) {
    try {
      if (!logIds || logIds.length === 0) return;
      await this.prisma.emailLog.updateMany({
        where: { id: { in: logIds } },
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
      this.logger.error(`Database log finalize failed`, err);
    }
  }
}
