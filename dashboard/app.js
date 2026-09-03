const fallbackRoutes = [
  ['/v1/maps/search', 'Business search', '$0.010'],
  ['/v1/maps/reviews', 'Place discovery', '$0.020'],
  ['/v1/maps/nearby', 'Nearby places', '$0.015'],
  ['/v1/token/analyze', 'Token risk analysis', '$0.020'],
  ['/v1/token/holders', 'Holder distribution', '$0.030'],
  ['/v1/token/price', 'Real-time token price', '$0.005'],
  ['/v1/web/scrape', 'Structured web content', '$0.010'],
  ['/v1/web/screenshot', 'Website capture', '$0.025'],
  ['/v1/email/validate', 'Email verification', '$0.005'],
  ['/v1/data/weather', 'Weather forecast', '$0.008']
];

const list = document.getElementById('apiList');
const toast = document.getElementById('toast');
let toastTimer;

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
  }[character]));
}

function renderApis(routes) {
  list.innerHTML = routes.map(([path, description, price]) => `
    <div class="api-row" data-path="${path}">
      <span class="method">GET</span>
      <div><div class="api-name">${escapeHtml(path)}</div><div class="api-desc">${escapeHtml(description)}</div></div>
      <span class="api-price">${price}</span><span class="api-status">ONLINE</span>
    </div>`).join('');
  document.querySelectorAll('.api-row').forEach((row) => row.addEventListener('click', () => openInspector(row.dataset.path, row.querySelector('.api-price').textContent)));
}

function openInspector(path, price) {
  document.getElementById('inspectorRoute').textContent = `GET ${path}`;
  document.getElementById('inspectorPrice').textContent = `${price} USDC`;
  document.getElementById('inspectorBackdrop').classList.add('open');
}

function closeInspector() {
  document.getElementById('inspectorBackdrop').classList.remove('open');
}

async function loadCatalog() {
  try {
    const response = await fetch('/openapi.json', { headers: { Accept: 'application/json' } });
    if (!response.ok) throw new Error('openapi unavailable');
    const schema = await response.json();
    const discoveredRoutes = Object.entries(schema.paths || {})
      .filter(([, operations]) => operations.get)
      .map(([path, operations]) => [
        path,
        operations.get.summary || operations.get.description || 'Live API route',
        path.startsWith('/v1/') ? '$0.010' : 'free'
      ]);
    if (discoveredRoutes.length) renderApis(discoveredRoutes);
    return discoveredRoutes.length;
  } catch (error) {
    renderApis(fallbackRoutes);
    return 0;
  }
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2800);
}

async function checkHealth() {
  const label = document.getElementById('syncLabel');
  try {
    const response = await fetch('/health', { headers: { Accept: 'application/json' } });
    if (!response.ok) throw new Error('health check failed');
    const data = await response.json();
    label.textContent = data.mode === 'simulated' ? 'Synced · local mode' : 'Synced';
  } catch (error) {
    label.textContent = 'Demo data · API offline';
  }
}

document.getElementById('refreshButton').addEventListener('click', () => {
  loadCatalog().then((count) => {
    checkHealth();
    showToast(count ? `Catalog refreshed · ${count} live routes` : 'Catalog refreshed · demo data');
  });
});
document.getElementById('walletButton').addEventListener('click', (event) => {
  event.currentTarget.textContent = '0x71...9c2a';
  showToast('Wallet preview connected · simulated mode');
});
document.getElementById('driftButton').addEventListener('click', () => {
  openInspector('/v1/storage/drift', '$0.010');
  showToast('Drift inspector opened');
});
document.getElementById('inspectorClose').addEventListener('click', closeInspector);
document.getElementById('inspectorBackdrop').addEventListener('click', (event) => {
  if (event.target.id === 'inspectorBackdrop') closeInspector();
});
document.getElementById('runButton').addEventListener('click', () => {
  closeInspector();
  showToast('Simulated request queued · payment handshake ready');
});
document.getElementById('menuButton').addEventListener('click', () => {
  document.getElementById('sidebar').classList.toggle('open');
});
document.querySelectorAll('.nav-item').forEach((item) => item.addEventListener('click', () => document.getElementById('sidebar').classList.remove('open')));

function updateClock() {
  document.getElementById('snapshotTime').textContent = new Date().toLocaleTimeString([], { hour12: false });
}

function animateTelemetry() {
  const volume = document.getElementById('requestVolume');
  const current = Number(volume.textContent.replace(/,/g, '')) || 18420;
  volume.textContent = (current + Math.floor(Math.random() * 4)).toLocaleString();
  document.querySelectorAll('.bar-chart i').forEach((bar) => {
    bar.style.height = `${38 + Math.floor(Math.random() * 58)}%`;
  });
}

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') closeInspector();
});

loadCatalog();
checkHealth();
updateClock();
setInterval(updateClock, 1000);
setInterval(animateTelemetry, 3500);
