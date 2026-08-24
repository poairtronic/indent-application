import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { IJobPayload } from './queue.constants';

@Injectable()
export class PostgresQueueService {
  private readonly logger = new Logger(PostgresQueueService.name);

  constructor(private readonly prisma: PrismaService) {}

  public async addJob(payload: IJobPayload, delayMs = 0): Promise<{ id: string }> {
    this.logger.log(
      `Adding job ${payload.jobId} to Postgres Queue with priority: ${payload.priority}`,
    );

    const maxAttempts = parseInt(process.env.SMTP_MAX_RETRIES || '4', 10);
    const availableAt = new Date(Date.now() + delayMs);

    await this.prisma.emailJob.create({
      data: {
        id: payload.jobId,
        payload: payload as any,
        status: 'PENDING',
        priority: payload.priority,
        attempts: 0,
        maxAttempts: maxAttempts,
        availableAt: availableAt,
      },
    });

    return { id: payload.jobId };
  }

  public async getQueueStats(): Promise<any> {
    const counts = await this.prisma.emailJob.groupBy({
      by: ['status'],
      _count: true,
    });
    
    let active = 0, waiting = 0, failed = 0, dead = 0;
    
    for (const row of counts) {
      if (row.status === 'PROCESSING') active = row._count;
      if (row.status === 'PENDING') waiting = row._count;
      if (row.status === 'FAILED') failed = row._count;
      if (row.status === 'DEAD_LETTER') dead = row._count;
    }

    // Historical counts from emailLogs
    const completed = await this.prisma.emailLog.count({ where: { status: 'SENT' } });
    
    return {
      active,
      waiting,
      delayed: 0,
      failed,
      dead,
      completed
    };
  }

  public async checkRedisHealth(): Promise<'UP' | 'DOWN'> {
    // Redis is removed, this queue is powered by Postgres. 
    // Always return 'UP' so health checks don't think it's broken.
    return 'UP';
  }
}
