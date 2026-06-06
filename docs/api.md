# WHO-I-AM: API Reference

This document provides request, response, error schemas, and execution examples for all API endpoints.

---

## 1. Get WhoAmI Diagnostics (`GET /api/whoami`)

Analyzes client IP routing, user-agent details, proxy forwarding parameters, and location.

### Request Headers
* **`User-Agent`**: Analyzed to parse browser and OS parameters.
* **Proxy Headers** *(optional)*: `x-forwarded-for`, `x-real-ip`, `via`, `forwarded`, `client-ip`.

### Query Parameters
* **`spoofIp`** *(string, optional)*: Overrides client IP resolution to analyze another target address.
* **`spoofUserAgent`** *(string, optional)*: Overrides the User-Agent header payload.
* **`clientOs`** *(string, optional)*: Pass client-side browser OS to check for User-Agent spoofing.

### Response Schema (`200 OK`)
```json
{
  "ip": "203.0.113.195",
  "network": {
    "isp": "Amazon.com, Inc.",
    "asn": "AS16509",
    "timezone": "America/New_York"
  },
  "browser": "Chrome 122.0.0",
  "os": "Windows 10",
  "device": "desktop",
  "location": {
    "city": "Ashburn",
    "region": "Virginia",
    "country": "US",
    "latitude": 39.0438,
    "longitude": -77.4874,
    "timezone": "America/New_York"
  },
  "visits": {
    "total": 1420,
    "unique": 285,
    "yourVisits": 3
  },
  "proxy": {
    "hasProxyHeaders": true,
    "parsedHeaders": {
      "x-forwarded-for": "203.0.113.195, 12.34.56.78"
    },
    "rawForwardedCount": 2
  },
  "anonymization": {
    "isVpnOrHosting": true,
    "isTorNode": false,
    "provider": "Amazon Web Services"
  },
  "simulation": {
    "active": false,
    "isSpoofedIp": false,
    "isSpoofedUserAgent": false,
    "realIp": "203.0.113.195",
    "realUserAgent": "Mozilla/5.0..."
  },
  "securityAudit": {
    "userAgentMismatch": false
  }
}
```

---

## 2. Submit Fingerprint (`POST /api/fingerprint`)

Inserts client graphics/audio signatures to calculate statistical population uniqueness ratios.

### Request Body (`application/json`)
```json
{
  "canvasHash": "9af1c305",
  "audioHash": "c4d12e8b",
  "browser": "Firefox 120.0",
  "os": "Linux x86_64",
  "device": "desktop"
}
```

### Response Schema (`200 OK`)
```json
{
  "totalChecked": 12850,
  "canvas": {
    "hash": "9af1c305",
    "sharedPercentage": 0.08,
    "isUnique": false
  },
  "audio": {
    "hash": "c4d12e8b",
    "sharedPercentage": 0.01,
    "isUnique": true
  }
}
```

### Errors
* **`400 Bad Request`**: Returned if `canvasHash` or `audioHash` is missing.
  ```json
  { "error": "Missing canvasHash or audioHash" }
  ```

---

## 3. Initialize DNS Leak Session (`GET /api/dns-leak/init`)

Generates a session token and subdomain to initiate a DNS leak test.

### Response Schema (`200 OK`)
```json
{
  "token": "x8y2k1z9",
  "testSubdomain": "x8y2k1z9.dns.yourdomain.com"
}
```

---

## 4. Query DNS Leak Resolvers (`GET /api/dns-leak/check`)

Retrieves the list of DNS resolver IPs that attempted to resolve the initialized subdomain.

### Query Parameters
* **`token`** *(string, required)*: The session token generated during `/init`.

### Response Schema (`200 OK`)
```json
{
  "token": "x8y2k1z9",
  "resolversCount": 2,
  "resolvers": [
    {
      "ip": "74.125.73.10",
      "country": "US",
      "region": "California",
      "city": "Mountain View"
    },
    {
      "ip": "8.8.8.8",
      "country": "US",
      "region": "Virginia",
      "city": "Ashburn"
    }
  ]
}
```

### Errors
* **`400 Bad Request`**: Returned if `token` parameter is missing.
  ```json
  { "error": "Missing token parameter" }
  ```

---

## 5. Health Probes

### Application Health (`GET /health` or `GET /healthz`)
* **Response**:
  ```json
  {
    "status": "ok",
    "uptime": 1240.52,
    "redis": true
  }
  ```

### Server Readiness (`GET /ready`)
* **Response**: Returns `200 OK` if Redis check succeeds or if no Redis is configured. Returns `503 Service Unavailable` if Redis is configured but the connection is down.
  ```json
  { "ready": true }
  ```

### Prometheus Metrics (`GET /metrics`)
* **Response**: Standard plain-text metric values for CPU, memory, garbage collection, and custom API counters (`whoami_http_requests_total`).
