import Redis from 'ioredis';
import { DNSServer } from '../dns-server';
import { ENV } from '../config/env';

export const dnsCache = new Map<string, string[]>();
let dnsServerInstance: DNSServer | null = null;

export function startDnsServer(redisClient: Redis | null) {
  const dnsPort = ENV.DNS_PORT;
  dnsServerInstance = new DNSServer(redisClient, dnsCache);
  dnsServerInstance.start(dnsPort);
}

export function stopDnsServer() {
  if (dnsServerInstance) {
    dnsServerInstance.stop();
  }
}
