import dotenv from 'dotenv';
dotenv.config();

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import requestIp from 'request-ip';
import UAParser from 'ua-parser-js';
// @ts-ignore
import geoip from 'geoip-lite';
import fs from 'fs';
import path from 'path';
import Redis from 'ioredis';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import pino from 'pino';
import * as client from 'prom-client';

const logger = pino({ level: process.env.LOG_LEVEL || 'info' });

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// Respect trust proxy settings
const trustProxyEnv = process.env.TRUST_PROXY;
let trustProxy: string | number | boolean;
if (typeof trustProxyEnv !== 'undefined') {
  if (/^\d+$/.test(trustProxyEnv)) {
    trustProxy = Number(trustProxyEnv);
  } else {
    trustProxy = trustProxyEnv === 'true';
  }
} else {
  trustProxy = (process.env.NODE_ENV === 'production') ? 1 : false;
}
app.set('trust proxy', trustProxy);

// Content Security Policy
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", 'https://unpkg.com', 'https://cdn.jsdelivr.net'],
      styleSrc: ["'self'", 'https://unpkg.com', 'https://cdn.jsdelivr.net'],
      imgSrc: ["'self'", 'data:', 'https://{s}.tile.openstreetmap.org', 'https://*.tile.openstreetmap.org', 'https://tile.openstreetmap.org'],
      connectSrc: ["'self'", 'https://ipapi.co', 'https://api.ipify.org', 'https://*.tile.openstreetmap.org'],
      fontSrc: ["'self'", 'https://unpkg.com', 'https://cdn.jsdelivr.net'],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
    }
  }
}));

app.use(express.json());
app.use(cors({ origin: process.env.ALLOWED_ORIGIN || '*' }));
app.use(requestIp.mw());

// Rate Limiter
app.use('/api/', rateLimit({ windowMs: 60 * 1000, max: 120 }));

// Telemetry
const collectDefaultMetrics = client.collectDefaultMetrics;
collectDefaultMetrics();

const httpRequestsTotal = new client.Counter({
  name: 'whoami_http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'path', 'status']
});

const httpRequestDurationSeconds = new client.Histogram({
  name: 'whoami_http_request_duration_seconds',
  help: 'HTTP request duration in seconds',
  labelNames: ['method', 'path', 'status'],
  buckets: [0.01, 0.05, 0.1, 0.3, 0.5, 1, 2, 5]
});

app.use((req: Request, res: Response, next: NextFunction) => {
  const end = httpRequestDurationSeconds.startTimer({ method: req.method, path: req.path });
  res.on('finish', () => {
    httpRequestsTotal.inc({ method: req.method, path: req.path, status: String(res.statusCode) });
    end({ status: String(res.statusCode) });
    logger.info({ method: req.method, path: req.path, status: res.statusCode }, 'request');
  });
  next();
});

// Cache map
const geoCache = new Map<string, any>();
const GEO_TTL_MS = Number(process.env.GEO_CACHE_TTL_MS || 5 * 60 * 1000);

// Simple fallback storage
const VISITS_FILE = path.join(__dirname, 'visits.json');
const fsPromises = fs.promises;

async function readVisits(): Promise<{ total: number; byIp: Record<string, number> }> {
  try {
    const raw = await fsPromises.readFile(VISITS_FILE, 'utf8');
    return JSON.parse(raw);
  } catch (e) {
    return { total: 0, byIp: {} };
  }
}

async function writeVisits(data: { total: number; byIp: Record<string, number> }) {
  try {
    await fsPromises.writeFile(VISITS_FILE, JSON.stringify(data, null, 2));
  } catch (e) {
    logger.error({ err: e }, 'Failed to write visits file');
  }
}

// Ensure visits file exists
if (!fs.existsSync(VISITS_FILE)) {
  fs.writeFileSync(VISITS_FILE, JSON.stringify({ total: 0, byIp: {} }, null, 2));
}

