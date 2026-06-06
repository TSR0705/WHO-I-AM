import { InfrastructureLookupService } from '../services/infrastructure';
import { vpnDetectorInstance } from '../services/vpn-detector';

describe('InfrastructureLookupService Unit Tests', () => {
  describe('Compiled Cloud Ranges Lookup', () => {
    it('should resolve AWS IP range to Amazon Web Services', () => {
      // 52.92.0.1 is part of AWS block
      const res = InfrastructureLookupService.lookup('52.92.0.1');
      expect(res).toBe('Amazon Web Services');
    });

    it('should resolve Google Cloud IP range to Google Cloud', () => {
      // 35.192.0.1 is part of Google Cloud block
      const res = InfrastructureLookupService.lookup('35.192.0.1');
      expect(res).toBe('Google Cloud');
    });

    it('should resolve Cloudflare IP range to Cloudflare', () => {
      // 104.16.0.1 is part of Cloudflare block
      const res = InfrastructureLookupService.lookup('104.16.0.1');
      expect(res).toBe('Cloudflare');
    });

    it('should return null for residential/non-cloud IPs', () => {
      const res = InfrastructureLookupService.lookup('8.8.8.8'); // Google Public DNS is owned by Google, but not part of Google Cloud customer ranges in cloud.json
      expect(res).toBeNull();
    });

    it('should return null for private/loopback IPs', () => {
      expect(InfrastructureLookupService.lookup('127.0.0.1')).toBeNull();
      expect(InfrastructureLookupService.lookup('192.168.1.1')).toBeNull();
    });
  });
});

describe('VpnDetector Hybrid Lookups', () => {
  describe('getHostingProvider', () => {
    it('should resolve AWS IP to Amazon Web Services', () => {
      const res = vpnDetectorInstance.getHostingProvider('52.92.0.1');
      expect(res).toBe('Amazon Web Services');
    });

    it('should resolve Google Cloud IP to Google Cloud', () => {
      const res = vpnDetectorInstance.getHostingProvider('35.192.0.1');
      expect(res).toBe('Google Cloud');
    });

    it('should resolve Cloudflare IP to Cloudflare', () => {
      const res = vpnDetectorInstance.getHostingProvider('104.16.0.1');
      expect(res).toBe('Cloudflare');
    });

    it('should fall back to ASN Organization name for Hetzner', () => {
      const res = vpnDetectorInstance.getHostingProvider('95.217.0.1', 'Hetzner Online GmbH');
      expect(res).toBe('Hetzner Online GmbH');
    });

    it('should fall back to ASN Organization name for OVH', () => {
      const res = vpnDetectorInstance.getHostingProvider('198.27.64.1', 'OVH SAS');
      expect(res).toBe('OVH SAS');
    });

    it('should return null for residential ISP (no keyword match)', () => {
      const res = vpnDetectorInstance.getHostingProvider('73.1.2.3', 'Comcast Cable');
      expect(res).toBeNull();
    });

    it('should return null for local loopback', () => {
      const res = vpnDetectorInstance.getHostingProvider('127.0.0.1');
      expect(res).toBeNull();
    });
  });
});
