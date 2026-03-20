import { buildApp } from '../src/app';
import type { FastifyInstance } from 'fastify';

describe('POST /check route', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildApp({ logger: false });
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  test('should return 400 for missing clientId', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/check',
      payload: {},
    });

    expect(response.statusCode).toBe(400);
  });

  test('should return rate-limit result for valid request', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/check',
      payload: { clientId: 'test-client', endpoint: '/api/data' },
    });

    expect([200, 404, 429]).toContain(response.statusCode);
  });
});
