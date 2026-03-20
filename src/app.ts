import Fastify, { type FastifyInstance } from 'fastify';
import { createRedisClient } from './config/redis';
import { createPool } from './config/db';
import checkRoutes from './routes/check';
import adminRoutes from './routes/admin';

interface BuildAppOptions {
  logger?: boolean | object;
  logLevel?: string;
}

/**
 * Build and configure the Fastify application.
 */
export async function buildApp(opts: BuildAppOptions = {}): Promise<FastifyInstance> {
  const app = Fastify({
    logger: opts.logger !== false ? { level: opts.logLevel || 'info' } : false,
  });

  // --- Decorate with Redis ---
  const redis = createRedisClient();
  app.decorate('redis', redis);
  app.addHook('onClose', async () => {
    await redis.quit();
  });

  // --- Decorate with Postgres ---
  const pg = createPool();
  app.decorate('pg', pg);
  app.addHook('onClose', async () => {
    await pg.end();
  });

  // --- Register routes ---
  app.register(checkRoutes);
  app.register(adminRoutes);

  // --- Health check ---
  app.get('/health', async () => ({
    status: 'ok',
    timestamp: new Date().toISOString(),
  }));

  return app;
}
