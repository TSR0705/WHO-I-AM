# WHO-I-AM: Backend Documentation

This document explains the routing, services, middleware stack, custom compiler scripts, and data layers of the WHO-I-AM Express application.

---

## 1. Core Server (`src/index.ts`)

The Express entrypoint initializes server parameters, configures security middlewares, registers REST routes, and binds the UDP DNS server.

### Key Configurations:
* **Proxy Trust**: Configured via `ENV.TRUST_PROXY`. In production, it defaults to `1` (trusting the first hop proxy from Vercel/Cloudflare) to ensure accurate client IP resolution.
* **Middlewares**:
  * `helmet()`: Implements a strict Content Security Policy (CSP).
  * `cors()`: Whitelists origins based on `ENV.ALLOWED_ORIGIN`.
  * `requestIp.mw()`: Normalizes client IP addresses.
  * `rateLimit()`: Limits requests to `/api/` path to 120 requests/minute.
  * `prom-client`: Instruments default runtime metrics and HTTP latency histograms.
* **Port-Step Listener**: If the default port (e.g., `3000`) is in use, the server steps up (up to 10 attempts) until a free port is bound.
* **DNS Server Hook**: Starts the background UDP DNS Server in non-serverless environments (`!process.env.VERCEL`).

---

## 2. API Routes

### Network Diagnostic Router (`src/routes/whoami.ts`)
* **Endpoint**: `GET /api/whoami`
* **Query Parameters**:
  * `spoofIp` *(optional)*: Mocks lookup for a custom IP address.
  * `spoofUserAgent` *(optional)*: Mocks analysis for a custom browser agent string.
  * `clientOs` *(optional)*: Passes client-side Javascript detected OS to check for User-Agent mismatch spoofing.
* **Logic**:
  1. Resolves IP routing parameters (checks proxy headers: `via`, `forwarded`, `x-forwarded-for`, `client-ip`, `x-real-ip`).
  2. Queries ASN database for provider network org.
  3. Queries City database for location details.
  4. Runs IP through Tor exit node list and VPN detector provider check.
  5. Parses browser/OS/device categories via `ua-parser-js`.
  6. Compares header OS with Javascript client OS to report platform discrepancies.
  7. Updates stats counters and returns the JSON payload.

### Fingerprint Submission Router (`src/routes/fingerprint.ts`)
* **Endpoint**: `POST /api/fingerprint`
* **Payload**:
  ```json
  {
    "canvasHash": "string",
    "audioHash": "string",
    "browser": "string",
    "os": "string",
    "device": "string"
  }
  ```
* **Logic**: Inserts the fingerprint into Postgres (if configured) and calculates relative uniqueness proportions. Returns percentages representing how many other profiles share these exact canvas and audio signatures.

### DNS Leak Diagnostic Router (`src/routes/dns-leak.ts`)
* **Endpoints**:
  * `GET /api/dns-leak/init`: Generates a random session token and returning a test subdomain (e.g. `<token>.dns.whoami.com`).
  * `GET /api/dns-leak/check?token=xyz`: Queries Redis or the local memory cache for all resolver IPs that attempted to resolve this subdomain, resolving their geographical location to highlight leak origins.

---

## 3. Core Business Services

### GeoIP Service (`src/services/geo.ts`)
* **Implementation**: Resolves the Country ISO code, Region Name, City Name, Latitude, Longitude, and Timezone of an IP.
* **Method**: Locates the `GeoLite2-City.mmdb.br` file, decompresses the Brotli buffer at runtime (`zlib.brotliDecompressSync`), loads it into `maxmind.Reader`, and checks the target IP. Includes robust checks to bypass lookups for loopback (`127.0.0.1`) and RFC 1918 private subnets.

### ASN lookup Service (`src/services/asn.ts`)
* **Implementation**: Resolves autonomous system number (ASN) and organization name.
* **Method**: Resolves the target IP against `GeoLite2-ASN.mmdb.br` in the same Brotli decompression manner.

### Infrastructure Engine (`src/services/infrastructure.ts`)
* **Implementation**: Maps client IPs against public cloud subnet blocks.
* **Method**: Loads `infra-ranges.json` containing pre-compiled arrays of AWS, GCP, and Cloudflare subnets. Converts IPs to numbers (IPv4) or `BigInt` (IPv6) and runs a **binary search** to find matches in $O(\log N)$ time.

### VPN & Tor Detector (`src/services/vpn-detector.ts`)
* **Implementation**: Identifies anonymized network routing.
* **Method**: Normalizes IPv6/IPv4 inputs. Compares target IP against a compiled array of Tor exit nodes loaded from `tor-exit-nodes.json`. Evaluates the ISP Organization against hosting keywords (e.g., `hetzner`, `ovh`, `digitalocean`) to detect hosting/VPS routing.

### DNS Leak Test Server (`src/dns-server.ts`)
* **Implementation**: Custom UDP server listening on UDP Port `1053` (standard DNS port is 53, mapped locally or run behind docker).
* **Method**: Receives raw UDP packets, parses standard DNS headers, decodes query questions to identify `<token>.dns.domain.com` subdomains, writes the requesting resolver IP to Redis/local cache, and returns a dummy A record pointing to `127.0.0.1`.

### Visits Counter (`src/services/visits.ts`)
* **Implementation**: Increments visit counts.
* **Method**: Uses `ioredis` to execute atomic increments on Redis (`visits:total`, `visits:byIp`). Falls back to writing to a local `visits.json` file on the filesystem if Redis is unavailable.

---

## 4. Build-Time Compilers & Scripts

### Database Downloader (`scripts/download-db.js`)
Pulls MaxMind databases, decompresses GZIP layers, Brotli compresses MMDB files to level 4 compression, and deletes the heavy raw files:
```bash
node scripts/download-db.js
# Output: GeoLite2-ASN.mmdb.br (~2.5MB), GeoLite2-City.mmdb.br (~39MB)
```

### Cloud range compiler (`scripts/compile-infra.ts`)
Queries live JSON feeds from AWS, Google Cloud, and Cloudflare. Converts CIDRs to start/end integer markers, merges overlapping ranges to minimize array footprints, and saves the output to `infra-ranges.json`.

### Tor exit compiler (`scripts/compile-tor.ts`)
Scrapes live exit node IP logs from `https://check.torproject.org/exit-addresses`, normalizes IPv4/IPv6 strings, checks them against bounds limits, and generates `tor-exit-nodes.json`.
