// Load local env when present (dev only). This is safe because .env is in .gitignore.
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const requestIp = require('request-ip');
const UAParser = require('ua-parser-js');
const geoip = require('geoip-lite');
const fs = require('fs');
const path = require('path');

const Redis = require('ioredis');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const pino = require('pino');

const logger = pino({ level: process.env.LOG_LEVEL || 'info' });

const app = express();
const PORT = process.env.PORT || 3000;

// Basic middleware and security
// Respect TRUST_PROXY env var; default false to avoid permissive trust in dev/test
app.set('trust proxy', process.env.TRUST_PROXY === 'true');
app.use(helmet());
app.use(express.json());
app.use(cors({ origin: process.env.ALLOWED_ORIGIN || '*' }));
app.use(requestIp.mw());

// Rate limiter for API
app.use('/api/', rateLimit({ windowMs: 60 * 1000, max: 120 }));

// Prometheus metrics
const client = require('prom-client');
const collectDefaultMetrics = client.collectDefaultMetrics;
collectDefaultMetrics({ timeout: 5000 });

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

// Metrics middleware: increment counters and observe duration
app.use((req, res, next) => {
  const end = httpRequestDurationSeconds.startTimer({ method: req.method, path: req.path });
  res.on('finish', () => {
    httpRequestsTotal.inc({ method: req.method, path: req.path, status: String(res.statusCode) });
    end({ status: String(res.statusCode) });
    logger.info({ method: req.method, path: req.path, status: res.statusCode }, 'request');
  });
  next();
});

// Serve static frontend if present in ./public
const publicDir = path.join(__dirname, 'public');
if (fs.existsSync(publicDir)) {
  app.use(express.static(publicDir));
}

// Simple file-based persistence for visitor counts (fallback)
const VISITS_FILE = path.join(__dirname, 'visits.json');
function readVisits() {
  try {
    const raw = fs.readFileSync(VISITS_FILE, 'utf8');
    return JSON.parse(raw);
  } catch (e) {
    return { total: 0, byIp: {} };
  }
}

function writeVisits(data) {
  try {
    fs.writeFileSync(VISITS_FILE, JSON.stringify(data, null, 2));
  } catch (e) {
    logger.error({ err: e }, 'Failed to write visits file');
  }
}

// Ensure visits file exists
if (!fs.existsSync(VISITS_FILE)) {
  writeVisits({ total: 0, byIp: {} });
}

// Redis client (optional). If REDIS_URL is not provided, we fall back to file storage.
let redis;
let redisReady = false;
if (process.env.REDIS_URL) {
  // Configure ioredis with sensible reconnection policy
  redis = new Redis(process.env.REDIS_URL, {
    // reconnect delay: linear backoff up to 2s
    retryStrategy: (times) => Math.min(50 * times, 2000),
    // do not fail commands when connection is down; let us handle fallback
    maxRetriesPerRequest: null,
    enableReadyCheck: true,
  });
  redis.on('ready', () => { redisReady = true; logger.info('Redis ready'); });
  redis.on('error', (err) => { redisReady = false; logger.warn({ err }, 'Redis error'); });
  redis.on('end', () => { redisReady = false; logger.info('Redis connection closed'); });
}

async function incrementVisitsRedis(ip) {
  // Atomic increments in Redis
  await redis.incr('visits:total');
  await redis.hincrby('visits:byIp', ip, 1);
  const [total, unique, yourVisits] = await Promise.all([
    redis.get('visits:total'),
    redis.hlen('visits:byIp'),
    redis.hget('visits:byIp', ip)
  ]);
  return { total: Number(total || 0), unique: Number(unique || 0), yourVisits: Number(yourVisits || 0) };
}

async function incrementVisitsFile(ip) {
  const visits = readVisits();
  visits.total = (visits.total || 0) + 1;
  visits.byIp = visits.byIp || {};
  visits.byIp[ip] = (visits.byIp[ip] || 0) + 1;
  writeVisits(visits);
  return { total: visits.total, unique: Object.keys(visits.byIp).length, yourVisits: visits.byIp[ip] || 0 };
}

