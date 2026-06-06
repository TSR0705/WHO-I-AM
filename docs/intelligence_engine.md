# WHO-I-AM: Intelligence Engine Documentation

This document explains the core logic, execution mechanisms, accuracy metrics, and tradeoffs of the five local intelligence layers inside WHO-I-AM.

---

## 1. ASN & ISP Detection Engine

### Why it exists
Determines ISP identity, network ownership, and network type. Resolving ASNs reveals whether an IP belongs to a residential consumer network, a mobile carrier, or a commercial datacenter.

### How it works
1. Normalizes the IP address (removes IPv4-mapped IPv6 prefixes like `::ffff:`).
2. Verifies that the IP is not a loopback or private range.
3. Queries the IP against `GeoLite2-ASN.mmdb.br` in-memory.
4. Returns the `autonomous_system_number` (prefixed with `AS`) and the registered `autonomous_system_organization` (ISP name).

### Tradeoffs & Limitations
* **Staleness**: IP blocks change ownership. The database must be compiled regularly at build time to prevent outdated organization tags.

---

## 2. Infrastructure Detection Engine

### Why it exists
Flags connections originating from commercial cloud datacenters (often indicating bots, web scrapers, proxy systems, or custom VPN tunnels).

### How it works
1. At build time, `compile-infra.ts` downloads official IP range feeds from AWS, Google Cloud, and Cloudflare.
2. It parses CIDR blocks into start/end numerical ranges (IPv4 integers and IPv6 BigInts) and sorts them.
3. Overlapping ranges belonging to the same provider are merged to minimize memory footprint.
4. At runtime, the server performs a **binary search** ($O(\log N)$) across these ranges to find matching subnets.

### Tradeoffs & Limitations
* **Subnet Coverage**: Only AWS, GCP, and Cloudflare subnets are actively scraped and stored. Smaller cloud providers (e.g., Hetzner, DigitalOcean) are resolved via keyword checks on the ASN Organization name.

---

## 3. Tor Exit Node Engine

### Why it exists
Identifies if a user is routing traffic through the Tor onion network. Tor nodes are heavily correlated with automated testing or anonymized traffic.

### How it works
1. During the build step, `compile-tor.ts` downloads Tor exit IP lists from `https://check.torproject.org/exit-addresses`.
2. It normalizes all entries and compiles them into a JSON array, verifying that the list contains between 500 and 10,000 nodes (a safety threshold to prevent corrupted builds).
3. At runtime, the server loads this JSON array into an $O(1)$ lookup `Set`.

### Tradeoffs & Limitations
* **Static Snapshot**: Since the Tor network updates constantly, the build-time list will slowly degrade over time. In production VPS deployments, a Cron task should trigger recompilation.

---

## 4. GeoIP Engine

### Why it exists
Resolves physical locations (Country, Region, City, Timezone, and Coordinates) locally with zero runtime network latency.

### How it works
1. Queries the target IP against `GeoLite2-City.mmdb.br` in-memory.
2. Extracted coordinates, timezone, city, and subdivisions are parsed.
3. **Sparse Subnet Fallback**: If the country node is empty, the engine falls back to evaluating `registered_country` and `represented_country` to ensure location data is returned.

### Tradeoffs & Limitations
* **Accuracy**: GeoIP lookups are accurate at the country level (~99%) but degrade at the city level (~60-80% depending on the ISP). Coordinates represent the ISP's regional routing center, not the user's actual location.
* **Asset Size**: The raw database size (~70MB) exceeds Vercel Hobby tier limits when packaged with other node dependencies. Brotli level 4 compression is used to reduce it to ~39MB, decompressing it in-memory at runtime.

---

## 5. Client Fingerprint Engine

### Canvas Fingerprinting
* **Method**: Draws text, lines, and shapes in varied fonts and colors inside a hidden `<canvas>` element. Serializes the raw image to a Base64 data URL and hashes it.
* **Why it works**: Minor hardware and driver differences in GPU rendering, sub-pixel rasterization, and anti-aliasing engines produce highly distinct, repeatable image hashes.

### Audio Fingerprinting
* **Method**: Synthesizes a high-frequency triangle wave oscillator via the Web Audio API and routes it through an analyser node. The raw frequency bin arrays are compiled and hashed.
* **Why it works**: Floating-point calculation differences in the browser's audio processing engine, OS audio drivers, and CPU architecture produce unique digital outputs.

### WebGL Fingerprinting
* **Method**: Renders WebGL vertices and queries the `WEBGL_debug_renderer_info` extension for `UNMASKED_VENDOR_WEBGL` and `UNMASKED_RENDERER_WEBGL`.
* **Why it works**: Exposes the user's graphic cards, vendor, and driver versions.
