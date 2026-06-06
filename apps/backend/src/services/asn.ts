import maxmind, { Reader } from 'maxmind';
import path from 'path';
import fs from 'fs';
import zlib from 'zlib';

let reader: Reader<any> | null = null;

function findDbPath(): string {
  const candidates = [
    // 1. Process relative (local dev running from apps/backend, or Vercel execution root)
    path.join(process.cwd(), 'src/data/GeoLite2-ASN.mmdb.br'),
    path.join(process.cwd(), 'dist/data/GeoLite2-ASN.mmdb.br'),
    
    // 2. Monorepo root relative (dev/local running from monorepo root)
    path.join(process.cwd(), 'apps/backend/src/data/GeoLite2-ASN.mmdb.br'),
    path.join(process.cwd(), 'apps/backend/dist/data/GeoLite2-ASN.mmdb.br'),
    
    // 3. Module relative (compiled JS in dist/services/asn.js looking at dist/data/)
    path.join(__dirname, '../data/GeoLite2-ASN.mmdb.br'),
    // Module relative (compiled JS in dist/services/asn.js looking at src/data/)
    path.join(__dirname, '../../src/data/GeoLite2-ASN.mmdb.br'),
    
    // 4. Module relative (source TS in src/services/asn.ts looking at src/data/)
    path.join(__dirname, '../data/GeoLite2-ASN.mmdb.br')
  ];

  for (const p of candidates) {
    if (fs.existsSync(p)) {
      return p;
    }
  }

  // Fallback default
  return path.join(__dirname, '../data/GeoLite2-ASN.mmdb.br');
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

export class AsnLookupService {
  private static async getReader(): Promise<Reader<any>> {
    if (!reader) {
      const dbPath = findDbPath();
      const compressed = fs.readFileSync(dbPath);
      const decompressed = zlib.brotliDecompressSync(compressed);
      reader = new Reader<any>(decompressed);
    }
    return reader!;
  }

  public static async lookup(ipAddress: string): Promise<{ asn: string; organization: string }> {
    if (!ipAddress) {
      return { asn: 'Unknown', organization: 'Unknown ISP / Network' };
    }

    const cleanIp = ipAddress.trim().replace(/^::ffff:/, '');

    if (isLoopback(cleanIp)) {
      return { asn: 'AS0', organization: 'Local Loopback' };
    }

    if (isPrivate(cleanIp)) {
      return { asn: 'AS0', organization: 'Private Network' };
    }

    try {
      const db = await this.getReader();
      const lookupResult = db.get(cleanIp);
      if (lookupResult) {
        return {
          asn: lookupResult.autonomous_system_number ? `AS${lookupResult.autonomous_system_number}` : 'Unknown',
          organization: lookupResult.autonomous_system_organization || 'Unknown ISP / Network'
        };
      }
    } catch (err) {
      console.warn(`GeoLite2 ASN Lookup failed for IP ${cleanIp}:`, err);
    }

    return { asn: 'Unknown', organization: 'Unknown ISP / Network' };
  }
}
