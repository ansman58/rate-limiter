import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { createClientSchema } from '../middleware/validate';
import { createClient, getAllClients } from '../services/clientConfig';
import type { AppInstance, CreateClientBody } from '../types';

/**
 * Admin routes for managing rate-limited clients.
 */
export default async function adminRoutes(fastify: FastifyInstance): Promise<void> {
  // POST /clients — Register a new client with rate-limit config
  fastify.post<{ Body: CreateClientBody }>(
    '/clients',
    {
      schema: {
        body: createClientSchema,
        response: {
          201: {
            type: 'object',
            properties: {
              message: { type: 'string' },
              client: {
                type: 'object',
                properties: {
                  client_id: { type: 'string' },
                  algorithm: { type: 'string' },
                  max_requests: { type: 'integer' },
                  window_ms: { type: 'integer' },
                },
              },
            },
          },
        },
      },
    },
    async (request: FastifyRequest<{ Body: CreateClientBody }>, reply: FastifyReply) => {
      const client = await createClient(fastify as AppInstance, request.body);
      reply.code(201).send({ message: 'Client created', client });
    },
  );

  // GET /clients — List all registered clients
  fastify.get('/clients', async (request, reply) => {
    try {
      const clients = await getAllClients(fastify as AppInstance);
      return clients;
    } catch (err) {
      fastify.log.error(err, 'Failed to fetch clients from DB');
      return reply.code(200).send([]);
    }
  });
}
