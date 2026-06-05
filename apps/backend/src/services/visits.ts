import Redis from 'ioredis';
import fs from 'fs';
import path from 'path';
import pino from 'pino';
import { ENV } from '../config/env';

const logger = pino({ level: ENV.LOG_LEVEL });
const VISITS_FILE = path.join(__dirname, '..', 'visits.json');
const fsPromises = fs.promises;

export class VisitsService {
  public redis: Redis | null = null;
  public redisReady = false;

  constructor() {
    if (ENV.REDIS_URL) {
      try {
        this.redis = new Redis(ENV.REDIS_URL, {
          retryStrategy: (times) => Math.min(50 * times, 2000),
          maxRetriesPerRequest: null,
          enableReadyCheck: true,
        });
        this.redis.on('ready', () => { this.redisReady = true; logger.info('Redis ready'); });
        this.redis.on('error', (err) => { this.redisReady = false; logger.warn({ err }, 'Redis error'); });
        this.redis.on('end', () => { this.redisReady = false; logger.info('Redis connection closed'); });
      } catch (err) {
        logger.error({ err }, 'Failed to initialize Redis client, explicitly falling back to null');
        this.redis = null;
        this.redisReady = false;
      }
    } else {
      logger.info('No REDIS_URL provided. Explicitly falling back to local JSON file db');
      this.redis = null;
      this.redisReady = false;
    }

    // Ensure local file fallback db exists
    if (!fs.existsSync(VISITS_FILE)) {
      try {
        fs.writeFileSync(VISITS_FILE, JSON.stringify({ total: 0, byIp: {} }, null, 2));
      } catch (e) {
        logger.error({ err: e }, 'Failed to initialize visits file');
      }
    }
  }

  private async readVisitsFile(): Promise<{ total: number; byIp: Record<string, number> }> {
    try {
      const raw = await fsPromises.readFile(VISITS_FILE, 'utf8');
      return JSON.parse(raw);
    } catch (e) {
      return { total: 0, byIp: {} };
    }
  }

  private async writeVisitsFile(data: { total: number; byIp: Record<string, number> }) {
    try {
      await fsPromises.writeFile(VISITS_FILE, JSON.stringify(data, null, 2));
    } catch (e) {
      logger.error({ err: e }, 'Failed to write visits file');
    }
  }

  private async incrementRedis(ip: string) {
    if (!this.redis) throw new Error('Redis client unavailable');
    await this.redis.incr('visits:total');
    await this.redis.hincrby('visits:byIp', ip, 1);
    const [total, unique, yourVisits] = await Promise.all([
      this.redis.get('visits:total'),
      this.redis.hlen('visits:byIp'),
      this.redis.hget('visits:byIp', ip)
    ]);
    return { total: Number(total || 0), unique: Number(unique || 0), yourVisits: Number(yourVisits || 0) };
  }

  private async incrementFile(ip: string) {
    const visits = await this.readVisitsFile();
    visits.total = (visits.total || 0) + 1;
    visits.byIp = visits.byIp || {};
    visits.byIp[ip] = (visits.byIp[ip] || 0) + 1;
    await this.writeVisitsFile(visits);
    return { total: visits.total, unique: Object.keys(visits.byIp).length, yourVisits: visits.byIp[ip] || 0 };
  }

  public async increment(ip: string) {
    if (this.redis && this.redisReady) {
      try {
        return await this.incrementRedis(ip);
      } catch (e) {
        logger.warn({ err: e }, 'Redis increment failed, falling back to local file db');
        return this.incrementFile(ip);
      }
    }
    return this.incrementFile(ip);
  }

  public async getCounts() {
    if (this.redis && this.redisReady) {
      const total = Number(await this.redis.get('visits:total') || 0);
      const unique = Number(await this.redis.hlen('visits:byIp') || 0);
      return { total, unique };
    }
    const visits = await this.readVisitsFile();
    return { total: visits.total || 0, unique: Object.keys(visits.byIp || {}).length };
  }
}

export const visitsService = new VisitsService();
