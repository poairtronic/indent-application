import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import Redis from 'ioredis';
import { observabilityEventBus } from '../observability/observability-event-bus';

interface L1CacheEntry<T> {
  value: T;
  expiresAt: number;
}

@Injectable()
export class RedisCacheService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisCacheService.name);
  private redisClient: Redis | null = null;
  private isRedisAvailable = false;

  // L1 In-Memory Cache (reduces 225ms Redis latency to 0ms)
  private readonly l1Cache = new Map<string, L1CacheEntry<any>>();
  private readonly L1_MAX_KEYS = 1000;

  onModuleInit() {
    this.connectRedis();
  }

  async onModuleDestroy() {
    this.l1Cache.clear();
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

    // Check L1 cache first
    const l1Entry = this.l1Cache.get(key);
    if (l1Entry) {
      if (l1Entry.expiresAt > Date.now()) {
        // L1 Hit
        observabilityEventBus.emit('redis.op', {
          operation: 'get',
          success: true,
          duration: Date.now() - startTime,
          hitOrMiss: 'hit_l1',
        });
        return l1Entry.value as T;
      } else {
        // L1 Expired
        this.l1Cache.delete(key);
      }
    }

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
        hitOrMiss: 'hit_l2',
      });

      const parsed = JSON.parse(val) as T;

      // Populate L1 (TTL derived from redis? We don't know the exact remaining TTL here,
      // but we can set a short L1 TTL to be safe, e.g., 30s)
      this.setL1(key, parsed, 30);

      return parsed;
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

  private setL1(key: string, value: any, ttlSeconds: number) {
    if (this.l1Cache.size >= this.L1_MAX_KEYS) {
      // Very basic eviction (delete first key)
      const firstKey = this.l1Cache.keys().next().value;
      if (firstKey) this.l1Cache.delete(firstKey);
    }
    this.l1Cache.set(key, {
      value,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
  }

  async set(key: string, value: any, ttlSeconds?: number): Promise<void> {
    const startTime = Date.now();

    // Set L1
    if (ttlSeconds && ttlSeconds > 0) {
      this.setL1(key, value, Math.min(ttlSeconds, 60)); // Cap L1 TTL to 60s max to avoid stale data
    } else {
      this.setL1(key, value, 60); // Default L1 TTL
    }

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
      const multi = this.redisClient.multi();
      if (ttlSeconds && ttlSeconds > 0) {
        multi.set(key, serialized, 'EX', ttlSeconds);
      } else {
        multi.set(key, serialized);
      }

      // Track keys in namespace sets for deterministic invalidation (no SCAN)
      const parts = key.split(':');
      if (parts.length >= 2) {
        const ns = parts[0] + ':' + parts[1]; // e.g. "master:products", "analytics:summary"
        multi.sadd(`idx:${ns}`, key);
        if (ttlSeconds && ttlSeconds > 0) {
          multi.expire(`idx:${ns}`, ttlSeconds + 60); // slightly longer TTL than the data
        }
      }
      await multi.exec();
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

    // Delete from L1
    this.l1Cache.delete(key);

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
    // Invalidate L1 pattern
    const regexPattern = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
    for (const key of this.l1Cache.keys()) {
      if (regexPattern.test(key)) {
        this.l1Cache.delete(key);
      }
    }

    if (!this.getStatus() || !this.redisClient) {
      return;
    }
    try {
      this.logger.log(`Invalidating keys with pattern: ${pattern}`);
      // Strip trailing :* or * to get the namespace prefix
      const prefix = pattern.replace(/:\*$/, '').replace(/\*$/, '');
      const idxKey = `idx:${prefix}`;

      const keys = await this.redisClient.smembers(idxKey);

      if (keys && keys.length > 0) {
        // Chunk DEL to avoid oversized commands
        const chunkSize = 500;
        for (let i = 0; i < keys.length; i += chunkSize) {
          const chunk = keys.slice(i, i + chunkSize);
          await this.redisClient.del(...chunk);
        }
        await this.redisClient.del(idxKey);
        this.logger.log(`Deleted ${keys.length} keys via index for pattern: ${pattern}`);
      } else if (!pattern.includes('*')) {
        // Exact key — just delete directly
        await this.redisClient.del(pattern);
      }
      // If no keys found and pattern has wildcard, there's simply nothing cached
    } catch (err) {
      this.logger.warn(`Redis pattern invalidation failed for "${pattern}": ${err.message}.`);
    }
  }
}
