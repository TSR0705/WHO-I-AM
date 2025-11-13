# Who Am I — Deployment guide

This repository contains a small Who Am I web app (Node/Express backend + static frontend). The repo is prepared for containerized deployment.

What I added for deployment readiness

- Multi-stage `Dockerfile` at repository root that copies the static frontend into the backend and produces a lean production image.
- `docker-compose.yml` with a Redis service (persisted with a named volume) and a whoami service with a healthcheck.
- `.dockerignore` to reduce build context.
- GitHub Actions workflow `.github/workflows/ci.yml` to lint, test, build, and push the image to GitHub Container Registry (GHCR).

How CI works (push to `main`)

- Lints and runs tests located in the `backend` folder.
- Builds the Docker image using the repository-root `Dockerfile` and pushes tags to GHCR:
	- `ghcr.io/<ORG_OR_USER>/whoami:latest`
	- `ghcr.io/<ORG_OR_USER>/whoami:<commit-sha>`

Required repository secrets

If you want CI to push to GHCR using the `GITHUB_TOKEN` the workflow already requests `packages: write` permission. In some organizations you might need a Personal Access Token (PAT) with `write:packages` scope; in that case add the secret `GHCR_PAT` and update the workflow to use it instead of `GITHUB_TOKEN`.

Optional: push to Docker Hub

If you prefer Docker Hub, modify the workflow to login to Docker Hub and push tags. You will need to add `DOCKERHUB_USERNAME` and `DOCKERHUB_TOKEN` secrets.

Local testing & running

1. Build and run locally (no Redis):

```powershell
docker build -t whoami:local .
docker run --rm -p 3000:3000 --name whoami-local whoami:local
```

2. Build & run with Redis using docker-compose (recommended):

```powershell
docker-compose up --build -d
docker-compose ps
docker-compose logs -f whoami
```

3. Smoke checks

```powershell
# Health
(Invoke-WebRequest -Uri http://localhost:3000/healthz -UseBasicParsing).StatusCode

# API
Invoke-RestMethod -Uri http://localhost:3000/api/whoami
```

Notes & production tips

- Ensure `REDIS_URL` points to a managed Redis instance in production if you need persistence.
- If you rely on `visits.json` as a fallback, make sure the host directory is writable by the container user or configure a persistent volume.
- Configure provider health checks to use `/healthz`.
- For metrics, configure your monitoring system to scrape `/metrics`.

If you want, I can also:

- Add a workflow secret template or a GitHub Actions step to publish a release on push to `main`.
- Add Render/Fly/DigitalOcean deploy steps (I can auto-deploy from the built image if you tell me the provider).

Render deployment (workflow added)
---------------------------------

I added a workflow `.github/workflows/deploy-render.yml` that builds the image (like the CI workflow), pushes it to GHCR, and triggers your Render service to deploy the new image.

Required GitHub repository secrets for Render deploy
- `RENDER_SERVICE_ID` — the Render service id (found in your Render dashboard; looks like `srv-xxxxx`).
- `RENDER_API_KEY` — a Render API key with `deploy` permission (create in Render dashboard — give it an appropriate name and copy the key into GitHub Secrets).

How the workflow works
- On push to `main`, the workflow builds and pushes to `ghcr.io/<OWNER>/whoami:latest` and `:sha` and then POSTs to `https://api.render.com/v1/services/${RENDER_SERVICE_ID}/deploys` to trigger a deploy.

Security note
- Keep `RENDER_API_KEY` secret and rotate it if compromised. Do not print secrets to logs.
# Who Am I

A full-stack web app that detects and displays your IP address, browser, OS, device type, and location.

## Folder Structure

```
backend/   # Node.js + Express API
frontend/  # HTML/CSS/JS frontend
```

## Backend

- Node.js + Express
- Endpoint: `GET /api/whoami`
- Detects IP, browser, OS, device, and location
- CORS enabled
- Dockerized (port 3000)

This repository includes a top-level `Dockerfile` that bundles the backend and the static frontend into a single container.

### Local Development

```
cd backend
npm install
npm start
```

Using Docker Compose (recommended for local dev with Redis):

```
# from repo root
docker-compose up --build
# open http://localhost:3000
```

### Docker Build & Run

```
docker build -t whoami-allinone .
# Run on port 3000
docker run -p 3000:3000 whoami-allinone
```

If port 3000 is already in use on your machine, map the container port to a different host port, for example 3002:

```powershell
docker run -p 3002:3000 whoami-allinone
```

## Frontend

- Pure HTML/CSS/JS (no build step)
- Open `frontend/index.html` in browser
- For local API, backend must be running on port 3000

Note: For reliable results, serve the frontend over HTTP (same origin) using the Docker image or python simple server. Opening `index.html` via file:// may lead to "Failed to fetch" errors. Recommended options:

- Serve via the packaged Docker image (same origin):

```
docker build -t whoami-prod .
docker run --rm -p 3000:3000 whoami-prod
# open http://localhost:3000
```

- Or use Docker Compose (recommended for local dev with Redis):

```
docker-compose up --build
# open http://localhost:3000
```

If you run the app with Docker Compose (above) the frontend is served from the backend at http://localhost:3000.

## Deployment (Render, Fly.io, Railway)

- Deploy only the `backend/` folder as a web service
- Set build command: `npm install`
- Set start command: `npm start`
- Expose port 3000
- Serve static frontend via GitHub Pages, Netlify, or Render static site
- Update API URL in `frontend/app.js` if needed for production

## Optional Extras

- Dark/Light mode toggle (frontend)
- Easily extendable for visitor counter or map view
 
New features added:
- Visitor counter persisted to `backend/visits.json` and exposed in the API under `visits`.
- Map view (Leaflet) on the frontend when the server can resolve coordinates for your IP.

---

**Visit the deployed URL to see your own IP, browser, OS, and location!**
