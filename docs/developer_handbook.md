# Exposur: Developer Handbook

This handbook details the code style guidelines, backend architecture design patterns, client-side safety measures, and path resolution rules enforced in the Exposur project.

---

## 1. Code Standards and Conventions

* **TypeScript Strictness**: Interfaces must be explicit. Avoid usage of `any` except during fallback parsing.
* **Casing Conventions**:
  * **Variables & Functions**: `camelCase` (e.g. `canvasUniqueness`, `resolveGeolocation()`).
  * **Classes, Types, & Interfaces**: `PascalCase` (e.g. `AsnLookupService`, `GeolocationResult`).
  * **Global Constants & Env Variables**: `UPPER_SNAKE_CASE` (e.g. `DATABASE_URL`, `GEO_CACHE_TTL_MS`).
* **ESLint**: Standard formatting rules. Do not bypass lint assertions unless documenting exceptions (e.g., using `// eslint-disable-next-line`).

---

## 2. Backend Architecture Design Patterns

### Service-Router Decoupling
Express routes must only handle HTTP input parsing, authorization checks, and payload serialization. Core execution logic belongs strictly within the services layer under `src/services/`.

### Flexible Path Resolution (Candidates Map)
Because the app runs in diverse deployment modes (local dev, compiled target, Docker container, and Vercel serverless), resolving assets cannot rely on static paths. All service modules resolving local database assets (`.mmdb.br` or `.json`) must check a sequence of candidates:

```typescript
function findDbPath(): string {
  const candidates = [
    // 1. Process relative (local dev running from apps/backend, or Vercel execution root)
    path.join(process.cwd(), 'src/data/Asset.db'),
    path.join(process.cwd(), 'dist/data/Asset.db'),
    
    // 2. Monorepo root relative (dev/local running from monorepo root)
    path.join(process.cwd(), 'apps/backend/src/data/Asset.db'),
    path.join(process.cwd(), 'apps/backend/dist/data/Asset.db'),
    
    // 3. Module relative (compiled JS in dist/services/)
    path.join(__dirname, '../data/Asset.db'),
    
    // 4. Module relative (source TS in src/services/)
    path.join(__dirname, '../../src/data/Asset.db')
  ];

  for (const p of candidates) {
    if (fs.existsSync(p)) return p;
  }
  return path.join(__dirname, '../data/Asset.db'); // default fallback
}
```

### Single-Ton Service Instances
Business services that manage stateful caches or connections (e.g., `vpnDetectorInstance`, `visitsService`, `pool`) are instantiated once and exported as class singletons.

---

## 3. Graceful Failure & Safe Fallback Patterns

To prevent the backend from crashing when external connections fail, follow these guidelines:
1. **Try-Catch Encapsulation**: Wrap database initialization and queries in try-catch blocks.
2. **Local Counter Fallbacks**: If Redis fails, check for a local `visits.json` file. If writing fails, log the error and degrade to memory maps.
3. **Stateless Mocking**: If PostgreSQL is unreachable, do not fail the `/api/fingerprint` endpoint. Log the error and return a safe mock payload (e.g. reporting `100%` uniqueness and `1` totalChecked).

---

## 4. Client-Side Fingerprinting Safety Guards

Modern privacy browsers (e.g., Brave, Tor Browser) block canvas rendering, WebAudio context initialization, or WebRTC STUN negotiations.
* **DOM Safety Guards**: Wrap fingerprint harvesting lookups in try-catch scopes to prevent script execution crashes.
* **Placeholder Indicators**: If the API throws a permission error, catch it and return placeholder strings (`blocked` or `not-supported`) so the dashboard displays this status cleanly to the user.
* **Low-Overhead String Hashing**: Do not use heavy cryptographic libraries (e.g., CryptoJS SHA256) on the main thread. Use the custom 32-bit bitwise shift integer hash function `hashString` to keep frame-rates high.
