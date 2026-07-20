import { Test, TestingModule } from '@nestjs/testing';
import { RedisCacheService, CacheKey } from '../redis-cache.service';
import { ConfigService } from '@nestjs/config';

const mockConfig = {
  get: jest.fn((key: string) => {
    const values: Record<string, unknown> = {
      'queue.redis.host': 'localhost',
      'queue.redis.port': 6379,
      'queue.redis.password': undefined,
    };
    return values[key];
  }),
};

describe('RedisCacheService', () => {
  let service: RedisCacheService;
  let redisMock: {
    get: jest.Mock;
    set: jest.Mock;
    del: jest.Mock;
    keys: jest.Mock;
    connect: jest.Mock;
    quit: jest.Mock;
    on: jest.Mock;
  };

  beforeEach(async () => {
    redisMock = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
      keys: jest.fn(),
      connect: jest.fn().mockResolvedValue(undefined),
      quit: jest.fn().mockResolvedValue(undefined),
      on: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [RedisCacheService, { provide: ConfigService, useValue: mockConfig }],
    }).compile();

    service = module.get<RedisCacheService>(RedisCacheService);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (service as any).client = redisMock;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (service as any).available = true;
  });

  describe('get', () => {
    it('should return parsed value on cache hit', async () => {
      redisMock.get.mockResolvedValue(JSON.stringify({ foo: 'bar' }));
      const result = await service.get<{ foo: string }>('test-key');
      expect(result).toEqual({ foo: 'bar' });
    });

    it('should return null on cache miss', async () => {
      redisMock.get.mockResolvedValue(null);
      const result = await service.get('missing-key');
      expect(result).toBeNull();
    });

    it('should return null and not throw when Redis errors', async () => {
      redisMock.get.mockRejectedValue(new Error('connection refused'));
      const result = await service.get('key');
      expect(result).toBeNull();
    });

    it('should return null without hitting Redis when unavailable', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (service as any).available = false;
      const result = await service.get('key');
      expect(result).toBeNull();
      expect(redisMock.get).not.toHaveBeenCalled();
    });
  });

  describe('set', () => {
    it('should set value with EX TTL', async () => {
      redisMock.set.mockResolvedValue('OK');
      await service.set('my-key', { data: 42 }, 300);
      expect(redisMock.set).toHaveBeenCalledWith('my-key', JSON.stringify({ data: 42 }), 'EX', 300);
    });

    it('should not throw when set fails', async () => {
      redisMock.set.mockRejectedValue(new Error('OOM'));
      await expect(service.set('key', 'value', 60)).resolves.toBeUndefined();
    });
  });

  describe('del', () => {
    it('should delete keys', async () => {
      redisMock.del.mockResolvedValue(2);
      await service.del('key1', 'key2');
      expect(redisMock.del).toHaveBeenCalledWith('key1', 'key2');
    });

    it('should be a no-op when called with no keys', async () => {
      await service.del();
      expect(redisMock.del).not.toHaveBeenCalled();
    });
  });

  describe('delByPattern', () => {
    it('should scan and delete matching keys', async () => {
      redisMock.keys.mockResolvedValue(['analytics:org-1:overview', 'analytics:org-1:deals:all']);
      redisMock.del.mockResolvedValue(2);

      await service.delByPattern('analytics:org-1:*');

      expect(redisMock.del).toHaveBeenCalledWith(
        'analytics:org-1:overview',
        'analytics:org-1:deals:all',
      );
    });

    it('should not call del when no keys match', async () => {
      redisMock.keys.mockResolvedValue([]);
      await service.delByPattern('analytics:org-x:*');
      expect(redisMock.del).not.toHaveBeenCalled();
    });
  });

  describe('getOrSet', () => {
    it('should return cached value without calling fn on HIT', async () => {
      redisMock.get.mockResolvedValue(JSON.stringify({ cached: true }));
      const fn = jest.fn().mockResolvedValue({ cached: false });

      const result = await service.getOrSet('key', fn, 300);

      expect(result).toEqual({ cached: true });
      expect(fn).not.toHaveBeenCalled();
    });

    it('should call fn and store result on MISS', async () => {
      redisMock.get.mockResolvedValue(null);
      redisMock.set.mockResolvedValue('OK');
      const fn = jest.fn().mockResolvedValue({ computed: true });

      const result = await service.getOrSet('key', fn, 300);

      expect(result).toEqual({ computed: true });
      expect(fn).toHaveBeenCalledTimes(1);
      expect(redisMock.set).toHaveBeenCalledWith(
        'key',
        JSON.stringify({ computed: true }),
        'EX',
        300,
      );
    });

    it('should still return fn result even when Redis set fails', async () => {
      redisMock.get.mockResolvedValue(null);
      redisMock.set.mockRejectedValue(new Error('write error'));
      const fn = jest.fn().mockResolvedValue({ data: 'fresh' });

      const result = await service.getOrSet('key', fn, 60);
      expect(result).toEqual({ data: 'fresh' });
    });
  });

  describe('CacheKey', () => {
    it('should produce stable namespaced keys', () => {
      expect(CacheKey.analyticsOverview('org-1')).toBe('analytics:org-1:overview');
      expect(CacheKey.orgPattern('org-1')).toBe('analytics:org-1:*');
    });
  });
});
