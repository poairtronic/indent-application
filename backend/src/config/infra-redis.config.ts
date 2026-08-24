import { RedisOptions } from 'ioredis';

export function getInfrastructureRedisConfig(): RedisOptions {
  const host = process.env.INFRA_REDIS_HOST || process.env.REDIS_HOST || 'localhost';
  const port = parseInt(process.env.INFRA_REDIS_PORT || process.env.REDIS_PORT || '6379', 10);
  const password = process.env.INFRA_REDIS_PASSWORD || process.env.REDIS_PASSWORD || undefined;
  const db = parseInt(process.env.INFRA_REDIS_DB || process.env.REDIS_DB || '0', 10);
  const useTls = (process.env.INFRA_REDIS_TLS || process.env.REDIS_TLS) === 'true';

  return {
    host,
    port,
    password,
    db,
    tls: useTls ? {} : undefined,
    maxRetriesPerRequest: null, // Required by BullMQ
    lazyConnect: true,
    enableOfflineQueue: false,
    connectTimeout: 5000,
  };
}
