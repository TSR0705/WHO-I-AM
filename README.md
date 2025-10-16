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
