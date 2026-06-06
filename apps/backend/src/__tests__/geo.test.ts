import { resolveGeolocation } from '../services/geo';

describe('resolveGeolocation Service Unit Tests', () => {
  describe('Special Case IPs (Loopback & Private)', () => {
    it('should resolve IPv4 loopback to empty/UTC', async () => {
      const res = await resolveGeolocation('127.0.0.1');
      expect(res).toEqual({
        city: '',
        region: '',
        country: '',
        latitude: null,
        longitude: null,
        timezone: 'UTC'
      });
    });

    it('should resolve IPv6 loopback to empty/UTC', async () => {
      const res = await resolveGeolocation('::1');
      expect(res).toEqual({
        city: '',
        region: '',
        country: '',
        latitude: null,
        longitude: null,
        timezone: 'UTC'
      });
    });

    it('should resolve IPv4 private range to empty/UTC', async () => {
      const res = await resolveGeolocation('192.168.1.100');
      expect(res).toEqual({
        city: '',
        region: '',
        country: '',
        latitude: null,
        longitude: null,
        timezone: 'UTC'
      });
    });

    it('should resolve IPv4 private 10.x.x.x range to empty/UTC', async () => {
      const res = await resolveGeolocation('10.0.0.1');
      expect(res).toEqual({
        city: '',
        region: '',
        country: '',
        latitude: null,
        longitude: null,
        timezone: 'UTC'
      });
    });

    it('should resolve IPv6 unique local address (ULA) to empty/UTC', async () => {
      const res = await resolveGeolocation('fd00::1');
      expect(res).toEqual({
        city: '',
        region: '',
        country: '',
        latitude: null,
        longitude: null,
        timezone: 'UTC'
      });
    });
  });

  describe('Real GeoLite2 City Lookups', () => {
    it('should resolve 8.8.8.8 to US with valid coordinates and timezone', async () => {
      const res = await resolveGeolocation('8.8.8.8');
      expect(res.country).toBe('US');
      expect(typeof res.latitude).toBe('number');
      expect(typeof res.longitude).toBe('number');
      expect(res.timezone).toContain('America/');
    });

    it('should resolve 1.1.1.1 to US or AU with valid coordinates', async () => {
      const res = await resolveGeolocation('1.1.1.1');
      expect(['US', 'AU']).toContain(res.country);
      expect(res.latitude === null || typeof res.latitude === 'number').toBe(true);
      expect(res.longitude === null || typeof res.longitude === 'number').toBe(true);
    });

    it('should resolve Google IPv6 DNS (2001:4860:4860::8888) to US', async () => {
      const res = await resolveGeolocation('2001:4860:4860::8888');
      expect(res.country).toBe('US');
      expect(typeof res.latitude).toBe('number');
      expect(typeof res.longitude).toBe('number');
    });
  });

  describe('Malformed / Missing IPs', () => {
    it('should handle empty IP gracefully', async () => {
      const res = await resolveGeolocation('');
      expect(res).toEqual({
        city: '',
        region: '',
        country: '',
        latitude: null,
        longitude: null,
        timezone: 'UTC'
      });
    });

    it('should handle invalid IP address formats gracefully', async () => {
      const res = await resolveGeolocation('not-an-ip');
      expect(res).toEqual({
        city: '',
        region: '',
        country: '',
        latitude: null,
        longitude: null,
        timezone: 'UTC'
      });
    });
  });
});
