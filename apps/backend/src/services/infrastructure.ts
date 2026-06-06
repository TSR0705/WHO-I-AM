import fs from 'fs';
import path from 'path';

let providers: string[] = [];
let ipv4Ranges: [number, number, number][] = [];
let ipv6Ranges: [bigint, bigint, number][] = [];
let loaded = false;

function findJsonPath(): string {
  const candidates = [
    // 1. Process relative (local dev running from apps/backend, or Vercel execution root)
    path.join(process.cwd(), 'src/data/infra-ranges.json'),
    path.join(process.cwd(), 'dist/data/infra-ranges.json'),
    
    // 2. Monorepo root relative (dev/local running from monorepo root)
    path.join(process.cwd(), 'apps/backend/src/data/infra-ranges.json'),
    path.join(process.cwd(), 'apps/backend/dist/data/infra-ranges.json'),
    
    // 3. Module relative (compiled JS in dist/services/ looking at dist/data/)
    path.join(__dirname, '../data/infra-ranges.json'),
    // Module relative (compiled JS in dist/services/ looking at src/data/)
    path.join(__dirname, '../../src/data/infra-ranges.json'),
    
    // 4. Module relative (source TS in src/services/ looking at src/data/)
    path.join(__dirname, '../data/infra-ranges.json')
  ];

  for (const p of candidates) {
    if (fs.existsSync(p)) {
      return p;
    }
  }

  // Fallback default
  return path.join(__dirname, '../data/infra-ranges.json');
}

function loadDatabase() {
  if (loaded) return;
  try {
    const jsonPath = findJsonPath();
    if (!fs.existsSync(jsonPath)) {
      console.warn(`Infrastructure Lookup: Database not found at ${jsonPath}. Using empty default.`);
      providers = ['Amazon Web Services', 'Google Cloud', 'Cloudflare'];
      loaded = true;
      return;
    }

    const raw = fs.readFileSync(jsonPath, 'utf-8');
    const data = JSON.parse(raw);
    providers = data.providers || [];
    ipv4Ranges = data.ipv4 || [];
    ipv6Ranges = (data.ipv6 || []).map((r: any) => [BigInt(r[0]), BigInt(r[1]), r[2]]);
    loaded = true;
    console.log(`Infrastructure Lookup: Loaded ${ipv4Ranges.length} IPv4 and ${ipv6Ranges.length} IPv6 ranges.`);
  } catch (err) {
    console.error('Infrastructure Lookup: Failed to load database:', err);
    providers = ['Amazon Web Services', 'Google Cloud', 'Cloudflare'];
    loaded = true;
  }
}

function ip4ToInt(ip: string): number {
  return ip.split('.').reduce((acc, octet) => (acc << 8) + parseInt(octet, 10), 0) >>> 0;
}

function ip6ToBigInt(ip: string): bigint {
  if (ip.startsWith('::ffff:')) {
    const ipv4 = ip.substring(7);
    return BigInt(ip4ToInt(ipv4));
  }
  const parts = ip.split('::');
  let left = parts[0] ? parts[0].split(':').filter(Boolean) : [];
  let right = parts[1] ? parts[1].split(':').filter(Boolean) : [];
  
  const middleLen = 8 - (left.length + right.length);
  const middle = Array(middleLen).fill('0');
  const full = [...left, ...middle, ...right];
  
  let res = 0n;
  for (const seg of full) {
    const val = parseInt(seg || '0', 16);
    res = (res << 16n) + BigInt(val);
  }
  return res;
}

export class InfrastructureLookupService {
  public static lookup(ipAddress: string): string | null {
    if (!ipAddress) return null;
    loadDatabase();

    const cleanIp = ipAddress.trim().replace(/^::ffff:/, '');

    // IPv4 binary search
    if (!cleanIp.includes(':')) {
      try {
        const ipInt = ip4ToInt(cleanIp);
        let low = 0;
        let high = ipv4Ranges.length - 1;
        
        while (low <= high) {
          const mid = Math.floor((low + high) / 2);
          const [start, end, providerId] = ipv4Ranges[mid];
          if (ipInt >= start && ipInt <= end) {
            return providers[providerId] || null;
          } else if (ipInt < start) {
            high = mid - 1;
          } else {
            low = mid + 1;
          }
        }
      } catch (err) {
        // ignore
      }
      return null;
    }

    // IPv6 binary search
    try {
      const ipBig = ip6ToBigInt(cleanIp);
      let low = 0;
      let high = ipv6Ranges.length - 1;
      
      while (low <= high) {
        const mid = Math.floor((low + high) / 2);
        const [start, end, providerId] = ipv6Ranges[mid];
        if (ipBig >= start && ipBig <= end) {
          return providers[providerId] || null;
        } else if (ipBig < start) {
          high = mid - 1;
        } else {
          low = mid + 1;
        }
      }
    } catch (err) {
      // ignore
    }

    return null;
  }
}
