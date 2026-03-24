import { Pool } from 'pg';

/**
 * Creates and returns a PostgreSQL connection pool.
 */
export function createPool(): Pool {
  const commonOptions = {
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  };

  const connectionString = process.env.POSTGRES_URL;
  const isSslNeeded = connectionString && !connectionString.includes('localhost');

  const pool = connectionString
    ? new Pool({
        connectionString,
        ssl: isSslNeeded ? { rejectUnauthorized: false } : undefined,
        ...commonOptions,
      })
    : new Pool({
        host: process.env.POSTGRES_HOST || 'localhost',
        port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
        database: process.env.POSTGRES_DB || 'rate_limiter',
        user: process.env.POSTGRES_USER || 'postgres',
        password: process.env.POSTGRES_PASSWORD || 'postgres',
        ...commonOptions,
      });

  pool.on('error', (err) => {
    console.error('Unexpected Postgres pool error:', err);
  });

  return pool;
}
