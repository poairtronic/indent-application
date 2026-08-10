import { Test, TestingModule } from '@nestjs/testing';
import { RedisCacheService } from '../redis-cache.service';

// Mock ioredis
const mockRedisInstance = {
  connect: jest.fn().mockResolvedValue(undefined),
  quit: jest.fn().mockResolvedValue(undefined),
  on: jest.fn(),
  get: jest.fn(),
  set: jest.fn(),
  del: jest.fn(),
  scan: jest.fn(),
  status: 'ready',
};

jest.mock('ioredis', () => {
  return jest.fn().mockImplementation(() => mockRedisInstance);
});

describe('RedisCacheService', () => {
  let service: RedisCacheService;

  beforeEach(async () => {
    // Reset mocks
    jest.clearAllMocks();
    mockRedisInstance.status = 'ready';

    const module: TestingModule = await Test.createTestingModule({
      providers: [RedisCacheService],
    }).compile();

    service = module.get<RedisCacheService>(RedisCacheService);
    // Manually trigger connect listener if needed or let onModuleInit run
    service.onModuleInit();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getStatus', () => {
    it('should return true if redis is available and status is ready', () => {
      // Force internal state
      (service as any).isRedisAvailable = true;
      expect(service.getStatus()).toBe(true);
    });

    it('should return false if redis is not available', () => {
      (service as any).isRedisAvailable = false;
      expect(service.getStatus()).toBe(false);
    });
  });

  describe('get', () => {
    it('should get value from redis and parse it', async () => {
      (service as any).isRedisAvailable = true;
      mockRedisInstance.get.mockResolvedValue(JSON.stringify({ foo: 'bar' }));

      const res = await service.get('test_key');
      expect(res).toEqual({ foo: 'bar' });
      expect(mockRedisInstance.get).toHaveBeenCalledWith('test_key');
    });

    it('should return null if redis is down', async () => {
      (service as any).isRedisAvailable = false;
      const res = await service.get('test_key');
      expect(res).toBeNull();
      expect(mockRedisInstance.get).not.toHaveBeenCalled();
    });

    it('should return null and log warning if JSON parsing fails', async () => {
      (service as any).isRedisAvailable = true;
      mockRedisInstance.get.mockResolvedValue('invalid-json');

      const res = await service.get('test_key');
      expect(res).toBeNull();
    });
  });

  describe('set', () => {
    it('should set value without TTL', async () => {
      (service as any).isRedisAvailable = true;
      mockRedisInstance.set.mockResolvedValue('OK');

      await service.set('test_key', { foo: 'bar' });
      expect(mockRedisInstance.set).toHaveBeenCalledWith(
        'test_key',
        JSON.stringify({ foo: 'bar' }),
      );
    });

    it('should set value with TTL', async () => {
      (service as any).isRedisAvailable = true;
      mockRedisInstance.set.mockResolvedValue('OK');

      await service.set('test_key', { foo: 'bar' }, 60);
      expect(mockRedisInstance.set).toHaveBeenCalledWith(
        'test_key',
        JSON.stringify({ foo: 'bar' }),
        'EX',
        60,
      );
    });

    it('should do nothing if redis is offline', async () => {
      (service as any).isRedisAvailable = false;
      await service.set('test_key', { foo: 'bar' });
      expect(mockRedisInstance.set).not.toHaveBeenCalled();
    });
  });

  describe('del', () => {
    it('should delete key', async () => {
      (service as any).isRedisAvailable = true;
      mockRedisInstance.del.mockResolvedValue(1);

      await service.del('test_key');
      expect(mockRedisInstance.del).toHaveBeenCalledWith('test_key');
    });
  });

  describe('invalidateByPattern', () => {
    it('should scan and delete matching keys', async () => {
      (service as any).isRedisAvailable = true;
      mockRedisInstance.scan
        .mockResolvedValueOnce(['next-cursor', ['key1', 'key2']])
        .mockResolvedValueOnce(['0', ['key3']]);
      mockRedisInstance.del.mockResolvedValue(1);

      await service.invalidateByPattern('prefix:*');

      expect(mockRedisInstance.scan).toHaveBeenCalledTimes(2);
      expect(mockRedisInstance.del).toHaveBeenCalledTimes(2);
      expect(mockRedisInstance.del).toHaveBeenNthCalledWith(1, 'key1', 'key2');
      expect(mockRedisInstance.del).toHaveBeenNthCalledWith(2, 'key3');
    });
  });
});
