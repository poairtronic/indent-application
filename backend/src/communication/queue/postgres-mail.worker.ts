import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { EmailProviderFactory } from '../providers/email-provider.factory';
import { TemplateEngine } from '../templates/template.engine';
import { IJobPayload, EmailState } from './queue.constants';
import { observabilityEventBus } from '../../observability/observability-event-bus';
import { mailQueueEventBus, IMailQueueWakeupEvent } from './mail-queue.event-bus';
import * as crypto from 'crypto';

@Injectable()
export class PostgresMailWorker implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PostgresMailWorker.name);
  private workerId: string;
  private isShuttingDown = false;
  private isHeartbeatStopped = false;
  private concurrency: number;
  private activeJobs = 0;
  private isPolling = false;
  private hasPendingWakeup = false;
  private recoveryTimer: NodeJS.Timeout | null = null;
  private startupTimer: NodeJS.Timeout | null = null;
  private readonly delayedTimers = new Set<NodeJS.Timeout>();

  // Lease / Heartbeat & Graceful Shutdown Configurations (Phase 1.1 Remediation)
  private readonly lockDurationMs: number;
  private readonly heartbeatIntervalMs: number;
  private readonly shutdownTimeoutMs: number;
  private readonly activeHeartbeats = new Map<string, NodeJS.Timeout>();
  private readonly activeAbortControllers = new Map<string, AbortController>();

  private readonly wakeupListener = (event: IMailQueueWakeupEvent) => {
    this.handleWakeupEvent(event);
  };

  constructor(
    private readonly prisma: PrismaService,
    private readonly emailProviderFactory: EmailProviderFactory,
    private readonly templateEngine: TemplateEngine,
  ) {
    this.workerId = crypto.randomUUID();
    this.concurrency = parseInt(process.env.SMTP_CONCURRENCY || '2', 10);
    this.lockDurationMs = parseInt(process.env.SMTP_LOCK_DURATION || '60000', 10);
    this.heartbeatIntervalMs = parseInt(process.env.SMTP_HEARTBEAT_INTERVAL_MS || '15000', 10);
    this.shutdownTimeoutMs = parseInt(process.env.SMTP_SHUTDOWN_TIMEOUT_MS || '10000', 10);
  }

  onModuleInit() {
    this.isShuttingDown = false;
    this.isHeartbeatStopped = false;
    this.logger.log(
      `Starting PostgresMailWorker with Lease Heartbeat & Safe Shutdown (ID: ${this.workerId}, Concurrency: ${this.concurrency}, Lease: ${this.lockDurationMs}ms, Heartbeat: ${this.heartbeatIntervalMs}ms)`,
    );

    // 1. Subscribe to event-driven wakeups (0 idle polling queries)
    mailQueueEventBus.onWakeup(this.wakeupListener);

    // 2. Perform startup recovery for any truly stuck jobs from previous crashed instance
    this.recoverStuckJobs().catch((err) => {
      this.logger.error('Error in startup stuck-job recovery:', err);
    });

    // 3. Initial startup drain sweep to process any pending jobs persisted prior to restart
    this.startupTimer = setTimeout(() => {
      this.startupTimer = null;
      this.triggerWakeup(0);
    }, 500);

    // 4. Setup periodic fallback recovery timer (default 1 hour, down from 60s)
    const recoveryIntervalMs = parseInt(
      process.env.SMTP_STUCK_JOB_RECOVERY_INTERVAL_MS || '3600000',
      10,
    );
    this.recoveryTimer = setInterval(() => {
      this.recoverStuckJobs().catch((err) => {
        this.logger.error('Error in periodic stuck-job recovery:', err);
      });
    }, recoveryIntervalMs);
  }

  private handleWakeupEvent(event: IMailQueueWakeupEvent): void {
    const delayMs = event?.delayMs || 0;
    if (delayMs > 0) {
      const timer = setTimeout(() => {
        this.delayedTimers.delete(timer);
        this.triggerWakeup(0);
      }, delayMs);
      this.delayedTimers.add(timer);
      return;
    }
    this.triggerWakeup(0);
  }

  public triggerWakeup(delayMs = 0): void {
    if (this.isShuttingDown) return;

    if (delayMs > 0) {
      const timer = setTimeout(() => {
        this.delayedTimers.delete(timer);
        this.triggerWakeup(0);
      }, delayMs);
      this.delayedTimers.add(timer);
      return;
    }

    if (this.isPolling) {
      this.hasPendingWakeup = true;
      return;
    }

    this.runDrainLoop().catch((err) => {
      this.logger.error('Error in email worker drain loop', err);
    });
  }

  private async runDrainLoop(): Promise<void> {
    if (this.isShuttingDown || this.isPolling) return;

    this.isPolling = true;
    try {
      while (!this.isShuttingDown) {
        this.hasPendingWakeup = false;
        const claimedCount = await this.poll();

        // If we claimed jobs, continue draining immediately until empty
        if (claimedCount > 0) {
          continue;
        }

        // If a wakeup arrived while polling, re-poll once more to ensure nothing was missed
        if (this.hasPendingWakeup) {
          this.hasPendingWakeup = false;
          continue;
        }

        // Queue is completely empty. Enter sleep mode with ZERO continuous polling queries.
        this.logger.debug('Email queue is empty. PostgresMailWorker entering sleep mode.');
        break;
      }
    } finally {
      this.isPolling = false;
    }
  }

  async onModuleDestroy() {
    this.isShuttingDown = true;

    // 1. Unsubscribe from event bus to stop accepting new job wakeups
    mailQueueEventBus.offWakeup(this.wakeupListener);

    // 2. Stop scheduling timers
    if (this.startupTimer) {
      clearTimeout(this.startupTimer);
      this.startupTimer = null;
    }
    if (this.recoveryTimer) {
      clearInterval(this.recoveryTimer);
      this.recoveryTimer = null;
    }
    for (const timer of this.delayedTimers) {
      clearTimeout(timer);
    }
    this.delayedTimers.clear();

    this.logger.log(
      `PostgresMailWorker shutting down. Waiting up to ${this.shutdownTimeoutMs / 1000}s for ${this.activeJobs} active jobs to finish...`,
    );

    // 3. Wait for active jobs to complete gracefully while keeping their lease heartbeats alive
    const startTime = Date.now();
    while (this.activeJobs > 0 && Date.now() - startTime < this.shutdownTimeoutMs) {
      await new Promise((resolve) => setTimeout(resolve, 200));
    }

    // 4. Cease any remaining heartbeat renewals only after graceful wait concludes
    this.isHeartbeatStopped = true;
    for (const [, timer] of this.activeHeartbeats.entries()) {
      clearTimeout(timer);
    }
    this.activeHeartbeats.clear();

    // 5. SAFE SHUTDOWN BEHAVIOR (Issue B Remediation):
    // If jobs completed cleanly (activeJobs === 0), rows are already deleted or retried.
    // If activeJobs > 0 after grace period: DO NOT forcibly release jobs to PENDING.
    // Releasing an in-flight job back to PENDING while its network socket may still complete
    // creates an active duplicate-delivery vulnerability with newly booted rolling containers.
    // Instead, leave the job locked in PROCESSING by this workerId. The lease will safely expire
    // after lockDurationMs, after which the hourly recovery sweep will reclaim it if abandoned.
    if (this.activeJobs > 0) {
      this.logger.warn(
        `PostgresMailWorker shut down with ${this.activeJobs} jobs still processing. ` +
          `Leaving locks intact until lease expiry (${this.lockDurationMs / 1000}s) to prevent concurrent double-delivery.`,
      );
    } else {
      this.logger.log('PostgresMailWorker shut down gracefully with 0 active jobs.');
    }
  }

  private get hasRawSql(): boolean {
    return typeof (this.prisma as any)?.$executeRaw === 'function';
  }

  /**
   * Renew lock lease for an actively processing job, distinguishing DB errors from lost lease ownership.
   */
  public async renewLockWithStatus(jobId: string): Promise<'RENEWED' | 'LEASE_LOST' | 'DB_ERROR'> {
    try {
      if (this.hasRawSql) {
        const affected = await this.prisma.$executeRaw`
          UPDATE email_jobs
          SET "lockedAt" = NOW()
          WHERE id = ${jobId}
            AND status = 'PROCESSING'
            AND "lockedBy" = ${this.workerId}
        `;
        return affected > 0 ? 'RENEWED' : 'LEASE_LOST';
      }

      const result = await this.prisma.emailJob.updateMany({
        where: {
          id: jobId,
          status: 'PROCESSING',
          lockedBy: this.workerId,
        },
        data: {
          lockedAt: new Date(),
        },
      });
      return result.count > 0 ? 'RENEWED' : 'LEASE_LOST';
    } catch (err: any) {
      this.logger.error(`Error renewing lock for job ${jobId}: ${err?.message}`);
      return 'DB_ERROR';
    }
  }

  /**
   * Renew lock lease for an actively processing job.
   * Only succeeds if the job is still in PROCESSING status AND owned by this specific worker.
   */
  public async renewLock(jobId: string): Promise<boolean> {
    const status = await this.renewLockWithStatus(jobId);
    return status === 'RENEWED';
  }

  /**
   * Starts periodic lock renewal heartbeat while a job is actively executing.
   * If lock renewal fails due to lost ownership, aborts processing.
   * Transient DB errors are logged and retried on the next heartbeat without aborting ownership.
   */
  private startHeartbeat(jobId: string, abortController: AbortController): void {
    this.stopHeartbeat(jobId);

    const scheduleNext = () => {
      if (this.isHeartbeatStopped || abortController.signal.aborted) {
        return;
      }

      const timer = setTimeout(async () => {
        if (this.isHeartbeatStopped || abortController.signal.aborted) {
          return;
        }

        const renewStatus = await this.renewLockWithStatus(jobId);
        if (renewStatus === 'LEASE_LOST') {
          this.logger.warn(
            `[LEASE_LOST] Worker ${this.workerId} lost lock ownership for job ${jobId}. Aborting execution.`,
          );
          abortController.abort();
          this.stopHeartbeat(jobId);
          return;
        }

        if (renewStatus === 'DB_ERROR') {
          this.logger.warn(
            `[HEARTBEAT_DB_ERROR] Transient error renewing lease for job ${jobId}. Retrying on next heartbeat.`,
          );
          scheduleNext();
          return;
        }

        this.logger.debug(`[HEARTBEAT] Renewed lease for job ${jobId} by worker ${this.workerId}`);

        scheduleNext();
      }, this.heartbeatIntervalMs);

      this.activeHeartbeats.set(jobId, timer);
    };

    scheduleNext();
  }

  private stopHeartbeat(jobId: string): void {
    const timer = this.activeHeartbeats.get(jobId);
    if (timer) {
      clearTimeout(timer);
      this.activeHeartbeats.delete(jobId);
    }
  }

  /**
   * Recover genuinely abandoned jobs where lockedAt is older than lockDurationMs,
   * and wake the worker if any orphaned due PENDING jobs remain queued.
   */
  public async recoverStuckJobs(): Promise<number> {
    try {
      let recoveredCount = 0;

      if (this.hasRawSql) {
        recoveredCount = await this.prisma.$executeRaw`
          UPDATE email_jobs
          SET status = 'PENDING',
              "lockedAt" = NULL,
              "lockedBy" = NULL
          WHERE status = 'PROCESSING'
            AND "lockedAt" < NOW() - make_interval(secs => ${this.lockDurationMs / 1000})
        `;
      } else {
        const staleThreshold = new Date(Date.now() - this.lockDurationMs);
        const updated = await this.prisma.emailJob.updateMany({
          where: {
            status: 'PROCESSING',
            lockedAt: { lt: staleThreshold },
          },
          data: {
            status: 'PENDING',
            lockedAt: null,
            lockedBy: null,
          },
        });
        recoveredCount = updated.count;
      }

      if (recoveredCount > 0) {
        this.logger.warn(
          `Recovered ${recoveredCount} genuinely stuck email jobs (no heartbeat for > ${this.lockDurationMs / 1000}s).`,
        );
        this.triggerWakeup(0);
        return recoveredCount;
      }

      // Check for orphaned due PENDING jobs (e.g., manual retry or missed wakeup)
      if (this.hasRawSql) {
        const duePending = await this.prisma.$queryRaw<Array<{ id: string }>>`
          SELECT id FROM email_jobs
          WHERE status = 'PENDING' AND "availableAt" <= NOW()
          LIMIT 1
        `;
        if (Array.isArray(duePending) && duePending.length > 0) {
          this.logger.log('Found due PENDING email jobs during recovery sweep. Waking worker.');
          this.triggerWakeup(0);
        }
      } else if (typeof (this.prisma.emailJob as any)?.findMany === 'function') {
        const duePending = await this.prisma.emailJob.findMany({
          where: {
            status: 'PENDING',
            availableAt: { lte: new Date() },
          },
          select: { id: true },
          take: 1,
        });
        if (Array.isArray(duePending) && duePending.length > 0) {
          this.logger.log('Found due PENDING email jobs during recovery sweep. Waking worker.');
          this.triggerWakeup(0);
        }
      }

      return recoveredCount;
    } catch (e) {
      this.logger.error('Error recovering stuck jobs', e);
      return 0;
    }
  }

  public async waitForIdle(maxWaitMs = 5000): Promise<void> {
    const start = Date.now();
    while ((this.isPolling || this.activeJobs > 0) && Date.now() - start < maxWaitMs) {
      await new Promise((resolve) => setTimeout(resolve, 20));
    }
  }

  public getWorkerStatus() {
    return {
      workerId: this.workerId,
      concurrency: this.concurrency,
      activeJobs: this.activeJobs,
      isPolling: this.isPolling,
      isShuttingDown: this.isShuttingDown,
      activeHeartbeatsCount: this.activeHeartbeats.size,
      lockDurationMs: this.lockDurationMs,
      heartbeatIntervalMs: this.heartbeatIntervalMs,
      shutdownTimeoutMs: this.shutdownTimeoutMs,
    };
  }

  private async poll(): Promise<number> {
    if (this.isShuttingDown) return 0;

    const availableSlots = this.concurrency - this.activeJobs;
    if (availableSlots <= 0) return 0;

    try {
      // Atomic claim using row-level locking
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
              // Concurrency slot freed up: trigger drain to pick up remaining queued jobs
              if (!this.isShuttingDown) {
                this.triggerWakeup(0);
              }
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

    // Start lease renewal heartbeat and prepare cancellation controller
    const abortController = new AbortController();
    this.activeAbortControllers.set(job.id, abortController);
    this.startHeartbeat(job.id, abortController);

    try {
      // ENFORCE: Global Email Notification Toggle
      const globalToggle = await this.prisma.applicationSetting.findUnique({
        where: { key: 'GLOBAL_EMAIL_NOTIFICATIONS_ENABLED' },
      });

      if (globalToggle && globalToggle.value === 'false') {
        const errorMessage = 'Global email notifications are disabled. Job permanently suppressed.';
        const attempts = (job.attempts || 0) + 1;

        await this.prisma.emailJob.updateMany({
          where: { id: job.id, lockedBy: this.workerId },
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

      if (abortController.signal.aborted) {
        throw new Error(`Job ${job.id} aborted: lock lease lost before dispatch`);
      }

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
        signal: abortController.signal,
      };

      if (abortController.signal.aborted) {
        throw new Error(`Job ${job.id} aborted: lock lease lost before SMTP call`);
      }

      // External Email Dispatch (Gmail API / SMTP)
      const result = await this.emailProviderFactory.sendEmail(mailPayload);
      const duration = Date.now() - startTime;

      // Stop heartbeat immediately upon external transmission completion
      this.stopHeartbeat(job.id);

      try {
        // Enforce lock ownership during successful deletion
        const deleted = await this.prisma.emailJob.deleteMany({
          where: { id: job.id, lockedBy: this.workerId },
        });

        if (deleted.count === 0) {
          this.logger.warn(
            `[LEASE_WARNING] Job ${job.id} sent successfully, but lock was no longer held by worker ${this.workerId} during cleanup.`,
          );
        }

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
      } catch (dbErr: any) {
        this.logger.error(`Error finalizing successful email job ${job.id}:`, dbErr);
        try {
          await this.prisma.emailJob.updateMany({
            where: { id: job.id, lockedBy: this.workerId },
            data: {
              status: 'DEAD_LETTER',
              lastError: `Email sent but post-dispatch cleanup failed: ${dbErr?.message || dbErr}`,
              lockedAt: null,
              lockedBy: null,
            },
          });
        } catch (terminalUpdateErr) {
          this.logger.error(
            `Failed to mark email job ${job.id} as DEAD_LETTER after cleanup failure:`,
            terminalUpdateErr,
          );
        }
      }

      this.logger.log(`Job ${job.id} processed successfully in ${duration}ms`);
      observabilityEventBus.emit('notification.event', { action: 'delivered', success: true });
    } catch (error: any) {
      // If job was aborted due to lease loss, skip standard retry to avoid conflicting with new owner
      if (abortController.signal.aborted) {
        this.logger.warn(
          `[ABORTED_JOB] Processing of job ${job.id} aborted because lock ownership was lost. Skipping retry/cleanup.`,
        );
        throw error;
      }

      const errorMessage = error?.message || String(error);
      const attempts = (job.attempts || 0) + 1;
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
            where: { id: job.id, lockedBy: this.workerId },
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
            where: { id: job.id, lockedBy: this.workerId },
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

          // Schedule event-driven wakeup for when the backoff expires
          this.triggerWakeup(backoffDelay);
        }
      } catch (innerErr: any) {
        this.logger.error(
          `[WORKER_INNER_ERROR] Failed to update job status after error. ` +
            `Job: ${job.id}, innerError: ${innerErr.message}, outerContext: ${JSON.stringify(errorContext)}`,
        );
      }
      throw error;
    } finally {
      this.stopHeartbeat(job.id);
      this.activeAbortControllers.delete(job.id);
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
