const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://localhost:3000/api/whoami'
  : '/api/whoami';

const card = document.getElementById('card');
const toggleBtn = document.getElementById('toggle-mode');

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
  fetch(API_URL)
    .then(r => {
      if (!r.ok) throw new Error('Failed to fetch');
      return r.json();
    })
    .then(renderData)
    .catch(e => renderError(e.message));
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
