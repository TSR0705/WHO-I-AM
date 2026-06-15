import dgram from 'dgram';
import Redis from 'ioredis';

export class DNSServer {
  private server: dgram.Socket;
  private redis: Redis | null = null;
  private localCache: Map<string, string[]>;

  constructor(redisClient: Redis | null, localCacheRef: Map<string, string[]>) {
    this.server = dgram.createSocket('udp4');
    this.redis = redisClient;
    this.localCache = localCacheRef;
  }

  public start(port: number = 1053) {
    this.server.on('message', (msg, rinfo) => {
      try {
        this.handleQuery(msg, rinfo);
      } catch (err) {
        console.error('Failed to parse DNS query:', err);
      }
    });

    this.server.on('listening', () => {
      const address = this.server.address();
      console.log(`DNS Server listening on ${address.address}:${address.port} (UDP)`);
    });

    this.server.bind(port);
  }

  public stop() {
    try {
      this.server.close();
    } catch (e) {
      // ignore
    }
  }

  private async handleQuery(msg: Buffer, rinfo: dgram.RemoteInfo) {
    if (msg.length < 12) return;

    // Transaction ID (2 bytes)
    const id = msg.readUInt16BE(0);
    // Flags (2 bytes)
    const flags = msg.readUInt16BE(2);

    // Verify it is a query (QR flag = 0)
    const isQuery = (flags & 0x8000) === 0;
    if (!isQuery) return;

    // Number of questions (QDCOUNT)
    const qdCount = msg.readUInt16BE(4);
    if (qdCount === 0) return;

    // Parse the domain name in the Question Section (starting at offset 12)
    let offset = 12;
    const labels: string[] = [];
    while (offset < msg.length) {
      const len = msg.readUInt8(offset);
      if (len === 0) {
        offset += 1;
        break;
      }
      if (offset + 1 + len > msg.length) return; // boundary check
      const label = msg.toString('utf8', offset + 1, offset + 1 + len);
      labels.push(label);
      offset += 1 + len;
    }

    // We are looking for domains like: <session-token>.dns.exposur.com
    // Labels array: ["xyz123", "dns", "exposur", "com"]
    if (labels.length >= 3 && labels[1] === 'dns') {
      const sessionToken = labels[0];
      const resolverIp = rinfo.address;

      // Save resolver IP under sessionToken
      if (this.redis) {
        await this.redis.sadd(`dns:leak:${sessionToken}`, resolverIp);
        await this.redis.expire(`dns:leak:${sessionToken}`, 300); // 5 min TTL
      } else {
        const current = this.localCache.get(sessionToken) || [];
        if (!current.includes(resolverIp)) {
          this.localCache.set(sessionToken, [...current, resolverIp]);
        }
      }
    }

    // Build DNS response (A record pointing to 127.0.0.1)
    // Response flags: standard query response, no recursion available (0x8180)
    const responseFlags = 0x8180;
    const response = Buffer.alloc(offset + 16); // offset points after name

    // Header section
    response.writeUInt16BE(id, 0);
    response.writeUInt16BE(responseFlags, 2);
    response.writeUInt16BE(1, 4); // QDCOUNT (1 question)
    response.writeUInt16BE(1, 6); // ANCOUNT (1 answer)
    response.writeUInt16BE(0, 8); // NSCOUNT
    response.writeUInt16BE(0, 10); // ARCOUNT

    // Copy Question section (Name, QTYPE, and QCLASS)
    msg.copy(response, 12, 12, offset + 4);

    // Answer section offset
    const ansOffset = offset + 4;
    response.writeUInt16BE(0xc00c, ansOffset); // Name Pointer to offset 12
    response.writeUInt16BE(0x0001, ansOffset + 2); // TYPE A
    response.writeUInt16BE(0x0001, ansOffset + 4); // CLASS IN
    response.writeUInt32BE(10, ansOffset + 6); // TTL (10s)
    response.writeUInt16BE(4, ansOffset + 10); // RDLENGTH (4 bytes)
    
    // Return dummy IP 127.0.0.1
    response.writeUInt8(127, ansOffset + 12);
    response.writeUInt8(0, ansOffset + 13);
    response.writeUInt8(0, ansOffset + 14);
    response.writeUInt8(1, ansOffset + 15);

    this.server.send(response, 0, response.length, rinfo.port, rinfo.address);
  }
}
