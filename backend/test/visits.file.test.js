const request = require('supertest');
const fs = require('fs');
const path = require('path');

const VISITS_FILE = path.join(__dirname, '..', 'visits.json');

describe('Visits (file fallback)', () => {
  let app;

  beforeAll(() => {
    // Ensure Redis is not used for this test
    delete process.env.REDIS_URL;
    // Reset visits file
    fs.writeFileSync(VISITS_FILE, JSON.stringify({ total: 0, byIp: {} }, null, 2));
    // Clear require cache then require app
    delete require.cache[require.resolve('..')];
    app = require('..');
  });

  afterAll(() => {
    // cleanup
    try { fs.writeFileSync(VISITS_FILE, JSON.stringify({ total: 0, byIp: {} }, null, 2)); } catch (e) {
      // ignore
    }
  });

  test('visits increment across requests (same IP)', async () => {
    const agent = request(app);
    const res1 = await agent.get('/api/whoami');
    expect(res1.statusCode).toBe(200);
    expect(res1.body).toHaveProperty('visits');
    expect(res1.body.visits.total).toBe(1);
    expect(res1.body.visits.unique).toBe(1);
    expect(res1.body.visits.yourVisits).toBe(1);

    const res2 = await agent.get('/api/whoami');
    expect(res2.statusCode).toBe(200);
    expect(res2.body.visits.total).toBe(2);
    expect(res2.body.visits.unique).toBe(1);
    expect(res2.body.visits.yourVisits).toBe(2);
  }, 10000);
});
