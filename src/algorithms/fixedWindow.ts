import type Redis from 'ioredis';
import type { RateLimitResult } from '../types';

/**
 * Fixed Window Rate Limiting Algorithm
 *
 * Divides time into fixed windows (e.g., 60-second intervals).
 * Each request increments a counter for the current window.
 * Requests are denied once the counter exceeds the limit.
 */
export async function fixedWindow(
  redis: Redis,
  key: string,
  limit: number,
  windowSizeMs: number,
): Promise<RateLimitResult> {
  const now = Date.now();
  const windowKey = `fw:${key}:${Math.floor(now / windowSizeMs)}`;

  const multi = redis.multi();
  multi.incr(windowKey);
  multi.pttl(windowKey);

  const results = await multi.exec();
  if (!results) throw new Error('Redis multi exec failed');

  const count = results[0][1] as number;
  const ttl = results[1][1] as number;

  // Set expiry on first request in window
  if (ttl === -1) {
    await redis.pexpire(windowKey, windowSizeMs);
  }

  const allowed = count <= limit;
  const remaining = Math.max(0, limit - count);
  const resetMs = Math.ceil((Math.floor(now / windowSizeMs) + 1) * windowSizeMs);

  return {
    allowed,
    remaining,
    limit,
    resetAt: new Date(resetMs).toISOString(),
  };
}
