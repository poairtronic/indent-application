import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import Redis from 'ioredis';
import { observabilityEventBus } from '../observability/observability-event-bus';

@Injectable()
export class RedisCacheService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisCacheService.name);
  private redisClient: Redis | null = null;
  private isRedisAvailable = false;

  onModuleInit() {
    this.connectRedis();
  }

  async onModuleDestroy() {
    if (this.redisClient) {
      try {
        await this.redisClient.quit();
      } catch (err) {
        this.logger.error(`Error closing Redis connection: ${err.message}`);
      }
    }
  }

  private connectRedis() {
    const host = process.env.REDIS_HOST || 'localhost';
    const port = parseInt(process.env.REDIS_PORT || '6379', 10);
    const password = process.env.REDIS_PASSWORD || undefined;
    const db = parseInt(process.env.REDIS_DB || '0', 10);
    const useTls = process.env.REDIS_TLS === 'true';

    try {
      this.logger.log(`Connecting to Redis for Caching at ${host}:${port} (DB ${db})`);
      this.redisClient = new Redis({
        host,
        port,
        password,
        db,
        maxRetriesPerRequest: 1, // fast failure
        connectTimeout: 2000, // 2s timeout
        lazyConnect: true,
        tls: useTls ? {} : undefined,
      });

      this.redisClient.on('error', (err) => {
        if (this.isRedisAvailable) {
          this.logger.warn(
            `Redis Caching connection lost: ${err.message}. Falling back to database-only mode.`,
          );
        }
        this.isRedisAvailable = false;
        observabilityEventBus.emit('redis.connection', { connected: false, error: err.message });
      });

      this.redisClient.on('connect', () => {
        this.logger.log('Redis connected successfully for Caching.');
        this.isRedisAvailable = true;
        observabilityEventBus.emit('redis.connection', { connected: true });
      });

      this.redisClient
        .connect()
        .then(() => {
          this.isRedisAvailable = true;
          observabilityEventBus.emit('redis.connection', { connected: true });
        })
        .catch((err) => {
          this.logger.warn(
            `Failed to connect to Redis: ${err.message}. Running in offline database-fallback mode.`,
          );
          this.isRedisAvailable = false;
          observabilityEventBus.emit('redis.connection', { connected: false, error: err.message });
        });
    } catch (err) {
      this.logger.error('Failed to initialize Redis Cache client', err);
      this.isRedisAvailable = false;
    }
  }

  public getStatus(): boolean {
    return this.isRedisAvailable && this.redisClient?.status === 'ready';
  }

  async get<T>(key: string): Promise<T | null> {
    const startTime = Date.now();
    if (!this.getStatus() || !this.redisClient) {
      observabilityEventBus.emit('redis.op', {
        operation: 'get',
        success: false,
        duration: Date.now() - startTime,
        hitOrMiss: 'miss',
        error: 'Redis Client Offline',
      });
      return null;
    }
    try {
      const val = await this.redisClient.get(key);
      const duration = Date.now() - startTime;
      if (!val) {
        observabilityEventBus.emit('redis.op', {
          operation: 'get',
          success: true,
          duration,
          hitOrMiss: 'miss',
        });
        return null;
      }
      observabilityEventBus.emit('redis.op', {
        operation: 'get',
        success: true,
        duration,
        hitOrMiss: 'hit',
      });
      return JSON.parse(val) as T;
    } catch (err: any) {
      const duration = Date.now() - startTime;
      this.logger.warn(`Redis get failed for key "${key}": ${err.message}. Falling back to DB.`);
      observabilityEventBus.emit('redis.op', {
        operation: 'get',
        success: false,
        duration,
        error: err.message || String(err),
      });
      return null;
    }
  }

  async set(key: string, value: any, ttlSeconds?: number): Promise<void> {
    const startTime = Date.now();
    if (!this.getStatus() || !this.redisClient) {
      observabilityEventBus.emit('redis.op', {
        operation: 'set',
        success: false,
        duration: Date.now() - startTime,
        error: 'Redis Client Offline',
      });
      return;
    }
    try {
      const serialized = JSON.stringify(value);
      if (ttlSeconds && ttlSeconds > 0) {
        await this.redisClient.set(key, serialized, 'EX', ttlSeconds);
      } else {
        await this.redisClient.set(key, serialized);
      }
      observabilityEventBus.emit('redis.op', {
        operation: 'set',
        success: true,
        duration: Date.now() - startTime,
      });
    } catch (err: any) {
      observabilityEventBus.emit('redis.op', {
        operation: 'set',
        success: false,
        duration: Date.now() - startTime,
        error: err.message || String(err),
      });
      this.logger.warn(`Redis set failed for key "${key}": ${err.message}.`);
    }
  }

  async del(key: string): Promise<void> {
    const startTime = Date.now();
    if (!this.getStatus() || !this.redisClient) {
      observabilityEventBus.emit('redis.op', {
        operation: 'del',
        success: false,
        duration: Date.now() - startTime,
        error: 'Redis Client Offline',
      });
      return;
    }
    try {
      await this.redisClient.del(key);
      observabilityEventBus.emit('redis.op', {
        operation: 'del',
        success: true,
        duration: Date.now() - startTime,
      });
    } catch (err: any) {
      observabilityEventBus.emit('redis.op', {
        operation: 'del',
        success: false,
        duration: Date.now() - startTime,
        error: err.message || String(err),
      });
      this.logger.warn(`Redis del failed for key "${key}": ${err.message}.`);
    }
  }

  async invalidateByPattern(pattern: string): Promise<void> {
    if (!this.getStatus() || !this.redisClient) {
      return;
    }
    try {
      this.logger.log(`Invalidating keys with pattern: ${pattern}`);
      let cursor = '0';
      const batchSize = 100;
      do {
        const [nextCursor, keys] = await this.redisClient.scan(
          cursor,
          'MATCH',
          pattern,
          'COUNT',
          batchSize,
        );
        cursor = nextCursor;
        if (keys.length > 0) {
          await this.redisClient.del(...keys);
          this.logger.log(`Deleted ${keys.length} keys matching pattern: ${pattern}`);
        }
      } while (cursor !== '0');
    } catch (err) {
      this.logger.warn(`Redis pattern invalidation failed for "${pattern}": ${err.message}.`);
    }
  }
}
