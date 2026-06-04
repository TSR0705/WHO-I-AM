// @ts-ignore
import geoip from 'geoip-lite';
import pino from 'pino';
import { ENV } from '../config/env';

const logger = pino({ level: ENV.LOG_LEVEL });
const geoCache = new Map<string, any>();

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
  if (!ENV.GEO_PROVIDER || !ENV.GEO_API_KEY) return null;
  const key = `${ENV.GEO_PROVIDER}:${ipAddress}`;
  const cached = geoCache.get(key);
  if (cached && (Date.now() - cached.ts) < ENV.GEO_CACHE_TTL_MS) return cached.value;

  try {
    if (ENV.GEO_PROVIDER === 'ipapi') {
      const url = `https://ipapi.co/${ipAddress}/json/?key=${ENV.GEO_API_KEY}`;
      const resp = await fetchWithTimeout(url, {}, 3000);
      if (!resp.ok) throw new Error(`geo provider status ${resp.status}`);
      const j = await resp.json() as any;
      const val = {
        city: j.city || '',
        region: j.region || j.region_code || '',
        country: j.country || j.country_name || '',
        latitude: j.latitude || j.lat || null,
        longitude: j.longitude || j.lon || null,
        timezone: j.timezone || null
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

export interface GeolocationResult {
  city: string;
  region: string;
  country: string;
  latitude: number | null;
  longitude: number | null;
  timezone: string;
}

export async function resolveGeolocation(ipAddress: string): Promise<GeolocationResult> {
  let location = { city: '', region: '', country: '', latitude: null as number | null, longitude: null as number | null, timezone: 'UTC' };

  try {
    const privateIpRegex = /^(127\.|10\.|192\.168\.|172\.(1[6-9]|2[0-9]|3[0-1])|::1$|::ffff:127\.)/;
    if (!privateIpRegex.test(ipAddress) && ENV.GEO_PROVIDER && ENV.GEO_API_KEY) {
      const ext = await getExternalGeo(ipAddress);
      if (ext) {
        location = { ...location, ...ext };
      }
    }
  } catch (e) {
    logger.warn({ err: e }, 'External geo lookup failed, falling back to geoip-lite');
  }

  if (!location.latitude || !location.longitude) {
    const geo = geoip.lookup(ipAddress) || {};
    location.city = location.city || geo.city || '';
    location.region = location.region || geo.region || '';
    location.country = location.country || geo.country || '';
    location.latitude = location.latitude || (geo.ll ? geo.ll[0] : null);
    location.longitude = location.longitude || (geo.ll ? geo.ll[1] : null);
    location.timezone = location.timezone || geo.timezone || 'UTC';
  }

  return location;
}
