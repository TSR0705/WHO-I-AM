import { Pool } from 'pg';
import { ENV } from '../config/env';
import pino from 'pino';

const logger = pino({ level: ENV.LOG_LEVEL });

export const pool = new Pool({
  connectionString: ENV.DATABASE_URL,
  connectionTimeoutMillis: 3000,
  idleTimeoutMillis: 10000,
});

export let dbInitPromise: Promise<void> | null = null;

export function initDatabase(): Promise<void> {
  if (!ENV.DATABASE_URL) {
    logger.info('No DATABASE_URL provided, skipping Postgres initialization');
    return Promise.resolve();
  }

  if (!dbInitPromise) {
    dbInitPromise = (async () => {
      try {
        logger.info('Initializing Postgres database schema (idempotent checks)...');
        await pool.query(`
          CREATE TABLE IF NOT EXISTS fingerprints (
            id SERIAL PRIMARY KEY,
            canvas_hash VARCHAR(64) NOT NULL,
            audio_hash VARCHAR(64) NOT NULL,
            browser VARCHAR(255) NOT NULL,
            os VARCHAR(255) NOT NULL,
            device VARCHAR(100) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );
        `);
        
        await pool.query(`
          CREATE INDEX IF NOT EXISTS idx_canvas_hash ON fingerprints(canvas_hash);
        `);
        
        await pool.query(`
          CREATE INDEX IF NOT EXISTS idx_audio_hash ON fingerprints(audio_hash);
        `);
        
        logger.info('Postgres database schema initialized successfully');
      } catch (err) {
        logger.error({ err }, 'Failed to initialize Postgres database');
        dbInitPromise = null; // Reset promise so subsequent requests can retry
        throw err;
      }
    })();
  }

  return dbInitPromise;
}
