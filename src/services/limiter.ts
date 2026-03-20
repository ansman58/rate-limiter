import { fixedWindow } from '../algorithms/fixedWindow';
import { slidingWindow } from '../algorithms/slidingWindow';
import { tokenBucket } from '../algorithms/tokenBucket';
import { getClientConfig } from './clientConfig';
import type { AlgorithmFn, AlgorithmName, AppInstance, RateLimitResult } from '../types';

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
 * Fetches the client config, picks the correct algorithm, and executes it.
 */
export async function checkRateLimit(
  app: AppInstance,
  clientId: string,
  endpoint: string = '/',
): Promise<RateLimitResult> {
  const config = await getClientConfig(app, clientId);

  if (!config) {
    throw new NotFoundError(`Client "${clientId}" not found`);
  }

  const algorithmFn = algorithms[config.algorithm];
  if (!algorithmFn) {
    throw new InternalError(`Unknown algorithm: ${config.algorithm}`);
  }

  const key = `${clientId}:${endpoint}`;

  if (config.algorithm === 'token-bucket') {
    return algorithmFn(app.redis, key, config.max_requests, config.refill_rate || 1);
  }

  return algorithmFn(app.redis, key, config.max_requests, config.window_ms);
}
