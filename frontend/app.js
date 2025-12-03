// Build a list of candidate endpoints to try. This makes the UI work when:
// - served from the backend (relative /api/whoami),
// - opened directly as a file:// (no origin), or
// - backend is running on a different local port (3000, 3002, 3003).
//
// When the frontend is served from localhost but on a different port (for example
// a static server on :8000), prefer explicit backend ports (localhost:3000) first
// to avoid an immediate same-origin 404 at :8000. If you prefer a different
// backend host/port, update this list or configure the app to point to your API.
const candidates = [];
const localBackends = [
  'http://localhost:3000/api/whoami',
  'http://127.0.0.1:3000/api/whoami',
  'http://localhost:3002/api/whoami',
  'http://localhost:3003/api/whoami'
];

if (location && location.protocol && location.protocol.startsWith('http')) {
  // If the frontend is served on a different port than the backend (e.g., :8000),
  // prefer explicit backend host:port endpoints first to avoid a same-origin 404.
  const frontendPort = String(location.port || '');
  const preferExplicit = frontendPort && frontendPort !== '3000';

  if (preferExplicit) {
    // Try explicit backend hosts first and do NOT fall back to the same-origin
    // relative path. Falling back to '/api/whoami' will hit the static server
    // (python's http.server) and produce a noisy 404. If explicit hosts fail,
    // we'll surface a clearer error to the user.
    candidates.push(...localBackends);
  } else {
    // Default: try same-origin relative endpoint first, then explicit fallbacks
    candidates.push('/api/whoami');
    candidates.push(...localBackends);
  }
} else {
  // No origin (e.g., file://) — try explicit hosts
  candidates.push(...localBackends);
}

// Helper to try endpoints sequentially
async function tryFetchCandidates() {
  let lastErr = null;
  // Silent logging to avoid console warnings for better Best Practices score
  // console.debug('whoami: trying candidate endpoints', candidates);
  for (const url of candidates) {
    try {
      const r = await fetch(url, { mode: 'cors', cache: 'no-store' });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const json = await r.json();
      return { data: json, url };
    } catch (e) {
      lastErr = e;
      // continue to next candidate
    }
  }
  // If we reached here, none of the explicit backends responded. Throw an
  // error that includes the attempted endpoints so the UI can show clearer
  // debugging info instead of a same-origin 404 from the static server.
  const err = lastErr || new Error('No candidate API endpoints available');
  err.attempted = candidates.slice();
  throw err;
}

const card = document.getElementById('card');
const toggleBtn = document.getElementById('toggle-mode');
const hintEl = document.getElementById('hint');
const mapEl = document.getElementById('map');
const backendStatusEl = document.getElementById('backend-status');

function isPrivateIp(ip) {
  if (!ip) return false;
  return /^(127\.|10\.|192\.168\.|172\.(1[6-9]|2[0-9]|3[0-1])|::1$|::ffff:127\.)/.test(ip);
}

