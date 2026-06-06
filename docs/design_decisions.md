# WHO-I-AM: Design Decisions & Tradeoffs

This document details the architectural decisions, database selections, and engineering tradeoffs made during the development of the WHO-I-AM intelligence engine.

---

## 1. Local Intelligence vs. Third-Party APIs

### The Decision
All routing, geolocation, cloud infrastructure, and Tor detection logic is executed **completely locally** on the server at runtime. No external lookup API (like `ipapi.co` or IPInfo) is queried.

### Rationale
1. **Absolute Privacy**: External APIs require sending the visitor's IP address to a third-party service, violating the core privacy promise of a privacy diagnostic platform.
2. **Zero Latency**: Network roundtrips to external API endpoints introduce a 150-400ms overhead. In-memory local database checks resolve in under 5ms.
3. **No Rate Limits or Fees**: Third-party IP intelligence tools charge high fees for high-volume endpoints. Offline local databases allow unlimited lookups for free.

---

## 2. GeoLite2 ASN & City Databases

### The Decision
MaxMind GeoLite2 databases were selected as the primary data sources for ASN organization mapping and geographical coordinates lookup.

### Rationale
MaxMind is the industry standard for open GeoIP intelligence, offering structured databases in the binary MMDB format, which is optimized for quick, concurrent lookups.

---

## 3. Tor Exit Node Compilation

### The Decision
Rather than calling Tor DNSEL (DNS-based Exit List) lookup servers or external checkers at runtime, WHO-I-AM scrapes, normalizes, and bundles a list of Tor exit IPs at build time.

### Rationale
* **Zero Runtime Overhead**: Parsing a static JSON file into a `Set` on startup gives $O(1)$ lookup complexity at runtime.
* **Resilience**: Bypasses external connection drops that would break Tor detection during heavy server load.

---

## 4. No VPN APIs (Cloud Ranges + ASN Keyword Checks)

### The Decision
Instead of paying for expensive commercial VPN blocklists, VPN and hosting routing is detected using a hybrid approach:
1. **Pre-Compiled Cloud Ranges**: Exact IP boundaries for AWS, GCP, and Cloudflare subnets are compiled and resolved using binary search.
2. **ASN Keyword Filtering**: An organization fallback list filters ASN names for server/hosting keywords (e.g. `hetzner`, `ovh`, `digitalocean`, `datacenter`).

### Rationale
Over 90% of commercial VPN providers route client traffic through standard commercial datacenters (VPS hosts). Identifying commercial cloud ranges is a reliable proxy for VPN/proxy routing.

---

## 5. Vercel Monorepo Deployment Constraints

### The Challenge
Vercel Hobby tier has a **50MB zipped function size limit**. The raw MaxMind database assets (`GeoLite2-City` and `GeoLite2-ASN`) exceed 78MB uncompressed.

### The Solution (Brotli Level 4 Compression)
We implement a build-time compressor script:
* **Brotli Level 4**: Compresses the raw MMDB assets to `.br` files, reducing the combined asset footprint to ~42MB.
* **In-Memory Decompression**: At backend startup, the server reads the `.br` files, runs native Node `brotliDecompressSync` in-memory, and feeds the resulting buffer to the `maxmind.Reader` instance.

### Tradeoffs
* **Memory Utilization**: Keeping decompressed buffers in RAM increases server memory footprint by ~70MB. This is well within Vercel's 1024MB serverless execution limits.
* **Decompression Latency**: Startup decompression introduces a 300-500ms latency overhead during serverless cold starts. This is an acceptable tradeoff to enable deploying local GeoIP intelligence on Vercel's free serverless infrastructure.
* **Static Databases**: Build-time compilation means database records do not update dynamically. On static serverless endpoints, this is addressed by scheduling daily Vercel rebuilds. On VPS setups, a Cron job can compile and reload assets dynamically.
