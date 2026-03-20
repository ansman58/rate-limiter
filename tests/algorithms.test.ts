import type Redis from 'ioredis';
import { fixedWindow } from '../src/algorithms/fixedWindow';
import { slidingWindow } from '../src/algorithms/slidingWindow';
import { tokenBucket } from '../src/algorithms/tokenBucket';

/** Mock Redis client for unit testing */
function createMockRedis(): Partial<Redis> {
  const store: Record<string, number> = {};

  return {
    multi() {
      const commands: [string, string][] = [];
      return {
        incr(key: string) { commands.push(['incr', key]); return this; },
        pttl(key: string) { commands.push(['pttl', key]); return this; },
        zremrangebyscore(key: string, _min: number, _max: number) { commands.push(['zremrangebyscore', key]); return this; },
        zadd(key: string, _score: number, _member: string) { commands.push(['zadd', key]); return this; },
        zcard(key: string) { commands.push(['zcard', key]); return this; },
        pexpire(key: string, _ms: number) { commands.push(['pexpire', key]); return this; },
        async exec() {
          const results: [null, number][] = [];
          for (const [cmd, key] of commands) {
            switch (cmd) {
              case 'incr':
                store[key] = (store[key] || 0) + 1;
                results.push([null, store[key]]);
                break;
              case 'pttl':
                results.push([null, store[`ttl:${key}`] ?? -1]);
                break;
              case 'zremrangebyscore':
                results.push([null, 0]);
                break;
              case 'zadd':
                store[key] = (store[key] || 0) + 1;
                results.push([null, 1]);
                break;
              case 'zcard':
                results.push([null, store[key] || 0]);
                break;
              case 'pexpire':
                store[`ttl:${key}`] = 1;
                results.push([null, 1]);
                break;
              default:
                results.push([null, 0]);
            }
          }
          return results;
        },
      } as any;
    },
    async pexpire() { return 1 as any; },
    async eval(_script: string, _numKeys: number, _key: string, maxTokens: number) {
      return [1, maxTokens - 1, maxTokens];
    },
  } as any;
}

describe('Fixed Window Algorithm', () => {
  test('should allow requests within limit', async () => {
    const redis = createMockRedis() as Redis;
    const result = await fixedWindow(redis, 'test-client', 10, 60000);
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBeLessThanOrEqual(10);
    expect(result).toHaveProperty('resetAt');
  });
});

describe('Sliding Window Algorithm', () => {
  test('should allow requests within limit', async () => {
    const redis = createMockRedis() as Redis;
    const result = await slidingWindow(redis, 'test-client', 10, 60000);
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBeLessThanOrEqual(10);
    expect(result).toHaveProperty('resetAt');
  });
});

describe('Token Bucket Algorithm', () => {
  test('should allow requests when tokens available', async () => {
    const redis = createMockRedis() as Redis;
    const result = await tokenBucket(redis, 'test-client', 10, 1);
    expect(result.allowed).toBe(true);
    expect(result).toHaveProperty('remaining');
    expect(result).toHaveProperty('resetAt');
  });
});