// Redis setup
let redis: Redis | null = null;
let redisReady = false;
if (process.env.REDIS_URL) {
  redis = new Redis(process.env.REDIS_URL, {
    retryStrategy: (times) => Math.min(50 * times, 2000),
    maxRetriesPerRequest: null,
    enableReadyCheck: true,
  });
  redis.on('ready', () => { redisReady = true; logger.info('Redis ready'); });
  redis.on('error', (err) => { redisReady = false; logger.warn({ err }, 'Redis error'); });
  redis.on('end', () => { redisReady = false; logger.info('Redis connection closed'); });
}

async function incrementVisitsRedis(ip: string) {
  if (!redis) throw new Error('Redis not initialized');
  await redis.incr('visits:total');
  await redis.hincrby('visits:byIp', ip, 1);
  const [total, unique, yourVisits] = await Promise.all([
    redis.get('visits:total'),
    redis.hlen('visits:byIp'),
    redis.hget('visits:byIp', ip)
  ]);
  return { total: Number(total || 0), unique: Number(unique || 0), yourVisits: Number(yourVisits || 0) };
}

async function incrementVisitsFile(ip: string) {
  const visits = await readVisits();
  visits.total = (visits.total || 0) + 1;
  visits.byIp = visits.byIp || {};
  visits.byIp[ip] = (visits.byIp[ip] || 0) + 1;
  await writeVisits(visits);
  return { total: visits.total, unique: Object.keys(visits.byIp).length, yourVisits: visits.byIp[ip] || 0 };
}

async function incrementVisits(ip: string) {
  if (redis && redisReady) {
    try {
      return await incrementVisitsRedis(ip);
    } catch (e) {
      logger.warn({ err: e }, 'Redis increment failed, falling back to file');
      return incrementVisitsFile(ip);
    }
  }
  return incrementVisitsFile(ip);
}

// Routes
app.get('/api/whoami', async (req: Request, res: Response) => {
  const ipRaw = req.ip || (req as any).clientIp || '';
  let ip = ipRaw.replace(/^::ffff:/, '').replace(/^\[::1\]$|^::1$/, '127.0.0.1');
  if (ip === '::1' || ip === '0:0:0:0:0:0:0:1') ip = '127.0.0.1';

  const ua = req.headers['user-agent'] || '';
  const parsed = new UAParser(ua).getResult();
  const browser = parsed.browser && parsed.browser.name ? `${parsed.browser.name} ${parsed.browser.version || ''}`.trim() : 'Unknown';
  const os = parsed.os && parsed.os.name ? `${parsed.os.name} ${parsed.os.version || ''}`.trim() : 'Unknown';
  const device = parsed.device && parsed.device.type ? parsed.device.type : 'desktop';

  let location = { city: '', region: '', country: '', latitude: null as number | null, longitude: null as number | null };

  async function fetchWithTimeout(url: string, opts: any = {}, ms = 3000) {
    const ac = new AbortController();
    const id = setTimeout(() => ac.abort(), ms);
    try {
      const r = await fetch(url, { ...opts, signal: ac.signal });
      clearTimeout(id);
      return r;
    } catch (err) {
      clearTimeout(id);
      throw err;
    }
  }

  async function getExternalGeo(ipAddress: string) {
    if (!process.env.GEO_PROVIDER || !process.env.GEO_API_KEY) return null;
    const key = `${process.env.GEO_PROVIDER}:${ipAddress}`;
    const cached = geoCache.get(key);
    if (cached && (Date.now() - cached.ts) < GEO_TTL_MS) return cached.value;

    try {
      if (process.env.GEO_PROVIDER === 'ipapi') {
        const url = `https://ipapi.co/${ipAddress}/json/?key=${process.env.GEO_API_KEY}`;
        const resp = await fetchWithTimeout(url, {}, 3000);
        if (!resp.ok) throw new Error(`geo provider status ${resp.status}`);
        const j = await resp.json() as any;
        const val = {
          city: j.city || '',
          region: j.region || j.region_code || '',
          country: j.country || j.country_name || '',
          latitude: j.latitude || j.lat || null,
          longitude: j.longitude || j.lon || null
        };
        geoCache.set(key, { ts: Date.now(), value: val });
        return val;
      }
    } catch (e) {
      logger.warn({ err: e }, 'External geo lookup failed');
      return null;
    }
    return null;
  }

  try {
    const privateIpRegex = /^(127\.|10\.|192\.168\.|172\.(1[6-9]|2[0-9]|3[0-1])|::1$|::ffff:127\.)/;
    if (!privateIpRegex.test(ip) && process.env.GEO_PROVIDER && process.env.GEO_API_KEY) {
      const ext = await getExternalGeo(ip);
      if (ext) {
        location = { ...location, ...ext };
      }
    }
  } catch (e) {
    logger.warn({ err: e }, 'External geo lookup failed, falling back to geoip-lite');
  }

  if (!location.latitude || !location.longitude) {
    const geo = geoip.lookup(ip) || {};
    location.city = location.city || geo.city || '';
    location.region = location.region || geo.region || '';
    location.country = location.country || geo.country || '';
    location.latitude = location.latitude || (geo.ll ? geo.ll[0] : null);
    location.longitude = location.longitude || (geo.ll ? geo.ll[1] : null);
  }

  try {
    const v = await incrementVisits(ip);
    res.json({ ip, browser, os, device, location, visits: { total: v.total, unique: v.unique, yourVisits: v.yourVisits } });
  } catch (e) {
    logger.error({ err: e }, 'Failed to update visits');
    res.status(500).json({ error: 'Failed to update visits' });
  }
});

