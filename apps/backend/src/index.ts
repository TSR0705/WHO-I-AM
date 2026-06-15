import { ENV } from './config/env';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import requestIp from 'request-ip';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import pino from 'pino';
import * as client from 'prom-client';

// Services
import { initDatabase } from './services/db';
import { visitsService } from './services/visits';
import { startDnsServer, stopDnsServer } from './services/dns';

// Routers
import whoamiRouter from './routes/whoami';
import visitsRouter from './routes/visits';
import fingerprintRouter from './routes/fingerprint';
import dnsLeakRouter from './routes/dns-leak';

const logger = pino({ level: ENV.LOG_LEVEL });
const app = express();

// Trust Proxy Configuration
const trustProxyEnv = ENV.TRUST_PROXY;
let trustProxy: string | number | boolean;
if (typeof trustProxyEnv !== 'undefined') {
  if (/^\d+$/.test(trustProxyEnv)) {
    trustProxy = Number(trustProxyEnv);
  } else {
    trustProxy = trustProxyEnv === 'true';
  }
} else {
  trustProxy = (ENV.NODE_ENV === 'production') ? 1 : false;
}
app.set('trust proxy', trustProxy);

// Security Headers (Helmet Content Security Policy)
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", 'https://unpkg.com', 'https://cdn.jsdelivr.net'],
      styleSrc: ["'self'", 'https://unpkg.com', 'https://cdn.jsdelivr.net'],
      imgSrc: ["'self'", 'data:', 'https://{s}.tile.openstreetmap.org', 'https://*.tile.openstreetmap.org', 'https://tile.openstreetmap.org'],
      connectSrc: ["'self'", 'https://ipapi.co', 'https://api.ipify.org', 'https://api64.ipify.org', 'https://*.tile.openstreetmap.org'],
      fontSrc: ["'self'", 'https://unpkg.com', 'https://cdn.jsdelivr.net'],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
    }
  }
}));

app.use(express.json());
app.use(cors({ origin: ENV.ALLOWED_ORIGIN }));
app.use(requestIp.mw());

// Vercel path rewrites not needed since routePrefix is /api

// Rate Limiting middleware for API endpoints
app.use('/api/', rateLimit({ windowMs: 60 * 1000, max: 120 }));

// Prometheus Telemetry Metrics
client.collectDefaultMetrics();

const httpRequestsTotal = new client.Counter({
  name: 'exposur_http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'path', 'status']
});

const httpRequestDurationSeconds = new client.Histogram({
  name: 'exposur_http_request_duration_seconds',
  help: 'HTTP request duration in seconds',
  labelNames: ['method', 'path', 'status'],
  buckets: [0.01, 0.05, 0.1, 0.3, 0.5, 1, 2, 5]
});

// Telemetry Request Interceptor
app.use((req: Request, res: Response, next: NextFunction) => {
  const end = httpRequestDurationSeconds.startTimer({ method: req.method, path: req.path });
  res.on('finish', () => {
    httpRequestsTotal.inc({ method: req.method, path: req.path, status: String(res.statusCode) });
    end({ status: String(res.statusCode) });
    logger.info({ method: req.method, path: req.path, status: res.statusCode }, 'request');
  });
  next();
});

// Middleware to ensure DB is initialized before processing any requests (avoids serverless race conditions)
app.use(async (req: Request, res: Response, next: NextFunction) => {
  if (ENV.DATABASE_URL) {
    try {
      await initDatabase();
    } catch (err) {
      logger.error({ err }, 'DB initialization middleware failed');
    }
  }
  next();
});

// Register Decoupled API Routers
app.use('/api', whoamiRouter);
app.use('/api', visitsRouter);
app.use('/api', fingerprintRouter);
app.use('/api', dnsLeakRouter);

// Health probe endpoints
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', uptime: process.uptime(), redis: visitsService.redisReady });
});

app.get('/ready', (req: Request, res: Response) => {
  if (ENV.REDIS_URL) {
    if (!visitsService.redisReady) {
      return res.status(503).json({ ready: false, status: 'Redis connection down' });
    }
    return res.json({ ready: true });
  }
  return res.json({ ready: true });
});

app.get('/healthz', (req: Request, res: Response) => {
  res.json({ status: 'ok', uptime: process.uptime(), redis: visitsService.redisReady });
});

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

// Boot and Lifecycle Management
function startServer(startPort: number, maxAttempts = 10) {
  let attempts = 0;
  function tryListen(port: number) {
    const s = app.listen(port, () => {
      console.log(`Server running on port ${port}`);
      function shutdown() {
        console.log('Shutting down...');
        stopDnsServer();
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

// Trigger database initialization asynchronously on startup
initDatabase().catch(err => {
  logger.error({ err }, 'Failed to initialize database on startup');
});

if (require.main === module) {
  // Only start DNS server in non-serverless environments
  if (!process.env.VERCEL) {
    startDnsServer(visitsService.redis);
  }
  startServer(ENV.PORT);
}

export default app;
