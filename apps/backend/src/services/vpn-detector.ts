import fs from 'fs';
import path from 'path';
import { InfrastructureLookupService } from './infrastructure';

function findTorJsonPath(): string {
  const candidates = [
    // 1. Process relative (local dev running from apps/backend, or Vercel execution root)
    path.join(process.cwd(), 'src/data/tor-exit-nodes.json'),
    path.join(process.cwd(), 'dist/data/tor-exit-nodes.json'),
    
    // 2. Monorepo root relative (dev/local running from monorepo root)
    path.join(process.cwd(), 'apps/backend/src/data/tor-exit-nodes.json'),
    path.join(process.cwd(), 'apps/backend/dist/data/tor-exit-nodes.json'),
    
    // 3. Module relative (compiled JS in dist/services/ looking at dist/data/)
    path.join(__dirname, '../data/tor-exit-nodes.json'),
    // Module relative (compiled JS in dist/services/ looking at src/data/)
    path.join(__dirname, '../../src/data/tor-exit-nodes.json'),
    
    // 4. Module relative (source TS in src/services/ looking at src/data/)
    path.join(__dirname, '../data/tor-exit-nodes.json')
  ];

  for (const p of candidates) {
    if (fs.existsSync(p)) {
      return p;
    }
  }

  return path.join(__dirname, '../data/tor-exit-nodes.json');
}

export class VpnDetector {
  private torExitNodes: Set<string> | null = null;

  constructor() {}

  /**
   * Normalizes IPv6 addresses to standard lowercase, compressed RFC 5952 representation.
   * Leaves IPv4 addresses unchanged.
   */
  private normalizeIp(ip: string): string {
    let clean = ip.trim().toLowerCase();
    
    // Strip brackets
    if (clean.startsWith('[') && clean.endsWith(']')) {
      clean = clean.slice(1, -1);
    }
    
    // Strip IPv4-mapped IPv6 prefix
    if (clean.startsWith('::ffff:')) {
      return clean.substring(7);
    }

    if (!clean.includes(':')) {
      return clean;
    }

    const parts = clean.split('::');
    if (parts.length > 2) return clean;

    const left = parts[0] ? parts[0].split(':') : [];
    const right = parts[1] ? parts[1].split(':') : [];

    const leftSegs = left.filter(s => s.length > 0);
    const rightSegs = right.filter(s => s.length > 0);

    const middleLen = 8 - (leftSegs.length + rightSegs.length);
    if (middleLen < 0 || middleLen > 8) return clean;

    const middle = Array(middleLen).fill('0');
    const segments = [...leftSegs, ...middle, ...rightSegs].map(s => {
      const val = parseInt(s, 16);
      if (isNaN(val)) return '0';
      return val.toString(16);
    });

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

  private getTorNodes(): Set<string> {
    if (!this.torExitNodes) {
      this.torExitNodes = new Set();
      try {
        const filePath = findTorJsonPath();
        if (fs.existsSync(filePath)) {
          const data = fs.readFileSync(filePath, 'utf8');
          const ips: string[] = JSON.parse(data);
          ips.forEach(ip => this.torExitNodes!.add(ip));
          console.log(`VPN Detector: Loaded ${this.torExitNodes.size} Tor Exit Nodes`);
        } else {
          console.warn(`VPN Detector: Tor exit nodes database file not found at ${filePath}`);
        }
      } catch (err: any) {
        console.error(`VPN Detector: Failed to load Tor exit nodes:`, err.message);
      }
    }
    return this.torExitNodes;
  }

  // Check Tor Node status
  public isTorNode(ip: string): boolean {
    const normalized = this.normalizeIp(ip);
    return this.getTorNodes().has(normalized);
  }

  /**
   * Force reloads the Tor exit nodes list from the local JSON file.
   * Useful for unit testing or hot-reloading in production VPS deployments.
   */
  public reload(): void {
    this.torExitNodes = null;
    this.getTorNodes();
  }

  // Check Hosting/VPN status using compiled range list and ASN Org fallback
  public getHostingProvider(ip: string, asnOrganization?: string): string | null {
    if (ip === '127.0.0.1' || ip === '::1') return null;

    // 1. Check compiled cloud provider ranges (AWS, Google Cloud, Cloudflare)
    const infraProvider = InfrastructureLookupService.lookup(ip);
    if (infraProvider) {
      return infraProvider;
    }

    // 2. Check ASN Organization fallback (Hetzner, OVH, Vultr, Linode, DigitalOcean, etc.)
    if (asnOrganization && asnOrganization !== 'Unknown ISP / Network' && asnOrganization !== 'Unknown') {
      const org = asnOrganization.toLowerCase();
      const keywords = [
        'ovh', 'hetzner', 'linode', 'vultr', 'leaseweb', 'contabo', 'scaleway',
        'liquid web', 'hivelocity', 'equinix', 'cogent', 'fastly', 'akamai',
        'webnx', 'ovhcloud', 'digitalocean', 'hosting', 'vps', 'colocation',
        'data center', 'datacenter', 'vps', 'cloud provider', 'cloud services',
        'infrastructure', 'dedicated server', 'servertech'
      ];

      for (const kw of keywords) {
        if (org.includes(kw)) {
          return asnOrganization;
        }
      }
    }

    return null;
  }
}

export const vpnDetectorInstance = new VpnDetector();