app.get('/api/visits', async (req: Request, res: Response) => {
  try {
    if (redis && redisReady) {
      const total = Number(await redis.get('visits:total') || 0);
      const unique = Number(await redis.hlen('visits:byIp') || 0);
      return res.json({ total, unique });
    }
    const visits = await readVisits();
    return res.json({ total: visits.total || 0, unique: Object.keys(visits.byIp || {}).length });
  } catch (e) {
    logger.error({ err: e }, 'Failed to read visits');
    return res.status(500).json({ error: 'Failed to read visits' });
  }
});

app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', uptime: process.uptime(), redis: redisReady });
});

app.get('/ready', (req: Request, res: Response) => {
  if (process.env.REDIS_URL) {
    if (!redisReady) {
      return res.status(503).json({ ready: false, status: 'Redis connection down' });
    }
    return res.json({ ready: true });
  }
  return res.json({ ready: true });
});

app.get('/healthz', (req: Request, res: Response) => res.json({ status: 'ok', uptime: process.uptime(), redis: redisReady }));

app.get('/metrics', async (req: Request, res: Response) => {
  try {
    res.set('Content-Type', client.register.contentType);
    const metrics = await client.register.metrics();
    res.send(metrics);
  } catch (e) {
    logger.error({ err: e }, 'Failed to collect metrics');
    res.status(500).send('metrics error');
  }
});

function startServer(startPort: number, maxAttempts = 10) {
  let attempts = 0;
  function tryListen(port: number) {
    const s = app.listen(port, () => {
      console.log(`Server running on port ${port}`);
      function shutdown() {
        console.log('Shutting down...');
        s.close(() => {
          console.log('Server closed');
          process.exit(0);
        });
        setTimeout(() => process.exit(1), 5000);
      }
      process.on('SIGTERM', shutdown);
      process.on('SIGINT', shutdown);
    });

    s.on('error', (err: any) => {
      if (err.code === 'EADDRINUSE') {
        attempts += 1;
        if (attempts >= maxAttempts) {
          console.error(`Port ${port} in use and max attempts reached. Exiting.`);
          process.exit(1);
        }
        console.warn(`Port ${port} in use, trying ${port + 1}...`);
        setTimeout(() => tryListen(port + 1), 200);
      } else {
        console.error('Server error', err);
        process.exit(1);
      }
    });
  }
  tryListen(startPort);
}

if (require.main === module) {
  startServer(Number(process.env.PORT) || PORT);
}

export default app;
