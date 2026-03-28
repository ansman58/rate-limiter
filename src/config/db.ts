import { Pool } from "pg";

/**
 * Creates and returns a PostgreSQL connection pool.
 */
export function createPool(): Pool {
  const commonOptions = {
    max: process.env.VERCEL ? 1 : 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  };

  if (process.env.POSTGRES_URL) {
    return new Pool({
      connectionString: process.env.POSTGRES_URL,
      ssl: { rejectUnauthorized: false },
      ...commonOptions,
    });
  }

  const host = process.env.POSTGRES_HOST || "localhost";
  const isLocal = host === "localhost" || host === "127.0.0.1";

  const pool = new Pool({
    host,
    port: parseInt(process.env.POSTGRES_PORT || "5432", 10),
    database: process.env.POSTGRES_DATABASE || "rate_limiter",
    user: process.env.POSTGRES_USER || "postgres",
    password: process.env.POSTGRES_PASSWORD || "postgres",
    ssl: isLocal ? undefined : { rejectUnauthorized: false },
    ...commonOptions,
  });
  pool.on("connect", () => {
    console.log(" postgres connecteddd");
  });

  pool.on("error", (err) => {
    console.error("Unexpected Postgres pool error:", err);
  });

  return pool;
}
