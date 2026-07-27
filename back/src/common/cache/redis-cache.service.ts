import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { getRedisOptions } from '@/config/redis-connection.util';

/**
 * RedisCache is a thin, strongly-typed wrapper around ioredis.
 *
 * Design decisions:
 * - All keys are namespaced by organizationId to prevent cross-tenant leaks.
 * - All operations are wrapped in try/catch. A Redis failure must NEVER
 *   break the primary request — we degrade gracefully to DB queries.
 * - TTLs are configurable per-key-family via environment variables.
 */
@Injectable()
export class RedisCacheService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisCacheService.name);
  private client: Redis;
  private available = false;

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    this.client = new Redis({
      ...getRedisOptions(this.configService),
      lazyConnect: true,
      enableReadyCheck: true,
      maxRetriesPerRequest: 1,
      retryStrategy: (times) => (times > 3 ? null : Math.min(times * 200, 1000)),
    });

    this.client.on('connect', () => {
      this.available = true;
      this.logger.log('Redis cache connected');
    });

    this.client.on('error', (err: Error) => {
      this.available = false;
      this.logger.warn(`Redis cache error: ${err.message}`);
    });

    this.client.connect().catch((err: Error) => {
      this.logger.warn(`Redis cache initial connect failed: ${err.message} — will retry`);
    });
  }

  async onModuleDestroy() {
    await this.client.quit();
  }

  // ─── Public API ───────────────────────────────────────────────────────────────

  async get<T>(key: string): Promise<T | null> {
    if (!this.available) return null;
    try {
      const raw = await this.client.get(key);
      if (!raw) return null;
      return JSON.parse(raw) as T;
    } catch (err) {
      this.logger.warn(`Cache GET failed for key "${key}": ${(err as Error).message}`);
      return null;
    }
  }

  async set(key: string, value: unknown, ttlSeconds: number): Promise<void> {
    if (!this.available) return;
    try {
      await this.client.set(key, JSON.stringify(value), 'EX', ttlSeconds);
    } catch (err) {
      this.logger.warn(`Cache SET failed for key "${key}": ${(err as Error).message}`);
    }
  }

  async del(...keys: string[]): Promise<void> {
    if (!this.available || keys.length === 0) return;
    try {
      await this.client.del(...keys);
    } catch (err) {
      this.logger.warn(`Cache DEL failed: ${(err as Error).message}`);
    }
  }

  /**
   * Delete all keys matching a pattern.
   * Used to invalidate an organization's analytics cache in one call.
   */
  async delByPattern(pattern: string): Promise<void> {
    if (!this.available) return;
    try {
      const keys = await this.client.keys(pattern);
      if (keys.length > 0) {
        await this.client.del(...keys);
        this.logger.debug(`Invalidated ${keys.length} cache keys matching "${pattern}"`);
      }
    } catch (err) {
      this.logger.warn(`Cache delByPattern failed for "${pattern}": ${(err as Error).message}`);
    }
  }

  /**
   * Cache-aside helper: returns cached value or calls `fn`, caches the result.
   */
  async getOrSet<T>(key: string, fn: () => Promise<T>, ttlSeconds: number): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null) {
      this.logger.debug(`Cache HIT → ${key}`);
      return cached;
    }

    this.logger.debug(`Cache MISS → ${key}`);
    const result = await fn();
    await this.set(key, result, ttlSeconds);
    return result;
  }

  isAvailable(): boolean {
    return this.available;
  }
}

// ─── Cache key factory ────────────────────────────────────────────────────────

export const CacheKey = {
  analyticsOverview: (orgId: string) => `analytics:${orgId}:overview`,
  analyticsDeals: (orgId: string, suffix: string) => `analytics:${orgId}:deals:${suffix}`,
  analyticsUsers: (orgId: string) => `analytics:${orgId}:users`,
  analyticsClients: (orgId: string, suffix: string) => `analytics:${orgId}:clients:${suffix}`,
  analyticsTasks: (orgId: string, suffix: string) => `analytics:${orgId}:tasks:${suffix}`,
  orgPattern: (orgId: string) => `analytics:${orgId}:*`,
} as const;
