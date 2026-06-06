import { AsnLookupService } from '../services/asn';

describe('AsnLookupService Unit Tests', () => {
  describe('Special Case IPs', () => {
    it('should resolve IPv4 loopback to Local Loopback (AS0)', async () => {
      const res = await AsnLookupService.lookup('127.0.0.1');
      expect(res.asn).toBe('AS0');
      expect(res.organization).toBe('Local Loopback');
    });

    it('should resolve IPv6 loopback to Local Loopback (AS0)', async () => {
      const res = await AsnLookupService.lookup('::1');
      expect(res.asn).toBe('AS0');
      expect(res.organization).toBe('Local Loopback');
    });

    it('should resolve IPv4 private network range to Private Network (AS0)', async () => {
      const res = await AsnLookupService.lookup('192.168.1.50');
      expect(res.asn).toBe('AS0');
      expect(res.organization).toBe('Private Network');
    });

    it('should resolve IPv4 private 10.x.x.x range to Private Network (AS0)', async () => {
      const res = await AsnLookupService.lookup('10.0.0.1');
      expect(res.asn).toBe('AS0');
      expect(res.organization).toBe('Private Network');
    });

    it('should resolve IPv6 unique local address (ULA) to Private Network (AS0)', async () => {
      const res = await AsnLookupService.lookup('fd00::1');
      expect(res.asn).toBe('AS0');
      expect(res.organization).toBe('Private Network');
    });
  });

  describe('Real GeoLite2 ASN Lookups', () => {
    it('should resolve 8.8.8.8 to Google LLC (AS15169)', async () => {
      const res = await AsnLookupService.lookup('8.8.8.8');
      expect(res.asn).toBe('AS15169');
      expect(res.organization).toContain('Google');
    });

    it('should resolve 1.1.1.1 to Cloudflare (AS13335)', async () => {
      const res = await AsnLookupService.lookup('1.1.1.1');
      expect(res.asn).toBe('AS13335');
      expect(res.organization).toContain('Cloudflare');
    });

    it('should resolve Google IPv6 DNS (2001:4860:4860::8888) to Google LLC (AS15169)', async () => {
      const res = await AsnLookupService.lookup('2001:4860:4860::8888');
      expect(res.asn).toBe('AS15169');
      expect(res.organization).toContain('Google');
    });
  });

  describe('Malformed / Missing IPs', () => {
    it('should handle empty IP gracefully', async () => {
      const res = await AsnLookupService.lookup('');
      expect(res.asn).toBe('Unknown');
      expect(res.organization).toBe('Unknown ISP / Network');
    });

    it('should handle invalid IP address formats gracefully', async () => {
      const res = await AsnLookupService.lookup('not-an-ip');
      expect(res.asn).toBe('Unknown');
      expect(res.organization).toBe('Unknown ISP / Network');
    });
  });
});