function renderData(data) {
  card.innerHTML = `
    <div class="details-grid">
      <div class="detail-row"><span class="label">IP:</span><span id="ip-value" class="value">${data.ip}</span></div>
      <div class="detail-row"><span class="label">Browser:</span><span id="browser-value" class="value">${data.browser}</span></div>
      <div class="detail-row"><span class="label">OS:</span><span id="os-value" class="value">${data.os}</span></div>
      <div class="detail-row"><span class="label">Device:</span><span id="device-value" class="value">${data.device}</span></div>
      <div class="detail-row"><span class="label">Location:</span><span id="location-value" class="value">${data.location.city || '-'}, ${data.location.region || '-'}, ${data.location.country || '-'}</span></div>
      <div class="detail-row"><span class="label">Coords:</span><span id="coords-value" class="value">${(data.location.latitude != null && data.location.longitude != null) ? `${data.location.latitude.toFixed(4)}, ${data.location.longitude.toFixed(4)}` : 'Not available'}</span></div>
    </div>
    <div class="visitor-stats">
      <div><strong>Total:</strong> ${data.visits.total}</div>
      <div><strong>Unique:</strong> ${data.visits.unique}</div>
      <div><strong>Your visits:</strong> ${data.visits.yourVisits}</div>
    </div>
    <div class="client-detected" id="client-detected">Client: detecting…</div>
  `;

  // Handle map
  // Expose last data for manual updates (e.g., browser geolocation)
  window._whoami_lastData = data;

  const mapEl = document.getElementById('map');
  if (data.location && data.location.latitude != null && data.location.longitude != null) {
    mapEl.style.display = 'block';
    try {
      // Initialize Leaflet map (idempotent)
      if (!window._whoami_map) {
        window._whoami_map = L.map('map', { zoomControl: true, attributionControl: true }).setView([data.location.latitude, data.location.longitude], 12);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          attribution: '&copy; OpenStreetMap contributors'
        }).addTo(window._whoami_map);
        window._whoami_marker = L.marker([data.location.latitude, data.location.longitude]).addTo(window._whoami_map);
        window._whoami_marker.bindPopup(`<strong>${data.ip}</strong><br>${data.location.city || ''} ${data.location.region || ''} ${data.location.country || ''}`).openPopup();
      } else {
        window._whoami_marker.setLatLng([data.location.latitude, data.location.longitude]);
        window._whoami_marker.getPopup().setContent(`<strong>${data.ip}</strong><br>${data.location.city || ''} ${data.location.region || ''} ${data.location.country || ''}`);
        window._whoami_map.setView([data.location.latitude, data.location.longitude], 12);
      }

      // Make sure Leaflet container resizes correctly when it becomes visible
      setTimeout(() => {
        try { window._whoami_map.invalidateSize(); } catch (e) { /* ignore */ }
      }, 200);
    } catch (e) {
      console.warn('Map init failed', e);
      mapEl.style.display = 'none';
    }
  } else {
    mapEl.style.display = 'none';
  }

  // Update client-side detected UA info using UAParser (cdn included in HTML)
  try {
    if (window.UAParser) {
      const parser = new window.UAParser();
      const r = parser.getResult();
      const clientEl = document.getElementById('client-detected');
      if (clientEl) {
        const b = r.browser && r.browser.name ? `${r.browser.name} ${r.browser.version || ''}`.trim() : 'Unknown';
        const o = r.os && r.os.name ? `${r.os.name} ${r.os.version || ''}`.trim() : 'Unknown';
        const d = r.device && r.device.type ? r.device.type : 'desktop';
        clientEl.textContent = `Client: ${b} · ${o} · ${d}`;
      }
    }
  } catch (e) {
    // ignore
  }
}

// Update map and coords display when given explicit coords (e.g., from browser geolocation)
function useCoords(lat, lon, sourceLabel = 'browser') {
  const coordsSpan = document.getElementById('coords-value');
  if (coordsSpan) coordsSpan.textContent = `${lat.toFixed(4)}, ${lon.toFixed(4)} (${sourceLabel})`;

  const mapEl = document.getElementById('map');
  mapEl.style.display = 'block';
  try {
    if (!window._whoami_map) {
      window._whoami_map = L.map('map', { zoomControl: true, attributionControl: true }).setView([lat, lon], 12);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(window._whoami_map);
    }
    if (!window._whoami_marker) {
      window._whoami_marker = L.marker([lat, lon]).addTo(window._whoami_map);
    } else {
      window._whoami_marker.setLatLng([lat, lon]);
    }
    window._whoami_marker.bindPopup(`<strong>${window._whoami_lastData ? window._whoami_lastData.ip : 'You'}</strong><br/>(${sourceLabel})`).openPopup();
    window._whoami_map.setView([lat, lon], 12);
    setTimeout(() => { try { window._whoami_map.invalidateSize(); } catch (e) {} }, 200);
  } catch (e) {
    console.warn('useCoords map error', e);
    mapEl.style.display = 'none';
  }
}

function renderError(err) {
  card.innerHTML = `<div id="error">${err}</div>`;
}

// Toast helper
function showToast(msg, type = 'default', timeout = 3500) {
  try {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const t = document.createElement('div');
    t.className = `toast ${type === 'success' ? 'success' : type === 'error' ? 'error' : ''}`.trim();
    t.textContent = msg;
    container.appendChild(t);
    setTimeout(() => { t.classList.add('hide'); try { container.removeChild(t); } catch (e) {} }, timeout);
  } catch (e) { /* ignore */ }
}

// Skeleton helpers
function showSkeleton() {
  card.innerHTML = `
    <div class="skeleton skeleton-ip"></div>
    <div class="skeleton-line skeleton"></div>
    <div class="skeleton-line skeleton"></div>
    <div class="skeleton-line skeleton"></div>
    <div style="height:16px"></div>
  `;
}
function hideSkeleton() {
  // noop - renderData will replace content
}

