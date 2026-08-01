import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Queue, Job } from 'bullmq';
import Redis from 'ioredis';
import { MAIL_QUEUE_NAME, MAIL_DEAD_QUEUE_NAME, IJobPayload } from './queue.constants';
import { ConfigurationException } from '../exceptions/communication.exceptions';

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
    const host = process.env.REDIS_HOST || 'localhost';
    const port = parseInt(process.env.REDIS_PORT || '6379', 10);
    const password = process.env.REDIS_PASSWORD || undefined;
    const db = parseInt(process.env.REDIS_DB || '0', 10);

    if (isNaN(port)) {
      throw new ConfigurationException('REDIS_PORT', 'Redis Port number must be a valid integer.');
    }

    try {
      this.logger.log(`Connecting to Redis at ${host}:${port} (DB ${db})`);
      const connectionOptions: any = {
        host,
        port,
        password,
        db,
        maxRetriesPerRequest: null, // Critical requirement for BullMQ
      };

      this.redisConnection = new Redis(connectionOptions);

      this.redisConnection.on('error', (err) => {
        this.logger.error(`Redis connection failure error: ${err.message}`, err.stack);
      });

      this.redisConnection.on('connect', () => {
        this.logger.log('Redis connected successfully.');
      });

      // Instantiate BullMQ Queues
      this.mailQueue = new Queue<IJobPayload>(MAIL_QUEUE_NAME, {
        connection: this.redisConnection,
        defaultJobOptions: {
          removeOnComplete: true, // Clean up completed jobs
          removeOnFail: false, // Keep failed jobs for manual DLQ or status review
        },
      });

      this.deadQueue = new Queue<IJobPayload>(MAIL_DEAD_QUEUE_NAME, {
        connection: this.redisConnection,
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
