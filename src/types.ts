import type { FastifyInstance } from 'fastify';
import type Redis from 'ioredis';
import type { Pool } from 'pg';

/** Result returned by every rate-limiting algorithm */
export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  limit: number;
  resetAt: string;
}

/** Supported algorithm names */
export type AlgorithmName = 'fixed-window' | 'sliding-window' | 'token-bucket';

/** Algorithm function signature */
export type AlgorithmFn = (
  redis: Redis,
  key: string,
  limit: number,
  windowOrRate: number,
) => Promise<RateLimitResult>;

/** Client config row from the database */
export interface ClientConfig {
  id: number;
  client_id: string;
  algorithm: AlgorithmName;
  max_requests: number;
  window_ms: number;
  refill_rate: number | null;
  created_at: string;
  updated_at: string;
}

/** Inline client config for browser-local clients (not stored in DB) */
export interface InlineClientConfig {
  algorithm: AlgorithmName;
  limit: number;
  windowMs: number;
  refillRate?: number;
}

/** Request body for POST /check */
export interface CheckBody {
  clientId: string;
  endpoint?: string;
  /** Passed by the frontend for browser-local clients to avoid hitting the DB */
  inlineConfig?: InlineClientConfig;
}

/** Request body for POST /clients */
export interface CreateClientBody {
  clientId: string;
  algorithm: AlgorithmName;
  limit: number;
  windowMs: number;
  refillRate?: number;
}

/** Extended Fastify instance with decorated Redis and Postgres */
export interface AppInstance extends FastifyInstance {
  redis: Redis;
  pg: Pool;
}
