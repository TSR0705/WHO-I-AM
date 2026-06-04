// Using global fetch available in Node 20

// Curated static subnets for major cloud providers (AWS, GCP, DigitalOcean, Azure)
// to identify hosting/VPN gateways offline
const HOSTING_SUBNETS = [
  // AWS examples
  '3.5.0.0/16', '3.8.0.0/15', '13.32.0.0/15', '13.34.0.0/16', '15.177.0.0/16', '18.208.0.0/13', '34.192.0.0/12', '52.0.0.0/10', '54.0.0.0/8',
  // Google Cloud examples
  '34.80.0.0/12', '35.184.0.0/13', '35.192.0.0/11', '104.154.0.0/15', '104.196.0.0/14', '130.211.0.0/16',
  // DigitalOcean examples
  '104.131.0.0/16', '104.248.0.0/16', '138.197.0.0/16', '138.68.0.0/16', '142.93.0.0/16', '159.203.0.0/16', '159.65.0.0/16', '165.22.0.0/16', '167.99.0.0/16', '178.62.0.0/16', '206.189.0.0/16', '46.101.0.0/16',
  // Azure examples
  '13.64.0.0/11', '20.33.0.0/16', '23.96.0.0/13', '40.64.0.0/10', '52.136.0.0/13', '104.40.0.0/13'
];

// Helper to convert IPv4 string to integer
function ipToInt(ip: string): number | null {
  const parts = ip.split('.');
  if (parts.length !== 4) return null;
  return parts.reduce((ipInt, octet) => {
    const val = parseInt(octet, 10);
    if (isNaN(val) || val < 0 || val > 255) return NaN;
    return (ipInt << 8) + val;
  }, 0) >>> 0;
}

// Helper to verify if an IP is in a CIDR subnet range
function isIpInCidr(ip: string, cidr: string): boolean {
  const [range, bitsStr = '32'] = cidr.split('/');
  const bits = parseInt(bitsStr, 10);
  
  const ipInt = ipToInt(ip);
  const rangeInt = ipToInt(range);
  
  if (ipInt === null || rangeInt === null || isNaN(ipInt) || isNaN(rangeInt)) return false;
  
  const mask = bits === 0 ? 0 : (~(2 ** (32 - bits) - 1)) >>> 0;
  return (ipInt & mask) === (rangeInt & mask);
}

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
      // Fetch with timeout
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

  // Check Hosting subnets status
  public getHostingProvider(ip: string): string | null {
    if (ip === '127.0.0.1' || ip === '::1') return null;

    // Check against AWS CIDRs
    for (const cidr of HOSTING_SUBNETS) {
      if (isIpInCidr(ip, cidr)) {
        if (cidr.startsWith('3.') || cidr.startsWith('13.') || cidr.startsWith('15.') || cidr.startsWith('18.') || cidr.startsWith('34.') || cidr.startsWith('52.') || cidr.startsWith('54.')) {
          // Simplistic mapping for static array demo
          if (cidr.startsWith('104.131.') || cidr.startsWith('138.197.') || cidr.startsWith('159.203.') || cidr.startsWith('165.22.')) {
            return 'DigitalOcean';
          }
          if (cidr.startsWith('34.80.') || cidr.startsWith('35.184.') || cidr.startsWith('104.154.') || cidr.startsWith('130.211.')) {
            return 'Google Cloud (GCP)';
          }
          return 'Amazon Web Services (AWS)';
        }
        if (cidr.startsWith('13.64.') || cidr.startsWith('20.33.') || cidr.startsWith('40.64.')) {
          return 'Microsoft Azure';
        }
        return 'Cloud Provider (Hosting/VPN)';
      }
    }
    return null;
  }
}

export const vpnDetectorInstance = new VpnDetector();
