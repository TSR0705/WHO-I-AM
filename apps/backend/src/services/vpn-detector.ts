import { InfrastructureLookupService } from './infrastructure';

export class VpnDetector {
  private torExitNodes: Set<string> = new Set();
  private isUpdating = false;

  constructor() {
    // Initial static list for offline/immediate tests
    const defaultTorNodes = [
      '185.220.101.5', '185.220.101.6', '185.220.101.7', '185.220.101.8',
      '109.70.100.201', '192.42.116.16', '162.247.74.201', '104.244.76.13'
    ];
    defaultTorNodes.forEach(ip => this.torExitNodes.add(ip));
    
    // Trigger background updates
    this.updateTorExitNodes();
    setInterval(() => this.updateTorExitNodes(), 3600 * 1000); // refresh hourly
  }

  // Fetch Tor Exit nodes from official source
  public async updateTorExitNodes() {
    if (this.isUpdating) return;
    this.isUpdating = true;
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch('https://check.torproject.org/torbulkexitlist', {
        signal: controller.signal
      });
      clearTimeout(timeout);

      if (response.ok) {
        const text = await response.text();
        const ips = text.split('\n').map(line => line.trim()).filter(line => line.length > 0 && !line.startsWith('#'));
        
        if (ips.length > 0) {
          this.torExitNodes.clear();
          ips.forEach(ip => this.torExitNodes.add(ip));
          console.log(`VPN Detector: Loaded ${this.torExitNodes.size} Tor Exit Nodes`);
        }
      }
    } catch (e) {
      console.warn('VPN Detector: Could not fetch Tor bulk exit list, using cached/static set');
    } finally {
      this.isUpdating = false;
    }
  }

  // Check Tor Node status
  public isTorNode(ip: string): boolean {
    return this.torExitNodes.has(ip);
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
