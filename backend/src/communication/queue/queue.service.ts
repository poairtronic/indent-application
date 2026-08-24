import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Queue, Job } from 'bullmq';
import Redis from 'ioredis';
import { MAIL_QUEUE_NAME, MAIL_DEAD_QUEUE_NAME, IJobPayload } from './queue.constants';
import { ConfigurationException } from '../exceptions/communication.exceptions';
import { getInfrastructureRedisConfig } from '../../config/infra-redis.config';

@Injectable()
export class QueueService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(QueueService.name);
  private redisConnection: Redis | null = null;
  private mailQueue: Queue<IJobPayload> | null = null;
  private deadQueue: Queue<IJobPayload> | null = null;

  public onModuleInit(): void {
    this.initializeRedisAndQueues();
  }

  public async onModuleDestroy(): Promise<void> {
    this.logger.log('Closing BullMQ and Redis connections...');
    if (this.mailQueue) await this.mailQueue.close();
    if (this.deadQueue) await this.deadQueue.close();
    if (this.redisConnection) {
      await this.redisConnection.quit();
    }
    this.logger.log('Redis connections closed.');
  }

  private initializeRedisAndQueues(): void {
    try {
      const config = getInfrastructureRedisConfig();
      this.logger.log(
        `Connecting to Infrastructure Redis for Queue Service at ${config.host}:${config.port} (DB ${config.db})`,
      );

      this.redisConnection = new Redis(config);

      this.redisConnection.on('error', (err) => {
        this.logger.warn(
          `Redis connection unavailable: ${err.message}. Queue processing running in offline fallback mode.`,
        );
      });

      this.redisConnection.on('connect', () => {
        this.logger.log('Redis connected successfully.');
      });

      // Instantiate BullMQ Queues
      this.mailQueue = new Queue<IJobPayload>(MAIL_QUEUE_NAME, {
        connection: this.redisConnection,
        defaultJobOptions: {
          removeOnComplete: true, // Clean up completed jobs
          removeOnFail: { count: 200 }, // D5: Retain last 200 failed jobs for troubleshooting, prevent unbounded Redis growth
        },
      });

      this.mailQueue.on('error', (err) => {
        this.logger.warn(`MailQueue offline: ${err.message}`);
      });

      this.deadQueue = new Queue<IJobPayload>(MAIL_DEAD_QUEUE_NAME, {
        connection: this.redisConnection,
      });

      this.deadQueue.on('error', (err) => {
        this.logger.warn(`DeadQueue offline: ${err.message}`);
      });

      this.logger.log('Queues initialized successfully.');
    } catch (err) {
      this.logger.error('Failed to initialize Queue connections', err?.stack || err);
      throw new ConfigurationException('REDIS_CONNECTION', err?.message || String(err));
    }
  }

  /**
   * Adds an email dispatch job to the queue.
   * Maps job options (priority, delays, max retries).
   */
  public async addJob(payload: IJobPayload, delayMs = 0): Promise<Job<IJobPayload>> {
    if (!this.mailQueue) {
      throw new Error('Mail Queue is not initialized.');
    }

    this.logger.log(`Adding job ${payload.jobId} to Queue with priority: ${payload.priority}`);

    // BullMQ priorities work opposite to some systems: lower value is higher priority.
    // Map custom 1-5 priority to BullMQ priority configuration options.
    const jobOptions: any = {
      priority: payload.priority,
      jobId: payload.jobId,
      attempts: parseInt(process.env.SMTP_MAX_RETRIES || '4', 10),
      backoff: {
        type: 'exponential',
        delay: 5 * 60 * 1000,
      },
    };

    if (delayMs > 0) {
      jobOptions.delay = delayMs;
    }

    return this.mailQueue.add(payload.template, payload, jobOptions);
  }

  /**
   * Routes a failed job directly to the Dead Letter Queue.
   */
  public async addDeadJob(payload: IJobPayload): Promise<Job<IJobPayload>> {
    if (!this.deadQueue) {
      throw new Error('Dead Letter Queue is not initialized.');
    }
    this.logger.warn(`Moving job ${payload.jobId} to Dead Letter Queue.`);
    return this.deadQueue.add(payload.template, payload, { jobId: payload.jobId });
  }

  /**
   * Diagnostics helper returning active connections check status.
   */
  public async checkRedisHealth(): Promise<string> {
    if (!this.redisConnection) return 'DISCONNECTED';
    try {
      const ping = await this.redisConnection.ping();
      return ping === 'PONG' ? 'UP' : 'DEGRADED';
    } catch {
      return 'DOWN';
    }
  }

  /**
   * Fetches active job count metrics.
   */
  public async getQueueStats() {
    if (!this.mailQueue || !this.deadQueue) {
      return { active: 0, completed: 0, failed: 0, waiting: 0, delayed: 0, dead: 0 };
    }

    const [active, completed, failed, waiting, delayed, dead] = await Promise.all([
      this.mailQueue.getActiveCount(),
      this.mailQueue.getCompletedCount(),
      this.mailQueue.getFailedCount(),
      this.mailQueue.getWaitingCount(),
      this.mailQueue.getDelayedCount(),
      this.deadQueue.getJobCountByTypes('waiting', 'active', 'completed', 'failed'),
    ]);

    return { active, completed, failed, waiting, delayed, dead };
  }
}
