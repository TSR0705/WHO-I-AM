import maxmind, { Reader } from 'maxmind';
import path from 'path';
import fs from 'fs';
import pino from 'pino';
import zlib from 'zlib';
import { ENV } from '../config/env';

const logger = pino({ level: ENV.LOG_LEVEL });
let reader: Reader<any> | null = null;

function findDbPath(): string {
  const candidates = [
    // 1. Process relative (local dev running from apps/backend, or Vercel execution root)
    path.join(process.cwd(), 'src/data/GeoLite2-City.mmdb.br'),
    path.join(process.cwd(), 'dist/data/GeoLite2-City.mmdb.br'),
    
    // 2. Monorepo root relative (dev/local running from monorepo root)
    path.join(process.cwd(), 'apps/backend/src/data/GeoLite2-City.mmdb.br'),
    path.join(process.cwd(), 'apps/backend/dist/data/GeoLite2-City.mmdb.br'),
    
    // 3. Module relative (compiled JS in dist/services/geo.js looking at dist/data/)
    path.join(__dirname, '../data/GeoLite2-City.mmdb.br'),
    // Module relative (compiled JS in dist/services/geo.js looking at src/data/)
    path.join(__dirname, '../../src/data/GeoLite2-City.mmdb.br'),
    
    // 4. Module relative (source TS in src/services/geo.ts looking at src/data/)
    path.join(__dirname, '../data/GeoLite2-City.mmdb.br')
  ];

  for (const p of candidates) {
    if (fs.existsSync(p)) {
      return p;
    }
  }

  // Fallback default
  return path.join(__dirname, '../data/GeoLite2-City.mmdb.br');
}

function isLoopback(ip: string): boolean {
  if (ip.startsWith('127.')) return true;
  if (ip === '::1' || ip === '0:0:0:0:0:0:0:1' || ip === '::ffff:127.0.0.1') return true;
  return false;
}

function isPrivate(ip: string): boolean {
  if (ip.startsWith('10.')) return true;
  if (ip.startsWith('192.168.')) return true;
  if (ip.startsWith('169.254.')) return true;
  if (ip.startsWith('172.')) {
    const parts = ip.split('.');
    if (parts.length >= 2) {
      const secondOctet = parseInt(parts[1], 10);
      if (secondOctet >= 16 && secondOctet <= 31) {
        return true;
      }
    }
  }
  const normalized = ip.toLowerCase();
  if (normalized.startsWith('fc') || normalized.startsWith('fd')) return true;
  if (normalized.startsWith('fe8') || normalized.startsWith('fe9') || normalized.startsWith('fea') || normalized.startsWith('feb')) return true;
  return false;
}

async function getReader(): Promise<Reader<any>> {
  if (!reader) {
    const dbPath = findDbPath();
    const compressed = fs.readFileSync(dbPath);
    const decompressed = zlib.brotliDecompressSync(compressed);
    reader = new Reader<any>(decompressed);
  }
  return reader!;
}

export function reloadGeoReader(): void {
  reader = null;
}

export interface GeolocationResult {
  city: string;
  region: string;
  country: string;
  latitude: number | null;
  longitude: number | null;
  timezone: string;
}

export async function resolveGeolocation(ipAddress: string): Promise<GeolocationResult> {
  const location: GeolocationResult = {
    city: '',
    region: '',
    country: '',
    latitude: null,
    longitude: null,
    timezone: 'UTC'
  };

  if (!ipAddress) {
    return location;
  }

  const cleanIp = ipAddress.trim().replace(/^::ffff:/, '');

  if (isLoopback(cleanIp) || isPrivate(cleanIp)) {
    return location;
  }

  try {
    const db = await getReader();
    const lookupResult = db.get(cleanIp);
    if (lookupResult) {
      location.city = lookupResult.city?.names?.en || '';
      location.region = lookupResult.subdivisions?.[0]?.names?.en || lookupResult.subdivisions?.[0]?.iso_code || '';
      location.country = lookupResult.country?.iso_code || lookupResult.registered_country?.iso_code || lookupResult.represented_country?.iso_code || '';
      location.latitude = lookupResult.location?.latitude ?? null;
      location.longitude = lookupResult.location?.longitude ?? null;
      location.timezone = lookupResult.location?.time_zone || 'UTC';
    }
  } catch (err) {
    logger.warn({ err, ip: cleanIp }, 'GeoLite2 City lookup failed');
  }

  return location;
}
