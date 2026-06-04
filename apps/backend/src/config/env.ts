import dotenv from 'dotenv';
dotenv.config();

export const ENV = {
  PORT: Number(process.env.PORT) || 3000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  DATABASE_URL: process.env.DATABASE_URL,
  REDIS_URL: process.env.REDIS_URL,
  GEO_PROVIDER: process.env.GEO_PROVIDER || null,
  GEO_API_KEY: process.env.GEO_API_KEY || null,
  GEO_CACHE_TTL_MS: Number(process.env.GEO_CACHE_TTL_MS || 5 * 60 * 1000),
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
  TRUST_PROXY: process.env.TRUST_PROXY,
  ALLOWED_ORIGIN: process.env.ALLOWED_ORIGIN || '*',
  DNS_PORT: Number(process.env.DNS_PORT) || 1053,
  DNS_DOMAIN: process.env.DNS_DOMAIN || 'dns.localhost'
};
