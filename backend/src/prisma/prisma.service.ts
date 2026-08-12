import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { observabilityEventBus } from '../observability/observability-event-bus';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    super();
    const extended = this.$extends({
      query: {
        $allModels: {
          async $allOperations({ model, operation, args, query }) {
            const startTime = Date.now();
            try {
              const result = await query(args);
              const duration = Date.now() - startTime;
              observabilityEventBus.emit('db.query', {
                model,
                action: operation,
                duration,
                success: true,
              });
              return result;
            } catch (error: any) {
              const duration = Date.now() - startTime;
              observabilityEventBus.emit('db.query', {
                model,
                action: operation,
                duration,
                success: false,
                error: error.message || String(error),
              });
              throw error;
            }
          },
        },
      },
    });
    // Bind module hooks to the extended instance so NestJS executes them
    (extended as any).onModuleInit = async () => {
      try {
        await (extended as any).$connect();
        this.logger.log('Successfully connected to database');
        observabilityEventBus.emit('db.connection', { connected: true });
      } catch (error: any) {
        this.logger.warn(`Could not connect to database on startup: ${error.message}`);
        observabilityEventBus.emit('db.connection', { connected: false });
      }
    };

    (extended as any).onModuleDestroy = async () => {
      await (extended as any).$disconnect();
    };

    return extended as any;
  }

  async onModuleInit() {
    try {
      await this.$connect();
      this.logger.log('Successfully connected to database');
      observabilityEventBus.emit('db.connection', { connected: true });
    } catch (error: any) {
      this.logger.warn(`Could not connect to database on startup: ${error.message}`);
      observabilityEventBus.emit('db.connection', { connected: false });
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
