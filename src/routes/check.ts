import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { checkSchema } from '../middleware/validate';
import { checkRateLimit } from '../services/limiter';
import type { AppInstance, CheckBody } from '../types';

/**
 * POST /check — Check if a request is allowed under the rate limit.
 */
export default async function checkRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.post<{ Body: CheckBody }>(
    '/check',
    {
      schema: {
        body: checkSchema,
        response: {
          200: {
            type: 'object',
            properties: {
              allowed: { type: 'boolean' },
              remaining: { type: 'integer' },
              limit: { type: 'integer' },
              resetAt: { type: 'string' },
            },
          },
        },
      },
    },
    async (request: FastifyRequest<{ Body: CheckBody }>, reply: FastifyReply) => {
      const { clientId, inlineConfig } = request.body;
      const result = await checkRateLimit(fastify as AppInstance, clientId, inlineConfig);
      const statusCode = result.allowed ? 200 : 429;

      reply.code(statusCode).send(result);
    },
  );
}
