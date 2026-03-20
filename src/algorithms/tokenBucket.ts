import type Redis from 'ioredis';
import type { RateLimitResult } from '../types';

/**
 * Token Bucket Rate Limiting Algorithm
 *
 * Each key has a bucket that fills with tokens at a steady rate.
 * Each request consumes one token. Requests are denied when the bucket is empty.
 * Tokens replenish over time up to a maximum (burst) capacity.
 */

const LUA_SCRIPT = `
  local bucket_key = KEYS[1]
  local max_tokens = tonumber(ARGV[1])
  local refill_rate = tonumber(ARGV[2])
  local now = tonumber(ARGV[3])

  local data = redis.call('HMGET', bucket_key, 'tokens', 'last_refill')
  local tokens = tonumber(data[1])
  local last_refill = tonumber(data[2])

  if tokens == nil then
    tokens = max_tokens
    last_refill = now
  end

  local elapsed_ms = now - last_refill
  local new_tokens = (elapsed_ms / 1000) * refill_rate
  tokens = math.min(max_tokens, tokens + new_tokens)

  local allowed = 0
  if tokens >= 1 then
    tokens = tokens - 1
    allowed = 1
  end

  redis.call('HMSET', bucket_key, 'tokens', tokens, 'last_refill', now)
  redis.call('PEXPIRE', bucket_key, math.ceil(max_tokens / refill_rate) * 1000 + 1000)

  return { allowed, math.floor(tokens), max_tokens }
`;

export async function tokenBucket(
  redis: Redis,
  key: string,
  maxTokens: number,
  refillRatePerSec: number,
): Promise<RateLimitResult> {
  const now = Date.now();
  const bucketKey = `tb:${key}`;

  const result = (await redis.eval(
    LUA_SCRIPT,
    1,
    bucketKey,
    maxTokens,
    refillRatePerSec,
    now,
  )) as number[];

  const allowed = result[0] === 1;
  const remaining = result[1];
  const msUntilNextToken = Math.ceil(1000 / refillRatePerSec);

  return {
    allowed,
    remaining,
    limit: maxTokens,
    resetAt: new Date(now + msUntilNextToken).toISOString(),
  };
}
