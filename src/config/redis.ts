import Redis from 'ioredis';

/**
 * Creates and returns a Redis client instance.
 */
export function createRedisClient(): Redis {
  const connectionOptions = {
    maxRetriesPerRequest: 3,
    retryStrategy(times: number) {
      const delay = Math.min(times * 200, 5000);
      return delay;
    },
  };

  const client = process.env.REDIS_URL
    ? new Redis(process.env.REDIS_URL, connectionOptions)
    : new Redis({
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379', 10),
        password: process.env.REDIS_PASSWORD || undefined,
        lazyConnect: true,
        ...connectionOptions,
      });

  // Automatically connect if URL is available or trigger lazily
  if (process.env.REDIS_URL) {
     client.connect().catch(() => {});
  }

  client.on('connect', () => {
    console.log('✅ Redis connected');
  });

  client.on('error', (err: Error) => {
    console.error('❌ Redis error:', err.message);
  });

  return client;
}
