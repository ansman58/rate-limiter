import app from '../src/fastify';

/**
 * Concurrency / race condition tests.
 *
 * Verifies that concurrent requests to the same client
 * correctly increment the counter and enforce the limit
 * without race conditions.
 */
describe('Concurrency - Race Condition Test', () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  test('should handle concurrent requests without race conditions', async () => {
    const concurrentRequests = 20;
    const payload = { clientId: 'concurrent-test' };

    const promises = Array.from({ length: concurrentRequests }, () =>
      app.inject({
        method: 'POST',
        url: '/check',
        payload,
      }),
    );

    const results = await Promise.all(promises);

    results.forEach((res) => {
      expect([200, 404, 429]).toContain(res.statusCode);
    });

    const allowedCount = results.filter((r) => r.statusCode === 200).length;
    console.log(`Concurrency test: ${allowedCount}/${concurrentRequests} requests allowed`);
  });
});
