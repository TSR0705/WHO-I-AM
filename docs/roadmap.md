# Exposur: Development Roadmap

This document outlines the phased roadmap of the Exposur privacy diagnostics system.

---

## Completed Phases

### Phase 1: ASN Intelligence (Complete)
* **Goal**: Replace third-party ASN lookup APIs with offline, local search.
* **Deliverables**:
  * Implemented build-time MaxMind `GeoLite2-ASN` downloader.
  * Configured Brotli level 4 compression to bundle databases under the 50MB Vercel Hobby size limits.
  * Added in-memory zlib decompression on Express startup.

### Phase 2: Infrastructure Detection (Complete)
* **Goal**: Detect hosting, cloud, and CDN IPs.
* **Deliverables**:
  * Built `compile-infra.ts` to scrape, parse, and merge AWS, Google Cloud, and Cloudflare CIDR blocks.
  * Implemented an $O(\log N)$ logarithmic binary search algorithm to match user IPs against compiled subnets.
  * Added fallback keyword detection on ASN organization names.

### Phase 3: Tor Detection (Complete)
* **Goal**: Fast, offline identification of Tor routing.
* **Deliverables**:
  * Scraped the live dump from `check.torproject.org/exit-addresses` at build time.
  * Added safety checks to verify exit node list counts (between 500 and 10,000 entries) to prevent packaging corrupted files.
  * Added $O(1)$ lookup checks on server launch.

### Phase 4: GeoIP Location Intelligence (Complete)
* **Goal**: Zero-latency localized physical mapping.
* **Deliverables**:
  * Replaced `geoip-lite` and external APIs with `GeoLite2-City.mmdb` Brotli compression packaging.
  * Added sparse node fallbacks (`country`, `registered_country`, `represented_country`) to ensure location data is consistently returned.
  * Integrated an interactive Leaflet dark map on the frontend showing physical IP locations and device GPS coordinates.

---

## Future Phases

### Phase 5: Fingerprint Intelligence (In Progress)
* **Goal**: Expand collected client parameters to expose subtle tracking vectors.
* **Planned Features**:
  * **Font Fingerprinting**: Render canvas font width tests for a set of 50 common system fonts to identify local font libraries.
  * **Media Devices Enum**: Enumerate local speaker, microphone, and camera indicators (without requesting device access permissions).
  * **WebGL 2 Extended**: Read GPU texture rendering limits and shader precision values.

### Phase 6: Unified Risk Scoring Engine
* **Goal**: Implement a threat matrix that computes a privacy hazard grade.
* **Planned Features**:
  * Implement weighted risk assessments combining proxy headers, local WebRTC exposure, and DNS resolver location discrepancies.
  * Categorize ratings into clear grades (e.g. `Critical Risk`, `Moderate Risk`, `Secure`).

### Phase 7: Interactive Privacy Mitigation Reports
* **Goal**: Provide users with actionable guides to patch exposed leak vectors.
* **Planned Features**:
  * Generate a downloadable PDF showing mitigation checklists based on active leaks.
  * Provide browser extension recommendations (e.g. uBlock Origin configurations) to block WebRTC candidate queries.
  * Guide users through configuring secure custom DNS resolver connections in their system settings.
