import { Test, TestingModule } from '@nestjs/testing';
import { RedisCacheService } from '../redis-cache.service';
import { observabilityEventBus } from '../../observability/observability-event-bus';

describe('Redis Resilience & Failure Recovery', () => {
  let service: RedisCacheService;
  let originalEnv: NodeJS.ProcessEnv;

  beforeAll(() => {
    originalEnv = process.env;
    process.env = { ...originalEnv, REDIS_HOST: '256.256.256.256', REDIS_PORT: '9999' }; // Invalid IP
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RedisCacheService],
    }).compile();

    service = module.get<RedisCacheService>(RedisCacheService);
  });

  afterEach(async () => {
    await service.onModuleDestroy();
  });

  it('should gracefully handle connection failure and fall back to database mode without crashing', async () => {
    let connectionErrorEmitted = false;

    observabilityEventBus.once('redis.connection', (payload) => {
      if (!payload.connected && payload.error) {
        connectionErrorEmitted = true;
      }
    });

    service.onModuleInit();

    // Wait a brief moment for the connection to fail and events to fire
    await new Promise((resolve) => setTimeout(resolve, 300));

    expect(service.getStatus()).toBe(false);
    expect(connectionErrorEmitted).toBe(true);
  });

  it('should return null (cache miss) safely when Redis is offline', async () => {
    service.onModuleInit();
    await new Promise((resolve) => setTimeout(resolve, 300));

    const result = await service.get('any-key');
    expect(result).toBeNull();
  });

  it('should not throw errors when trying to set values while offline', async () => {
    service.onModuleInit();
    await new Promise((resolve) => setTimeout(resolve, 300));

    await expect(service.set('any-key', 'data')).resolves.not.toThrow();
  });
});
