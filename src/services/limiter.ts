import { fixedWindow } from '../algorithms/fixedWindow';
import { slidingWindow } from '../algorithms/slidingWindow';
import { tokenBucket } from '../algorithms/tokenBucket';
import { getClientConfig } from './clientConfig';
import type { AlgorithmFn, AlgorithmName, AppInstance, InlineClientConfig, RateLimitResult } from '../types';

const algorithms: Record<AlgorithmName, AlgorithmFn> = {
  'fixed-window': fixedWindow,
  'sliding-window': slidingWindow,
  'token-bucket': tokenBucket,
};

class NotFoundError extends Error {
  statusCode = 404;
  constructor(message: string) {
    super(message);
    this.name = 'NotFoundError';
  }
}

class InternalError extends Error {
  statusCode = 500;
  constructor(message: string) {
    super(message);
    this.name = 'InternalError';
  }
}

/**
 * Core rate limiting logic.
 * Fetches the client config (from DB or inline), picks the correct algorithm, and executes it.
 */
export async function checkRateLimit(
  app: AppInstance,
  clientId: string,
  inlineConfig?: InlineClientConfig,
): Promise<RateLimitResult> {
  let algorithm: AlgorithmName;
  let maxRequests: number;
  let windowMs: number;
  let refillRate: number | null;

  if (inlineConfig) {
    // Browser-local client — use the config provided by the frontend directly
    algorithm = inlineConfig.algorithm;
    maxRequests = inlineConfig.limit;
    windowMs = inlineConfig.windowMs;
    refillRate = inlineConfig.refillRate ?? null;
  } else {
    const config = await getClientConfig(app, clientId);
    if (!config) {
      throw new NotFoundError(`Client "${clientId}" not found`);
    }
    algorithm = config.algorithm;
    maxRequests = config.max_requests;
    windowMs = config.window_ms;
    refillRate = config.refill_rate;
  }

  const algorithmFn = algorithms[algorithm];
  if (!algorithmFn) {
    throw new InternalError(`Unknown algorithm: ${algorithm}`);
  }

  const key = `${clientId}`;

  if (algorithm === 'token-bucket') {
    return algorithmFn(app.redis, key, maxRequests, refillRate || 1);
  }

  return algorithmFn(app.redis, key, maxRequests, windowMs);
}
