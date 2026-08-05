import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Worker, Job } from 'bullmq';
import Redis from 'ioredis';
import { MAIL_QUEUE_NAME, IJobPayload } from './queue.constants';
import { QueueProcessor } from './queue.processor';

@Injectable()
export class MailWorker implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(MailWorker.name);
  private worker: Worker<IJobPayload> | null = null;
  private redisConnection: Redis | null = null;

  constructor(private readonly queueProcessor: QueueProcessor) {}

  public onModuleInit(): void {
    this.startWorker();
  }

  public async onModuleDestroy(): Promise<void> {
    this.logger.log('Shutting down MailWorker processes gracefully...');
    if (this.worker) {
      await this.worker.close();
    }
    if (this.redisConnection) {
      await this.redisConnection.quit();
    }
    this.logger.log('MailWorker offline.');
  }

  private startWorker(): void {
    const host = process.env.REDIS_HOST || 'localhost';
    const port = parseInt(process.env.REDIS_PORT || '6379', 10);
    const password = process.env.REDIS_PASSWORD || undefined;
    const db = parseInt(process.env.REDIS_DB || '0', 10);

    const concurrency = parseInt(process.env.SMTP_CONCURRENCY || '2', 10);

    try {
      this.logger.log(
        `Starting BullMQ worker on queue '${MAIL_QUEUE_NAME}' with concurrency: ${concurrency}`,
      );

      this.redisConnection = new Redis({
        host,
        port,
        password,
        db,
        maxRetriesPerRequest: null, // Critical requirement for BullMQ
        lazyConnect: true,
        enableOfflineQueue: false,
      });

      this.redisConnection.on('error', (err) => {
        this.logger.warn(`Redis connection unavailable: ${err.message}. Queue processing running in offline mode.`);
      });

      this.worker = new Worker<IJobPayload>(
        MAIL_QUEUE_NAME,
        async (job: Job<IJobPayload>) => {
          this.logger.log(`Worker picked up job: ${job.id}`);
          await this.queueProcessor.processJob(job.data);
        },
        {
          connection: this.redisConnection,
          concurrency,
          lockDuration: 30000, // 30s lock duration
        },
      );

      this.worker.on('active', (job) => {
        this.logger.log(`Job active in processor: ${job.id}`);
      });

      this.worker.on('completed', (job) => {
        this.logger.log(`Job completed: ${job.id}`);
      });

      this.worker.on('failed', (job, err) => {
        this.logger.error(
          `Job processing execution failed on worker loop: ${job?.id}. Error: ${err.message}`,
          err.stack,
        );
      });

      this.worker.on('error', (err) => {
        this.logger.error(`Worker encountered fatal error: ${err.message}`, err.stack);
      });
    } catch (err) {
      this.logger.error('Failed to initiate Worker process loop', err?.stack || err);
    }
  }
}
