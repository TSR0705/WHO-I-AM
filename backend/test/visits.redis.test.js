const request = require('supertest');

describe('Visits (Redis)', () => {
  let app;

  beforeAll(async () => {
    // Start a temporary redis using docker if available, otherwise skip test
    // For simplicity in CI we expect REDIS_URL to be provided; here we skip if not present.
    if (!process.env.REDIS_URL) {
      console.warn('Skipping Redis tests because REDIS_URL is not set');
      return;
    }
    delete require.cache[require.resolve('..')];
    app = require('..');
  });

  test('reads/writes visits using redis if configured', async () => {
    if (!process.env.REDIS_URL) return;
    const agent = request(app);
    const r1 = await agent.get('/api/whoami');
    expect(r1.statusCode).toBe(200);
    const r2 = await agent.get('/api/whoami');
    expect(r2.statusCode).toBe(200);
    expect(r2.body.visits.total).toBeGreaterThanOrEqual(r1.body.visits.total + 1);
  }, 20000);
});
