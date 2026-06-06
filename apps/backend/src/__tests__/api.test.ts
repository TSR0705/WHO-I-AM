jest.mock('../services/db', () => ({
  pool: {
    query: () => Promise.resolve({ rows: [{ count: '1' }] })
  },
  initDatabase: () => Promise.resolve(),
  dbInitPromise: Promise.resolve()
}));

import request from 'supertest';
import app from '../index';
import fs from 'fs';
import path from 'path';

const visitsFile = path.join(__dirname, '..', 'visits.json');

describe('WhoAmI API Integration Tests', () => {
  beforeAll(() => {
    // Set dummy environment variables to avoid real service connections
    delete process.env.DATABASE_URL;
    delete process.env.REDIS_URL;
  });

  afterAll(() => {
    // Optionally clean up visits.json if created in source directory
    try {
      if (fs.existsSync(visitsFile)) {
        fs.unlinkSync(visitsFile);
      }
    } catch (e) {
      // ignore
    }
  });

  describe('GET /health', () => {
    it('should return 200 OK with server status and uptime', async () => {
      const response = await request(app).get('/health');
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'ok');
      expect(response.body).toHaveProperty('uptime');
      expect(response.body).toHaveProperty('redis', false);
    });
  });

  describe('GET /ready', () => {
    it('should return 200 OK since Redis is not configured (optional dependency)', async () => {
      const response = await request(app).get('/ready');
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('ready', true);
    });
  });

  describe('GET /api/visits', () => {
    it('should return visitor counts from the local JSON fallback', async () => {
      const response = await request(app).get('/api/visits');
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('total');
      expect(response.body).toHaveProperty('unique');
    });
  });

  describe('GET /api/whoami', () => {
    it('should return client information parsed from requests', async () => {
      const response = await request(app)
        .get('/api/whoami')
        .set('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('ip');
      expect(response.body).toHaveProperty('browser');
      expect(response.body).toHaveProperty('os');
      expect(response.body.os).toContain('Windows');
      expect(response.body).toHaveProperty('device');
      expect(response.body).toHaveProperty('location');
      expect(response.body).toHaveProperty('network');
      expect(response.body.network).toHaveProperty('isp');
      expect(response.body.network).toHaveProperty('asn');
      expect(response.body.network).toHaveProperty('timezone');
      expect(response.body).toHaveProperty('visits');
      expect(response.body.visits).toHaveProperty('total');
      expect(response.body.visits).toHaveProperty('unique');
      expect(response.body.visits).toHaveProperty('yourVisits');
    });

    it('should handle simulated IP and User-Agent spoofing in sandbox mode', async () => {
      const response = await request(app)
        .get('/api/whoami?spoofIp=8.8.8.8&spoofUserAgent=Mozilla/5.0%20(Macintosh;%20Intel%20Mac%20OS%20X%2010_15_7)%20AppleWebKit/605.1.15%20(KHTML,%20like%20Gecko)%20Version/16.0%20Safari/605.1.15')
        .set('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/115.0.0.0');

      expect(response.status).toBe(200);
      expect(response.body.ip).toBe('8.8.8.8');
      expect(response.body.os).toContain('Mac');
      expect(response.body.simulation.active).toBe(true);
      expect(response.body.simulation.isSpoofedIp).toBe(true);
      expect(response.body.simulation.isSpoofedUserAgent).toBe(true);
      expect(response.body.network.asn).toBe('AS15169');
      expect(response.body.network.isp).toContain('Google');
    });

    it('should detect User-Agent and client OS platform mismatch', async () => {
      const response = await request(app)
        .get('/api/whoami?clientOs=Macintosh')
        .set('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/115.0.0.0');

      expect(response.status).toBe(200);
      expect(response.body.securityAudit.userAgentMismatch).toBe(true);
    });

    it('should parse and report proxy forwarding headers', async () => {
      const response = await request(app)
        .get('/api/whoami')
        .set('Via', '1.1 proxy-gateway')
        .set('X-Forwarded-For', '203.0.113.195, 70.41.3.18');

      expect(response.status).toBe(200);
      expect(response.body.proxy.hasProxyHeaders).toBe(true);
      expect(response.body.proxy.parsedHeaders).toHaveProperty('via', '1.1 proxy-gateway');
      expect(response.body.proxy.parsedHeaders).toHaveProperty('x-forwarded-for', '203.0.113.195, 70.41.3.18');
      expect(response.body.proxy.rawForwardedCount).toBe(2);
    });
  });

  describe('POST /api/fingerprint', () => {
    it('should return 400 if canvasHash or audioHash are missing', async () => {
      const response = await request(app)
        .post('/api/fingerprint')
        .send({ browser: 'Chrome' });
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Missing canvasHash or audioHash');
    });

    it('should record the fingerprint and calculate uniqueness (fallback mode)', async () => {
      const response = await request(app)
        .post('/api/fingerprint')
        .send({
          canvasHash: 'test_canvas_123',
          audioHash: 'test_audio_456',
          browser: 'Chrome',
          os: 'Windows',
          device: 'desktop'
        });
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('totalChecked');
      expect(response.body).toHaveProperty('canvas');
      expect(response.body.canvas).toHaveProperty('hash', 'test_canvas_123');
      expect(response.body.canvas).toHaveProperty('sharedPercentage');
      expect(response.body).toHaveProperty('audio');
      expect(response.body.audio).toHaveProperty('hash', 'test_audio_456');
      expect(response.body.audio).toHaveProperty('sharedPercentage');
    });
  });

  describe('DNS Leak Endpoints', () => {
    it('should initialize a DNS leak check session', async () => {
      const response = await request(app).get('/api/dns-leak/init');
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('testSubdomain');
      expect(response.body.testSubdomain).toContain(response.body.token);
    });

    it('should return 400 for checking leak without a token', async () => {
      const response = await request(app).get('/api/dns-leak/check');
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Missing token parameter');
    });

    it('should verify resolving checks and return data', async () => {
      const initResponse = await request(app).get('/api/dns-leak/init');
      const token = initResponse.body.token;

      const checkResponse = await request(app).get(`/api/dns-leak/check?token=${token}`);
      expect(checkResponse.status).toBe(200);
      expect(checkResponse.body).toHaveProperty('token', token);
      expect(checkResponse.body).toHaveProperty('resolversCount');
      expect(checkResponse.body).toHaveProperty('resolvers');
      expect(Array.isArray(checkResponse.body.resolvers)).toBe(true);
    });
  });
});
