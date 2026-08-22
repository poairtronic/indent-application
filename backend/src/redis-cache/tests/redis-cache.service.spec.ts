import { Test, TestingModule } from '@nestjs/testing';
import { RedisCacheService } from '../redis-cache.service';

// Mock ioredis
const mockMultiResult = {
  set: jest.fn().mockReturnThis(),
  sadd: jest.fn().mockReturnThis(),
  expire: jest.fn().mockReturnThis(),
  exec: jest.fn().mockResolvedValue([null, null, null]),
};

const mockRedisInstance = {
  connect: jest.fn().mockResolvedValue(undefined),
  quit: jest.fn().mockResolvedValue(undefined),
  on: jest.fn(),
  get: jest.fn(),
  set: jest.fn(),
  del: jest.fn(),
  smembers: jest.fn(),
  multi: jest.fn().mockReturnValue(mockMultiResult),
  status: 'ready',
};

jest.mock('ioredis', () => {
  return jest.fn().mockImplementation(() => mockRedisInstance);
});

describe('RedisCacheService', () => {
  let service: RedisCacheService;

  beforeEach(async () => {
    jest.clearAllMocks();
    mockRedisInstance.status = 'ready';

    const module: TestingModule = await Test.createTestingModule({
      providers: [RedisCacheService],
    }).compile();

    service = module.get<RedisCacheService>(RedisCacheService);
    service.onModuleInit();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getStatus', () => {
    it('should return true if redis is available and status is ready', () => {
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
    it('should set value without TTL using multi pipeline with SADD tracking', async () => {
      (service as any).isRedisAvailable = true;
      mockMultiResult.exec.mockResolvedValue([null, null]);

      await service.set('master:products:123', { foo: 'bar' });

      expect(mockRedisInstance.multi).toHaveBeenCalled();
      expect(mockMultiResult.set).toHaveBeenCalledWith('master:products:123', JSON.stringify({ foo: 'bar' }));
      expect(mockMultiResult.sadd).toHaveBeenCalledWith('idx:master:products', 'master:products:123');
      expect(mockMultiResult.exec).toHaveBeenCalled();
    });

    it('should set value with TTL using multi pipeline with SADD tracking', async () => {
      (service as any).isRedisAvailable = true;
      mockMultiResult.exec.mockResolvedValue([null, null, null]);

      await service.set('analytics:summary', { total: 100 }, 60);

      expect(mockRedisInstance.multi).toHaveBeenCalled();
      expect(mockMultiResult.set).toHaveBeenCalledWith('analytics:summary', JSON.stringify({ total: 100 }), 'EX', 60);
      expect(mockMultiResult.sadd).toHaveBeenCalledWith('idx:analytics:summary', 'analytics:summary');
      expect(mockMultiResult.expire).toHaveBeenCalledWith('idx:analytics:summary', 120);
      expect(mockMultiResult.exec).toHaveBeenCalled();
    });

    it('should do nothing if redis is offline', async () => {
      (service as any).isRedisAvailable = false;
      await service.set('test_key', { foo: 'bar' });
      expect(mockRedisInstance.multi).not.toHaveBeenCalled();
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
    it('should use SMEMBERS to retrieve tracked keys and DEL them (SADD-based invalidation)', async () => {
      (service as any).isRedisAvailable = true;
      mockRedisInstance.smembers.mockResolvedValue(['master:products:1', 'master:products:2', 'master:products:3']);
      mockRedisInstance.del.mockResolvedValue(3);

      await service.invalidateByPattern('master:products:*');

      expect(mockRedisInstance.smembers).toHaveBeenCalledWith('idx:master:products');
      expect(mockRedisInstance.del).toHaveBeenCalledTimes(2);
      expect(mockRedisInstance.del).toHaveBeenNthCalledWith(1, 'master:products:1', 'master:products:2', 'master:products:3');
      expect(mockRedisInstance.del).toHaveBeenNthCalledWith(2, 'idx:master:products');
    });

    it('should handle exact key pattern without SMEMBERS', async () => {
      (service as any).isRedisAvailable = true;
      mockRedisInstance.smembers.mockResolvedValue([]);
      mockRedisInstance.del.mockResolvedValue(1);

      await service.invalidateByPattern('analytics:summary');

      expect(mockRedisInstance.del).toHaveBeenCalledWith('analytics:summary');
    });

    it('should handle empty tracked keys gracefully', async () => {
      (service as any).isRedisAvailable = true;
      mockRedisInstance.smembers.mockResolvedValue([]);

      await service.invalidateByPattern('master:products:*');

      expect(mockRedisInstance.smembers).toHaveBeenCalledWith('idx:master:products');
      expect(mockRedisInstance.del).not.toHaveBeenCalled();
    });
  });
});