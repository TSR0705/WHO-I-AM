import fs from 'fs';
import { vpnDetectorInstance } from '../services/vpn-detector';

jest.mock('fs', () => {
  const originalFs = jest.requireActual('fs');
  return {
    ...originalFs,
    readFileSync: jest.fn().mockImplementation((pathStr, options) => {
      if (typeof pathStr === 'string' && pathStr.endsWith('tor-exit-nodes.json')) {
        return JSON.stringify([
          '185.220.101.5',
          '185.220.101.6',
          '2a0b:f4c0:2::5',
          '2001:db8::ff00:42:8329'
        ]);
      }
      return originalFs.readFileSync(pathStr, options);
    }),
    existsSync: jest.fn().mockImplementation((pathStr) => {
      if (typeof pathStr === 'string' && pathStr.endsWith('tor-exit-nodes.json')) {
        return true;
      }
      return originalFs.existsSync(pathStr);
    })
  };
});

describe('Tor Exit Node Detection Unit Tests', () => {
  beforeAll(() => {
    vpnDetectorInstance.reload();
  });

  describe('isTorNode', () => {
    it('should detect known Tor IPv4 exit node', () => {
      expect(vpnDetectorInstance.isTorNode('185.220.101.5')).toBe(true);
      expect(vpnDetectorInstance.isTorNode('185.220.101.6')).toBe(true);
    });

    it('should detect known Tor IPv6 exit node', () => {
      expect(vpnDetectorInstance.isTorNode('2a0b:f4c0:2::5')).toBe(true);
    });

    it('should strip ::ffff: mapped IPv4 prefixes and match', () => {
      expect(vpnDetectorInstance.isTorNode('::ffff:185.220.101.5')).toBe(true);
    });

    it('should be case-insensitive for IPv6 addresses', () => {
      expect(vpnDetectorInstance.isTorNode('2A0B:F4C0:2::5')).toBe(true);
      expect(vpnDetectorInstance.isTorNode('2a0b:f4c0:2::5')).toBe(true);
    });

    it('should normalize compressed zero segments in IPv6 lookup', () => {
      // 2001:0db8:0000:0000:0000:ff00:0042:8329 is 2001:db8::ff00:42:8329
      expect(vpnDetectorInstance.isTorNode('2001:0db8:0000:0000:0000:ff00:0042:8329')).toBe(true);
    });

    it('should return false for residential and public non-Tor IPs', () => {
      expect(vpnDetectorInstance.isTorNode('8.8.8.8')).toBe(false);
      expect(vpnDetectorInstance.isTorNode('1.1.1.1')).toBe(false);
      expect(vpnDetectorInstance.isTorNode('2001:4860:4860::8888')).toBe(false);
    });

    it('should return false for private or local loopback IPs', () => {
      expect(vpnDetectorInstance.isTorNode('127.0.0.1')).toBe(false);
      expect(vpnDetectorInstance.isTorNode('::1')).toBe(false);
      expect(vpnDetectorInstance.isTorNode('192.168.1.1')).toBe(false);
    });

    it('should handle brackets in IPv6 address lookups', () => {
      expect(vpnDetectorInstance.isTorNode('[2a0b:f4c0:2::5]')).toBe(true);
    });
  });
});
