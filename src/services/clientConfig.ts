import type { AppInstance, ClientConfig, CreateClientBody } from '../types';

const CACHE_TTL_SECONDS = 300; // 5 minutes

/**
 * Fetch client config, with Redis caching.
 */
export async function getClientConfig(
  app: AppInstance,
  clientId: string,
): Promise<ClientConfig | null> {
  const cacheKey = `config:${clientId}`;

  // Try cache first
  const cached = await app.redis.get(cacheKey);
  if (cached) {
    return JSON.parse(cached) as ClientConfig;
  }

  // Fetch from Postgres
  const { rows } = await app.pg.query<ClientConfig>(
    'SELECT * FROM clients WHERE client_id = $1 LIMIT 1',
    [clientId],
  );

  if (rows.length === 0) {
    return null;
  }

  const config = rows[0];

  // Cache it
  await app.redis.set(cacheKey, JSON.stringify(config), 'EX', CACHE_TTL_SECONDS);

  return config;
}

/**
 * Create a new client in Postgres.
 */
export async function createClient(
  app: AppInstance,
  body: CreateClientBody,
): Promise<ClientConfig> {
  const { clientId, algorithm, limit, windowMs, refillRate } = body;

  const { rows } = await app.pg.query<ClientConfig>(
    `INSERT INTO clients (client_id, algorithm, max_requests, window_ms, refill_rate)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [clientId, algorithm, limit, windowMs, refillRate ?? null],
  );

  // Invalidate cache
  await app.redis.del(`config:${clientId}`);

  return rows[0];
}

/**
 * Get all registered clients.
 */
export async function getAllClients(app: AppInstance): Promise<ClientConfig[]> {
  const { rows } = await app.pg.query<ClientConfig>(
    'SELECT * FROM clients ORDER BY created_at DESC',
  );
  return rows;
}