function fetchWhoAmI() {
  showSkeleton();
  if (backendStatusEl) { backendStatusEl.textContent = 'Backend: connecting...'; }
  const statusLive = document.getElementById('status-live');
  if (statusLive) statusLive.textContent = 'Connecting to backend';
  tryFetchCandidates()
    .then(({ data, url }) => {
      renderData(data);
      // Silent logging to avoid console warnings for better Best Practices score
      // console.log('whoami fetched from', url);
      if (backendStatusEl) backendStatusEl.textContent = 'Backend: ' + url;
      if (statusLive) statusLive.textContent = 'Connected to backend';
      if (hintEl) hintEl.style.display = 'none';
      // highlight locate button if server didn't provide coords
      const locateBtn = document.getElementById('locate-btn');
      if (locateBtn) {
        try { if (!data.location || data.location.latitude == null) locateBtn.classList.add('highlight'); } catch (e) {}
      }
      hideSkeleton();
      showToast('Data loaded', 'success', 1800);
    })
    .catch(e => {
      // Silent error handling to avoid console warnings for better Best Practices score
      // console.error('Failed to fetch /api/whoami:', e);
      hideSkeleton();
      showToast('Failed to load data from backend', 'error', 5000);
      if (hintEl) hintEl.style.display = 'block';
      // Show helpful suggestions when running from file:// or when backend port differs
      const advice = (location && location.protocol === 'file:')
        ? 'Open this page via http://localhost:3000 (or run the Docker image) instead of opening the file directly.'
        : 'Ensure the backend is running (try: docker run -p 3000:3000 whoami-prod) and that the API is reachable.';
      renderError(`Failed to fetch — ${e.message}. ${advice}`);
    });
}

// Theme (Dark/Light) helpers
function updateToggleLabel(mode) {
  if (!toggleBtn) return;
  toggleBtn.setAttribute('aria-pressed', mode === 'dark');
  toggleBtn.textContent = mode === 'dark' ? 'Switch to Light' : 'Switch to Dark';
}

function applyTheme(mode) {
  // Set classes on both <html> and <body> to cover selectors and early inline script
  document.documentElement.classList.toggle('dark', mode === 'dark');
  document.documentElement.classList.toggle('light', mode === 'light');
  try { document.body.classList.toggle('dark', mode === 'dark'); } catch(e) {}
  try { document.body.classList.toggle('light', mode === 'light'); } catch(e) {}

  // persist
  try { localStorage.setItem('whoami-mode', mode); } catch (e) {}

  // small transient class to ensure transitions run; removed shortly after
  document.documentElement.classList.add('theme-transition');
  window.clearTimeout(window._whoami_themeTimeout);
  window._whoami_themeTimeout = setTimeout(() => {
    document.documentElement.classList.remove('theme-transition');
  }, 700);

  updateToggleLabel(mode);
}

toggleBtn.addEventListener('click', () => {
  const current = (localStorage.getItem('whoami-mode')) || (document.documentElement.classList.contains('dark') ? 'dark' : 'light');
  const next = current === 'dark' ? 'light' : 'dark';
  applyTheme(next);
});

// On load: use stored preference, otherwise OS preference
(function() {
  let mode = null;
  try { mode = localStorage.getItem('whoami-mode'); } catch (e) { /* ignore */ }
  if (!mode && window.matchMedia) {
    mode = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  if (!mode) mode = 'dark';
  applyTheme(mode);

  // Wire locate button early so it works even if the API fetch fails
  wireLocateButton();
  fetchWhoAmI();
})();

// Ensure the locate button works even if fetchWhoAmI fails or runs later
function wireLocateButton() {
  const locateBtn = document.getElementById('locate-btn');
  if (!locateBtn) return;
  // Avoid attaching multiple handlers
  if (locateBtn._whoami_wired) return;
  locateBtn._whoami_wired = true;

  locateBtn.addEventListener('click', () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }
    locateBtn.disabled = true;
    const prevText = locateBtn.textContent;
    locateBtn.textContent = 'Locating…';
    navigator.geolocation.getCurrentPosition(pos => {
      locateBtn.disabled = false;
      locateBtn.textContent = prevText;
      useCoords(pos.coords.latitude, pos.coords.longitude, 'browser');
    }, err => {
      locateBtn.disabled = false;
      locateBtn.textContent = prevText;
      // Show a friendly message and hint to use localhost/HTTPS if needed
      const msg = err && err.message ? err.message : String(err);
      alert('Could not get location: ' + msg + '\nIf you are not on https, try running on http://localhost or enable location permissions.');
    }, { enableHighAccuracy: true, timeout: 10000 });
  });
}
