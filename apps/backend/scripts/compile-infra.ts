import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(__dirname, '../src/data');
const OUT_FILE = path.join(DATA_DIR, 'infra-ranges.json');

const PROVIDERS = [
  'Amazon Web Services', // ID 0
  'Google Cloud',        // ID 1
  'Cloudflare'          // ID 2
];

interface RangeV4 {
  start: number;
  end: number;
  providerId: number;
}

interface RangeV6 {
  start: bigint;
  end: bigint;
  providerId: number;
}

function ip4ToInt(ip: string): number {
  return ip.split('.').reduce((acc, octet) => (acc << 8) + parseInt(octet, 10), 0) >>> 0;
}

function cidrToRangeV4(cidr: string, providerId: number): RangeV4 {
  const [ip, bitsStr] = cidr.split('/');
  const bits = bitsStr ? parseInt(bitsStr, 10) : 32;
  const ipInt = ip4ToInt(ip);
  const mask = bits === 0 ? 0 : (~(2 ** (32 - bits) - 1)) >>> 0;
  const start = (ipInt & mask) >>> 0;
  const end = (start + (bits === 32 ? 0 : 2 ** (32 - bits) - 1)) >>> 0;
  return { start, end, providerId };
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

function cidrToRangeV6(cidr: string, providerId: number): RangeV6 {
  const [ip, bitsStr] = cidr.split('/');
  const bits = bitsStr ? parseInt(bitsStr, 10) : 128;
  const ipBig = ip6ToBigInt(ip);
  const mask = bits === 0 ? 0n : (~((1n << BigInt(128 - bits)) - 1n)) & ((1n << 128n) - 1n);
  const start = ipBig & mask;
  const end = start + ((1n << BigInt(128 - bits)) - 1n);
  return { start, end, providerId };
}

function mergeRangesV4(ranges: RangeV4[]): RangeV4[] {
  if (ranges.length === 0) return [];
  ranges.sort((a, b) => a.start - b.start);
  const merged: RangeV4[] = [];
  let current = { ...ranges[0] };
  
  for (let i = 1; i < ranges.length; i++) {
    const next = ranges[i];
    if (next.providerId === current.providerId && next.start <= current.end + 1) {
      current.end = Math.max(current.end, next.end);
    } else {
      merged.push(current);
      current = { ...next };
    }
  }
  merged.push(current);
  return merged;
}

function mergeRangesV6(ranges: RangeV6[]): RangeV6[] {
  if (ranges.length === 0) return [];
  ranges.sort((a, b) => (a.start < b.start ? -1 : a.start > b.start ? 1 : 0));
  const merged: RangeV6[] = [];
  let current = { ...ranges[0] };
  
  for (let i = 1; i < ranges.length; i++) {
    const next = ranges[i];
    if (next.providerId === current.providerId && next.start <= current.end + 1n) {
      current.end = next.end > current.end ? next.end : current.end;
    } else {
      merged.push(current);
      current = { ...next };
    }
  }
  merged.push(current);
  return merged;
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
  console.log('Compiling Infrastructure Ranges...');
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  const ipv4Ranges: RangeV4[] = [];
  const ipv6Ranges: RangeV6[] = [];

  // 1. Fetch AWS
  try {
    console.log('Fetching AWS IP Ranges...');
    const r = await fetchWithTimeout('https://ip-ranges.amazonaws.com/ip-ranges.json');
    if (!r.ok) throw new Error(`AWS status ${r.status}`);
    const j = await r.json() as any;
    for (const prefix of j.prefixes || []) {
      if (prefix.ip_prefix) ipv4Ranges.push(cidrToRangeV4(prefix.ip_prefix, 0));
    }
    for (const prefix of j.ipv6_prefixes || []) {
      if (prefix.ipv6_prefix) ipv6Ranges.push(cidrToRangeV6(prefix.ipv6_prefix, 0));
    }
  } catch (e: any) {
    console.warn('Could not fetch AWS feeds, using fallback mock range. Error:', e.message);
    ipv4Ranges.push(cidrToRangeV4('52.92.0.0/12', 0));
  }

  // 2. Fetch Google Cloud
  try {
    console.log('Fetching Google Cloud IP Ranges...');
    const r = await fetchWithTimeout('https://www.gstatic.com/ipranges/cloud.json');
    if (!r.ok) throw new Error(`GCP status ${r.status}`);
    const j = await r.json() as any;
    for (const prefix of j.prefixes || []) {
      if (prefix.ipv4Prefix) ipv4Ranges.push(cidrToRangeV4(prefix.ipv4Prefix, 1));
      if (prefix.ipv6Prefix) ipv6Ranges.push(cidrToRangeV6(prefix.ipv6Prefix, 1));
    }
  } catch (e: any) {
    console.warn('Could not fetch GCP feeds, using fallback mock range. Error:', e.message);
    ipv4Ranges.push(cidrToRangeV4('35.192.0.0/12', 1));
  }

  // 3. Fetch Cloudflare
  try {
    console.log('Fetching Cloudflare IP Ranges...');
    const v4Resp = await fetchWithTimeout('https://www.cloudflare.com/ips-v4');
    const v6Resp = await fetchWithTimeout('https://www.cloudflare.com/ips-v6');
    if (v4Resp.ok && v6Resp.ok) {
      const v4Text = await v4Resp.text();
      const v6Text = await v6Resp.text();
      v4Text.split('\n').map(line => line.trim()).filter(Boolean).forEach(cidr => {
        ipv4Ranges.push(cidrToRangeV4(cidr, 2));
      });
      v6Text.split('\n').map(line => line.trim()).filter(Boolean).forEach(cidr => {
        ipv6Ranges.push(cidrToRangeV6(cidr, 2));
      });
    } else {
      throw new Error(`Cloudflare status v4: ${v4Resp.status}, v6: ${v6Resp.status}`);
    }
  } catch (e: any) {
    console.warn('Could not fetch Cloudflare feeds, using fallback mock range. Error:', e.message);
    const cf4 = [
      '173.245.48.0/20', '103.21.244.0/22', '103.22.200.0/22', '103.31.4.0/22',
      '141.101.64.0/18', '108.162.192.0/18', '190.93.240.0/20', '188.114.96.0/20',
      '197.234.240.0/22', '198.41.128.0/17', '162.158.0.0/15', '104.16.0.0/13',
      '104.24.0.0/14', '172.64.0.0/13', '131.0.72.0/22'
    ];
    const cf6 = [
      '2400:cb00::/32', '2606:4700::/32', '2803:f800::/32', '2405:b500::/32',
      '2405:8100::/32', '2a06:98c0::/29', '2c0f:f248::/32'
    ];
    cf4.forEach(cidr => ipv4Ranges.push(cidrToRangeV4(cidr, 2)));
    cf6.forEach(cidr => ipv6Ranges.push(cidrToRangeV6(cidr, 2)));
  }

  // Merge and Sort
  console.log(`Initial: IPv4 ranges = ${ipv4Ranges.length}, IPv6 ranges = ${ipv6Ranges.length}`);
  const mergedV4 = mergeRangesV4(ipv4Ranges);
  const mergedV6 = mergeRangesV6(ipv6Ranges);
  console.log(`Merged: IPv4 ranges = ${mergedV4.length}, IPv6 ranges = ${mergedV6.length}`);

  // Serialize to JSON
  // Note: BigInt needs to be converted to strings for JSON serialization
  const outJson = {
    providers: PROVIDERS,
    ipv4: mergedV4.map(r => [r.start, r.end, r.providerId]),
    ipv6: mergedV6.map(r => [r.start.toString(), r.end.toString(), r.providerId])
  };

  fs.writeFileSync(OUT_FILE, JSON.stringify(outJson, null, 2));
  console.log(`Successfully compiled and written to ${OUT_FILE}`);
}

main().catch(e => {
  console.error('Fatal compile-infra error:', e);
  process.exit(1);
});
