import fs from 'fs';
import path from 'path';
import net from 'net';

const DATA_DIR = path.join(__dirname, '../src/data');
const OUT_FILE = path.join(DATA_DIR, 'tor-exit-nodes.json');

const DEFAULT_TOR_NODES = [
  '185.220.101.5', '185.220.101.6', '185.220.101.7', '185.220.101.8',
  '109.70.100.201', '192.42.116.16', '162.247.74.201', '104.244.76.13'
];

/**
 * Normalizes IPv6 addresses to standard lowercase, compressed RFC 5952 representation.
 * Leaves IPv4 addresses unchanged.
 */
function normalizeIp(ip: string): string {
  let clean = ip.trim().toLowerCase();
  
  // Strip brackets if present
  if (clean.startsWith('[') && clean.endsWith(']')) {
    clean = clean.slice(1, -1);
  }
  
  // Strip IPv4-mapped IPv6 prefix
  if (clean.startsWith('::ffff:')) {
    return clean.substring(7);
  }

  // If not IPv6, return cleaned IP
  if (!clean.includes(':')) {
    return clean;
  }

  const parts = clean.split('::');
  if (parts.length > 2) return clean; // Invalid IPv6 format, return as is for validation stage to catch

  const left = parts[0] ? parts[0].split(':') : [];
  const right = parts[1] ? parts[1].split(':') : [];

  const leftSegs = left.filter(s => s.length > 0);
  const rightSegs = right.filter(s => s.length > 0);

  const middleLen = 8 - (leftSegs.length + rightSegs.length);
  if (middleLen < 0 || middleLen > 8) return clean; // Invalid IPv6 segments

  const middle = Array(middleLen).fill('0');
  const segments = [...leftSegs, ...middle, ...rightSegs].map(s => {
    const val = parseInt(s, 16);
    if (isNaN(val)) return '0';
    return val.toString(16);
  });

  // Find the longest sequence of consecutive zeros (minimum 2 segments)
  let maxZeroStart = -1;
  let maxZeroLen = 0;
  let currentZeroStart = -1;
  let currentZeroLen = 0;

  for (let i = 0; i < 8; i++) {
    if (segments[i] === '0') {
      if (currentZeroLen === 0) {
        currentZeroStart = i;
      }
      currentZeroLen++;
    } else {
      if (currentZeroLen > maxZeroLen) {
        maxZeroLen = currentZeroLen;
        maxZeroStart = currentZeroStart;
      }
      currentZeroLen = 0;
    }
  }
  if (currentZeroLen > maxZeroLen) {
    maxZeroLen = currentZeroLen;
    maxZeroStart = currentZeroStart;
  }

  if (maxZeroLen >= 2) {
    const prefix = segments.slice(0, maxZeroStart).join(':');
    const suffix = segments.slice(maxZeroStart + maxZeroLen).join(':');
    return `${prefix}::${suffix}`;
  }

  return segments.join(':');
}

/**
 * Checks if an IP is a local loopback, private range, or banned public resolver DNS IP.
 */
function isBannedOrPrivate(ip: string): boolean {
  const banned = ['8.8.8.8', '8.8.4.4', '1.1.1.1', '1.0.0.1', '9.9.9.9', '127.0.0.1', '::1'];
  if (banned.includes(ip)) return true;

  if (ip.includes('.')) {
    // IPv4 private ranges check
    const parts = ip.split('.').map(Number);
    if (parts[0] === 10) return true;
    if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true;
    if (parts[0] === 192 && parts[1] === 168) return true;
    if (parts[0] === 169 && parts[1] === 254) return true;
  } else if (ip.includes(':')) {
    // IPv6 private ranges check
    const clean = ip.toLowerCase();
    if (clean.startsWith('fc00:') || clean.startsWith('fd00:') || clean.startsWith('fe80:')) {
      return true;
    }
  }
  return false;
}

async function fetchWithTimeout(url: string, timeoutMs = 8000): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const r = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36'
      }
    });
    clearTimeout(id);
    return r;
  } catch (err) {
    clearTimeout(id);
    throw err;
  }
}

async function main() {
  const force = process.argv.includes('--force');
  if (fs.existsSync(OUT_FILE) && !force) {
    console.log(`Tor exit nodes database ${path.basename(OUT_FILE)} already exists. Skipping compilation (use --force to overwrite).`);
    process.exit(0);
  }
  console.log('Compiling Tor Exit Nodes Database...');
  
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  const uniqueIps = new Set<string>();

  try {
    console.log('Fetching Tor Exit Addresses Dump from check.torproject.org...');
    const response = await fetchWithTimeout('https://check.torproject.org/exit-addresses', 10000);
    
    if (!response.ok) {
      throw new Error(`Tor Exit Addresses response returned HTTP status ${response.status}`);
    }

    const text = await response.text();
    const lines = text.split('\n');

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('ExitAddress ')) {
        const parts = trimmed.split(/\s+/);
        if (parts.length >= 2) {
          const rawIp = parts[1];
          if (net.isIP(rawIp)) {
            const normalized = normalizeIp(rawIp);
            if (!isBannedOrPrivate(normalized)) {
              uniqueIps.add(normalized);
            }
          }
        }
      }
    }

    const totalNodes = uniqueIps.size;
    console.log(`Successfully parsed ${totalNodes} unique Tor Exit IPs.`);

    // Security check: count must be within reasonable threshold
    if (totalNodes < 500) {
      throw new Error(`Parsed node count of ${totalNodes} is below safety threshold (500). Aborting compilation.`);
    }
    if (totalNodes > 10000) {
      throw new Error(`Parsed node count of ${totalNodes} exceeds safety threshold (10000). Aborting compilation.`);
    }

    const sortedIps = Array.from(uniqueIps).sort();
    fs.writeFileSync(OUT_FILE, JSON.stringify(sortedIps, null, 2));
    console.log(`Saved compiled Tor Exit Nodes to ${OUT_FILE}`);

  } catch (e: any) {
    console.warn('Could not compile Tor Exit Nodes from live feed. Error:', e.message);
    
    if (fs.existsSync(OUT_FILE)) {
      console.log('Pre-existing tor-exit-nodes.json file found. Proceeding with existing compiled cache.');
    } else {
      console.log('No pre-existing file found. Initializing bootstrap fallback list.');
      const normalizedBootstrap = DEFAULT_TOR_NODES.map(normalizeIp);
      fs.writeFileSync(OUT_FILE, JSON.stringify(normalizedBootstrap, null, 2));
      console.log(`Successfully bootstrapped ${OUT_FILE} with initial Tor fallback list.`);
    }
  }
}

main().catch(err => {
  console.error('Fatal compile-tor error:', err);
  process.exit(1);
});
