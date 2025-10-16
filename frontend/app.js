// Build a list of candidate endpoints to try. This makes the UI work when:
// - served from the backend (relative /api/whoami),
// - opened directly as a file:// (no origin), or
// - backend is running on a different local port (3000, 3002, 3003).
const candidates = [];
if (location && location.protocol && location.protocol.startsWith('http')) {
  // If the page has an origin, prefer same-origin relative endpoint first
  candidates.push('/api/whoami');
}
// Add common local backend ports as fallbacks (use explicit host so file:// works)
candidates.push('http://localhost:3000/api/whoami');
candidates.push('http://127.0.0.1:3000/api/whoami');
candidates.push('http://localhost:3002/api/whoami');
candidates.push('http://localhost:3003/api/whoami');

// Helper to try endpoints sequentially
async function tryFetchCandidates() {
  let lastErr = null;
  for (const url of candidates) {
    try {
      const r = await fetch(url, { mode: 'cors' });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const json = await r.json();
      return { data: json, url };
    } catch (e) {
      lastErr = e;
      // continue to next candidate
    }
  }
  throw lastErr || new Error('No candidate API endpoints available');
}

const card = document.getElementById('card');
const toggleBtn = document.getElementById('toggle-mode');
const hintEl = document.getElementById('hint');
const mapEl = document.getElementById('map');

function renderData(data) {
  card.innerHTML = `
    <div><span class="label">IP:</span> <span class="value">${data.ip}</span></div>
    <div><span class="label">Browser:</span> <span class="value">${data.browser}</span></div>
    <div><span class="label">OS:</span> <span class="value">${data.os}</span></div>
    <div><span class="label">Device:</span> <span class="value">${data.device}</span></div>
    <div><span class="label">Location:</span> <span class="value">${data.location.city || '-'}, ${data.location.region || '-'}, ${data.location.country || '-'}</span></div>
    <div class="visitor-stats">
      <div><strong>Total:</strong> ${data.visits.total}</div>
      <div><strong>Unique:</strong> ${data.visits.unique}</div>
      <div><strong>Your visits:</strong> ${data.visits.yourVisits}</div>
    </div>
  `;

  // Handle map
  const mapEl = document.getElementById('map');
  if (data.location && data.location.latitude && data.location.longitude) {
    mapEl.style.display = 'block';
    try {
      // Initialize Leaflet map (idempotent)
      if (!window._whoami_map) {
        window._whoami_map = L.map('map').setView([data.location.latitude, data.location.longitude], 10);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          attribution: '&copy; OpenStreetMap contributors'
        }).addTo(window._whoami_map);
        window._whoami_marker = L.marker([data.location.latitude, data.location.longitude]).addTo(window._whoami_map);
      } else {
        window._whoami_map.setView([data.location.latitude, data.location.longitude], 10);
        window._whoami_marker.setLatLng([data.location.latitude, data.location.longitude]);
      }
    } catch (e) {
      console.warn('Map init failed', e);
    }
  } else {
    mapEl.style.display = 'none';
  }
}

function renderError(err) {
  card.innerHTML = `<div id="error">${err}</div>`;
}

function fetchWhoAmI() {
  card.innerHTML = '<div class="loading">Loading…</div>';
  tryFetchCandidates()
    .then(({ data, url }) => {
      renderData(data);
      console.log('whoami fetched from', url);
      if (hintEl) hintEl.style.display = 'none';
    })
    .catch(e => {
      console.error('Failed to fetch /api/whoami:', e);
      if (hintEl) hintEl.style.display = 'block';
      // Show helpful suggestions when running from file:// or when backend port differs
      const advice = (location && location.protocol === 'file:')
        ? 'Open this page via http://localhost:3000 (or run the Docker image) instead of opening the file directly.'
        : 'Ensure the backend is running (try: docker run -p 3000:3000 whoami-prod) and that the API is reachable.';
      renderError(`Failed to fetch — ${e.message}. ${advice}`);
    });
}

// Dark/Light mode toggle
function setMode(mode) {
  document.body.classList.toggle('dark', mode === 'dark');
  localStorage.setItem('whoami-mode', mode);
}

toggleBtn.addEventListener('click', () => {
  const isDark = document.body.classList.toggle('dark');
  localStorage.setItem('whoami-mode', isDark ? 'dark' : 'light');
});

// On load, set mode from localStorage
(function() {
  const mode = localStorage.getItem('whoami-mode') || 'light';
  setMode(mode);
  fetchWhoAmI();
})();
