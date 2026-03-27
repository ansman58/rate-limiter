import app from '../src/fastify';

describe('POST /check route', () => {
  beforeAll(async () => {
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
      payload: { clientId: 'test-client' },
    });

    expect([200, 404, 429]).toContain(response.statusCode);
  });
});
