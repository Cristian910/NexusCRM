import type { ConfigService } from '@nestjs/config';
import type { RedisOptions } from 'ioredis';

/**
 * Resolves the Redis connection options shared by BullMQ and RedisCacheService.
 *
 * Managed providers (Upstash, Redis Cloud, Railway, etc.) hand you a single
 * `rediss://default:PASSWORD@host:port` URL — the "rediss:" scheme is what
 * tells ioredis to negotiate TLS. We parse it once here so both consumers get
 * identical host/port/auth/TLS settings; each caller still layers its own
 * retry policy on top (BullMQ requires `maxRetriesPerRequest: null`, while the
 * cache wrapper deliberately fails fast — those are call-site concerns, not
 * connection concerns).
 *
 * Local development has no URL configured, so we fall back to discrete
 * host/port/password — no TLS needed talking to a Redis container on localhost.
 */
export function getRedisOptions(configService: ConfigService): RedisOptions {
  const url = configService.get<string>('queue.redis.url');

  if (url) {
    const parsed = new URL(url);
    return {
      host: parsed.hostname,
      port: Number(parsed.port) || 6379,
      username: parsed.username ? decodeURIComponent(parsed.username) : undefined,
      password: parsed.password ? decodeURIComponent(parsed.password) : undefined,
      tls: parsed.protocol === 'rediss:' ? {} : undefined,
    };
  }

  return {
    host: configService.get<string>('queue.redis.host') ?? 'localhost',
    port: configService.get<number>('queue.redis.port') ?? 6379,
    password: configService.get<string>('queue.redis.password') || undefined,
  };
}
