# WHO-I-AM: Deployment Guide

This guide details the steps required to configure, compile, test, and deploy the WHO-I-AM application locally, inside Docker, or on Vercel.

---

## 1. Environment Variables configuration

Create a `.env` file in the root directory (or under `apps/backend/`):

```env
PORT=3000
NODE_ENV=production

# Database Settings
DATABASE_URL=postgresql://user:password@hostname:5432/dbname
REDIS_URL=redis://:password@redis-hostname:6379

# Network Routing Settings
ALLOWED_ORIGIN=*
TRUST_PROXY=1

# DNS Leak Server Settings (Non-serverless only)
DNS_PORT=1053
DNS_DOMAIN=dns.yourdomain.com
```

---

## 2. Local Development Setup

### Prerequisites
* Node.js v18.0.0+
* npm or yarn
* PostgreSQL and Redis (optional, local file fallbacks will be used if omitted)

### Step 1: Install Workspaces Dependencies
From the project root:
```bash
npm install
```

### Step 2: Compile Local Intelligence Databases
WHO-I-AM requires compiling location subnets and exit nodes at build time. Run:
```bash
# Download and Brotli-compress MaxMind MMDB tables
node apps/backend/scripts/download-db.js --force

# Fetch and compile cloud provider IP ranges
npx ts-node apps/backend/scripts/compile-infra.ts --force

# Fetch and compile Tor exit node IPs
npx ts-node apps/backend/scripts/compile-tor.ts --force
```

### Step 3: Run Dev Servers
Start both workspaces concurrently:
```bash
npm run dev
```
The frontend will bind to `http://localhost:3000` (or another port depending on availability), and the Express backend API will serve on `http://localhost:3001`.

---

## 3. Docker Deployment

WHO-I-AM includes a root `docker-compose.yml` to orchestrate services:

```yaml
version: '3.8'

services:
  backend:
    build:
      context: ./apps/backend
    ports:
      - "3001:3000"
      - "1053:1053/udp" # Expose UDP DNS Leak server
    environment:
      - PORT=3000
      - NODE_ENV=production
      - REDIS_URL=redis://redis:6379
      - DNS_PORT=1053
      - DNS_DOMAIN=dns.localhost
    depends_on:
      - redis

  frontend:
    build:
      context: ./apps/frontend
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_API_URL=http://localhost:3001

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
```

Run Docker containers:
```bash
docker-compose up --build -d
```

---

## 4. Vercel Serverless Deployment

WHO-I-AM uses Vercel Services to deploy both workspaces under a single domain.

### vercel.json configuration
The root `vercel.json` maps the frontend Next.js routing to the root `/` and handles backend Express routes under `/api`:

```json
{
  "experimentalServices": {
    "frontend": {
      "root": "apps/frontend",
      "routePrefix": "/",
      "framework": "nextjs"
    },
    "backend": {
      "root": "apps/backend",
      "routePrefix": "/api",
      "entrypoint": "src/index.ts",
      "builder": "@vercel/node",
      "includeFiles": [
        "src/data/GeoLite2-ASN.mmdb.br",
        "src/data/GeoLite2-City.mmdb.br",
        "src/data/infra-ranges.json",
        "src/data/tor-exit-nodes.json"
      ]
    }
  }
}
```

### Vercel Zip Limit Compliance (Brotli)
Vercel has a 50MB function zip limit on its Hobby tier. The raw MaxMind database assets exceed 78MB. 
* To resolve this, `download-db.js` Brotli-compresses the databases down to ~42MB total.
* The backend reads the compressed buffers and decompresses them in-memory on startup.
* The `includeFiles` array tells the Vercel builder to trace these files, packaging them with the backend function.

---

## 5. Troubleshooting Guide

### 1. `POST /api/fingerprint` returns 500
* **Cause**: Postgres connection error or SSL handshake refusal.
* **Fix**: Ensure `DATABASE_URL` is set. If utilizing managed databases (Neon, Supabase), make sure the SSL parameters permit untrusted certs (`ssl: { rejectUnauthorized: false }`).

### 2. Vercel Deployment Schema Validation Error
* **Cause**: Invalid keys under `experimentalServices.backend`.
* **Fix**: Ensure that `includeFiles` is a direct key of the `backend` service block in `vercel.json`. It must **not** be nested inside a `"config": {}` block.

### 3. DNS Leak Test reports no resolvers
* **Cause**: DNS server port binding block or missing DNS delegation records.
* **Fix**: Ensure UDP Port 1053/53 is open and exposed. Set `DNS_DOMAIN` to a domain delegated to your WHO-I-AM server IP.
