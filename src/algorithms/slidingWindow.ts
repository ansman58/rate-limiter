import type Redis from 'ioredis';
import type { RateLimitResult } from '../types';

/**
 * Sliding Window Log Rate Limiting Algorithm
 *
 * Maintains a sorted set of timestamps for each key.
 * Removes expired entries and counts remaining ones
 * to decide if the request is allowed.
 */
export async function slidingWindow(
  redis: Redis,
  key: string,
  limit: number,
  windowSizeMs: number,
): Promise<RateLimitResult> {
  const now = Date.now();
  const windowStart = now - windowSizeMs;
  const member = `${now}:${Math.random().toString(36).slice(2)}`;
  const windowKey = `sw:${key}`;

  const multi = redis.multi();
  multi.zremrangebyscore(windowKey, 0, windowStart);
  multi.zadd(windowKey, now, member);
  multi.zcard(windowKey);
  multi.pexpire(windowKey, windowSizeMs);

  const results = await multi.exec();
  if (!results) throw new Error('Redis multi exec failed');

  const count = results[2][1] as number;

  const allowed = count <= limit;
  const remaining = Math.max(0, limit - count);

  return {
    allowed,
    remaining,
    limit,
    resetAt: new Date(now + windowSizeMs).toISOString(),
  };
}
