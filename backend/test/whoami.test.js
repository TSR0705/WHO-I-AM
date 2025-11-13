const request = require('supertest');
const app = require('..');

describe('GET /api/whoami', () => {
  it('responds with expected fields', async () => {
    const res = await request(app).get('/api/whoami');
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('ip');
    expect(res.body).toHaveProperty('browser');
    expect(res.body).toHaveProperty('os');
    expect(res.body).toHaveProperty('device');
    expect(res.body).toHaveProperty('location');
    expect(res.body).toHaveProperty('visits');
  }, 10000);
});
