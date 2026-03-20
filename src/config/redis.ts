import Redis from 'ioredis';

/**
 * Creates and returns a Redis client instance.
 */
export function createRedisClient(): Redis {
  const client = new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || undefined,
    maxRetriesPerRequest: 3,
    retryStrategy(times: number) {
      const delay = Math.min(times * 200, 5000);
      return delay;
    },
  });

  client.on('connect', () => {
    console.log('✅ Redis connected');
  });

  client.on('error', (err: Error) => {
    console.error('❌ Redis error:', err.message);
  });

  return client;
}