async function incrementVisits(ip) {
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

app.get('/api/whoami', async (req, res) => {
  // Get IP. Prefer X-Forwarded-For first (may contain comma list), then request-ip helpers.
  const rawForward = req.headers['x-forwarded-for'];
  let ipRaw = '';
  if (rawForward) ipRaw = String(rawForward).split(',')[0].trim();
  else ipRaw = (req.clientIp || requestIp.getClientIp(req) || req.connection?.remoteAddress || req.socket?.remoteAddress || req.ip || '') + '';
  // Normalize IPv4-mapped IPv6 and loopback
  let ip = ipRaw.replace(/^::ffff:/, '').replace(/^\[::1\]$|^::1$/, '127.0.0.1');

  // If ip is still an IPv6 loopback representation, normalize to 127.0.0.1 for easier handling
  if (ip === '::1' || ip === '0:0:0:0:0:0:0:1') ip = '127.0.0.1';

  // Get user agent info with ua-parser-js (more robust across modern browsers)
  const ua = req.headers['user-agent'] || '';
  const parsed = new UAParser(ua).getResult();
  const browser = parsed.browser && parsed.browser.name ? `${parsed.browser.name} ${parsed.browser.version || ''}`.trim() : 'Unknown';
  const os = parsed.os && parsed.os.name ? `${parsed.os.name} ${parsed.os.version || ''}`.trim() : 'Unknown';
  // device.type can be 'mobile','tablet','console','smarttv','wearable' or undefined for desktop
  const device = parsed.device && parsed.device.type ? parsed.device.type : 'desktop';

  // Get location (may be empty for private IPs). Use optional external provider when configured.
  let location = { city: '', region: '', country: '', latitude: null, longitude: null };

  // Simple cached external geo client with timeout and TTL (5 minutes)
  const geoCache = global.__whoami_geo_cache || (global.__whoami_geo_cache = new Map());
  const GEO_TTL_MS = Number(process.env.GEO_CACHE_TTL_MS || 5 * 60 * 1000);

  async function fetchWithTimeout(url, opts = {}, ms = 3000) {
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

  async function getExternalGeo(ip) {
    if (!process.env.GEO_PROVIDER || !process.env.GEO_API_KEY) return null;
    const key = `${process.env.GEO_PROVIDER}:${ip}`;
    const cached = geoCache.get(key);
    if (cached && (Date.now() - cached.ts) < GEO_TTL_MS) return cached.value;

    try {
      if (process.env.GEO_PROVIDER === 'ipapi') {
        const url = `https://ipapi.co/${ip}/json/?key=${process.env.GEO_API_KEY}`;
        const resp = await fetchWithTimeout(url, {}, 3000);
        if (!resp.ok) throw new Error(`geo provider status ${resp.status}`);
        const j = await resp.json();
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
    // Do not call external geo providers for localhost or private IPs
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

  // Fallback to geoip-lite (best-effort). geoip-lite returns empty for private/localhost IPs.
  if (!location.latitude || !location.longitude) {
    const geo = geoip.lookup(ip) || {};
    location.city = location.city || geo.city || '';
    location.region = location.region || geo.region || '';
    location.country = location.country || geo.country || '';
    location.latitude = location.latitude || (geo.ll ? geo.ll[0] : null);
    location.longitude = location.longitude || (geo.ll ? geo.ll[1] : null);
  }

  // Update visits (Redis if available, otherwise file)
  try {
    const v = await incrementVisits(ip);
    res.json({ ip, browser, os, device, location, visits: { total: v.total, unique: v.unique, yourVisits: v.yourVisits } });
  } catch (e) {
    logger.error({ err: e }, 'Failed to update visits');
    res.status(500).json({ error: 'Failed to update visits' });
  }
});

app.get('/api/visits', async (req, res) => {
  try {
    if (redis && redisReady) {
      const total = Number(await redis.get('visits:total') || 0);
      const unique = Number(await redis.hlen('visits:byIp') || 0);
      return res.json({ total, unique });
    }
    const visits = readVisits();
    return res.json({ total: visits.total || 0, unique: Object.keys(visits.byIp || {}).length });
  } catch (e) {
    logger.error({ err: e }, 'Failed to read visits');
    return res.status(500).json({ error: 'Failed to read visits' });
  }
});

app.get('/', (req, res) => {
  // If frontend is built into public, serve it
  const indexPath = path.join(publicDir, 'index.html');
  if (fs.existsSync(indexPath)) return res.sendFile(indexPath);
  return res.send('Who Am I API is running.');
});
// Health endpoint for orchestrators
app.get('/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime(), redis: redisReady });
});

// Readiness: checks Redis if configured
app.get('/ready', (req, res) => {
  if (process.env.REDIS_URL) {
    return res.json({ ready: redisReady });
  }
  return res.json({ ready: true });
});

// Additional endpoints required by many platforms and observability tools
// /healthz is a commonly used liveness probe path — alias to /health
app.get('/healthz', (req, res) => res.json({ status: 'ok', uptime: process.uptime(), redis: redisReady }));

// Simple metrics endpoint for basic monitoring (JSON). Replace with Prometheus exporter for production.
app.get('/metrics', async (req, res) => {
  try {
    res.set('Content-Type', client.register.contentType);
    const metrics = await client.register.metrics();
    res.send(metrics);
  } catch (e) {
    logger.error({ err: e }, 'Failed to collect metrics');
    res.status(500).send('metrics error');
  }
});

// Start server with retry on EADDRINUSE
function startServer(startPort, maxAttempts = 10) {
  let attempts = 0;
  function tryListen(port) {
    const s = app.listen(port, () => {
      console.log(`Server running on port ${port}`);
      // attach shutdown handlers to this server instance
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

    s.on('error', (err) => {
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

// Only start server when run directly. This allows importing `app` in tests without listening.
if (require.main === module) {
  startServer(Number(process.env.PORT) || PORT);
}

// Export app for testing and for other modules
module.exports = app;
