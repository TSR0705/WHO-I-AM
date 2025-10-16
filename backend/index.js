const express = require('express');
const cors = require('cors');
const requestIp = require('request-ip');
const useragent = require('useragent');
const geoip = require('geoip-lite');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());

// Serve static frontend if present in ./public
const publicDir = path.join(__dirname, 'public');
if (fs.existsSync(publicDir)) {
  app.use(express.static(publicDir));
}

// Simple file-based persistence for visitor counts
const VISITS_FILE = path.join(__dirname, 'visits.json');
function readVisits() {
  try {
    const raw = fs.readFileSync(VISITS_FILE, 'utf8');
    return JSON.parse(raw);
  } catch (e) {
    return { total: 0, byIp: {} };
  }
}

function writeVisits(data) {
  try {
    fs.writeFileSync(VISITS_FILE, JSON.stringify(data, null, 2));
  } catch (e) {
    console.error('Failed to write visits file', e);
  }
}

// Ensure visits file exists
if (!fs.existsSync(VISITS_FILE)) {
  writeVisits({ total: 0, byIp: {} });
}

app.get('/api/whoami', (req, res) => {
  // Get IP
  const ipRaw = requestIp.getClientIp(req) || req.ip || '';
  // request-ip may return '::ffff:127.0.0.1' -> normalize
  const ip = ipRaw.replace('::ffff:', '');

  // Get user agent info
  const ua = req.headers['user-agent'] || '';
  const agent = useragent.parse(ua);
  const browser = agent.toAgent();
  const os = agent.os.toString();
  const device = agent.device.toString();

  // Get location (may be empty for private IPs)
  const geo = geoip.lookup(ip) || {};
  const location = {
    city: geo.city || '',
    region: geo.region || '',
    country: geo.country || '',
    latitude: geo.ll ? geo.ll[0] : null,
    longitude: geo.ll ? geo.ll[1] : null
  };

  // Update visits
  const visits = readVisits();
  visits.total = (visits.total || 0) + 1;
  visits.byIp = visits.byIp || {};
  visits.byIp[ip] = (visits.byIp[ip] || 0) + 1;
  writeVisits(visits);

  res.json({
    ip,
    browser,
    os,
    device,
    location,
    visits: {
      total: visits.total,
      unique: Object.keys(visits.byIp).length,
      yourVisits: visits.byIp[ip] || 0
    }
  });
});

app.get('/api/visits', (req, res) => {
  const visits = readVisits();
  res.json({ total: visits.total || 0, unique: Object.keys(visits.byIp || {}).length });
});

app.get('/', (req, res) => {
  // If frontend is built into public, serve it
  const indexPath = path.join(publicDir, 'index.html');
  if (fs.existsSync(indexPath)) return res.sendFile(indexPath);
  return res.send('Who Am I API is running.');
});
// Health endpoint for orchestrators
app.get('/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

// Start server with retry on EADDRINUSE
function startServer(startPort, maxAttempts = 10) {
  let attempts = 0;
  function tryListen(port) {
    const s = app.listen(port, () => {
      console.log(`Server running on port ${port}`);
      // attach shutdown handlers to this server instance
      function shutdown() {
        console.log('Shutting down...');
        s.close(() => {
          console.log('Server closed');
          process.exit(0);
        });
        setTimeout(() => process.exit(1), 5000);
      }
      process.on('SIGTERM', shutdown);
      process.on('SIGINT', shutdown);
    });

    s.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        attempts += 1;
        if (attempts >= maxAttempts) {
          console.error(`Port ${port} in use and max attempts reached. Exiting.`);
          process.exit(1);
        }
        console.warn(`Port ${port} in use, trying ${port + 1}...`);
        setTimeout(() => tryListen(port + 1), 200);
      } else {
        console.error('Server error', err);
        process.exit(1);
      }
    });
  }
  tryListen(startPort);
}

startServer(Number(process.env.PORT) || PORT);
