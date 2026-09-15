/* AETHERIUS API — same pattern as the working dashboard.
   Falls back from custom base → same-origin → public VM. */

const VM_BASE = 'https://34-156-149-38.sslip.io/aetherapi';

function store(k, v) {
  try {
    if (v === undefined) return localStorage.getItem(k) || '';
    if (v === null) localStorage.removeItem(k);
    else localStorage.setItem(k, v);
  } catch (_) { /* noop */ }
  return '';
}

export function getApiBase() {
  const custom = store('aex_base').replace(/\/+$/, '');
  return custom || VM_BASE;
}

export async function apiFetch(path, { paid = false, params = {} } = {}) {
  const base = getApiBase();
  const bases = base ? [base, VM_BASE] : [VM_BASE];
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => { if (v !== '' && v != null) qs.append(k, v); });
  const query = qs.toString();
  let lastErr;
  for (const b of bases) {
    try {
      const url = b + path + (query ? '?' + query : '');
      const r = await fetch(url, paid ? { headers: { 'X-PAYMENT': 'dashboard-demo' } } : {});
      if (r.ok) return { data: await r.json(), status: r.status, base: b };
      // try next base on 404/cors
      if (r.status < 500) {
        try { return { data: await r.json(), status: r.status, base: b }; } catch (_) { /* fallthrough */ }
      }
    } catch (e) { lastErr = e; }
  }
  throw lastErr || new Error('network');
}

/* Endpoint specs — mirrors the dashboard SPECS exactly */
export const SPECS = {
  '/v1/maps/search':   [{n:'q',r:1},{n:'location',r:0,d:'Mexico'}],
  '/v1/maps/reviews':  [{n:'place_name',r:1}],
  '/v1/maps/nearby':   [{n:'lat',r:1,t:'n',d:'19.43'},{n:'lon',r:1,t:'n',d:'-99.13'},{n:'radius',r:0,t:'n',d:'1000'},{n:'category',r:0}],
  '/v1/token/analyze': [{n:'address',r:1,d:'0x833589fcd6edb6e08f4c7c32d4f71b54bda02913'},{n:'chain',r:0,d:'base'}],
  '/v1/token/holders': [{n:'address',r:1},{n:'chain',r:0,d:'ethereum'}],
  '/v1/token/price':   [{n:'address',r:1,d:'0x833589fcd6edb6e08f4c7c32d4f71b54bda02913'},{n:'chain',r:0,d:'base'}],
  '/v1/web/scrape':    [{n:'url',r:1,d:'https://example.com'}],
  '/v1/web/screenshot':[{n:'url',r:1,d:'https://example.com'},{n:'width',r:0,t:'n',d:'1280'},{n:'height',r:0,t:'n',d:'720'}],
  '/v1/email/validate':[{n:'email',r:1,d:'user@example.com'}],
  '/v1/data/weather':  [{n:'lat',r:1,t:'n',d:'19.43'},{n:'lon',r:1,t:'n',d:'-99.13'}],
  '/v1/storage/drift': [{n:'chain',r:0,d:'base'},{n:'layers',r:0,t:'n',d:'2'}],
  '/v1/defi/yields':   [{n:'chain',r:0},{n:'project',r:0},{n:'limit',r:0,t:'n',d:'20'}],
  '/v1/defi/stablecoins': [{n:'limit',r:0,t:'n',d:'30'}],
  '/v1/defi/fees':     [{n:'limit',r:0,t:'n',d:'20'}],
  '/v1/defi/tvl':      [{n:'chain',r:0},{n:'limit',r:0,t:'n',d:'20'}],
  '/v1/forex/rates':   [{n:'base',r:0,d:'USD'},{n:'symbols',r:0,d:'EUR,MXN'}],
  '/v1/news/hackernews': [{n:'kind',r:0,d:'top'},{n:'limit',r:0,t:'n',d:'10'}],
  '/v1/data/forecast': [{n:'lat',r:1,t:'n',d:'19.43'},{n:'lon',r:1,t:'n',d:'-99.13'},{n:'days',r:0,t:'n',d:'7'}],
  '/v1/data/airquality': [{n:'lat',r:1,t:'n',d:'19.43'},{n:'lon',r:1,t:'n',d:'-99.13'}],
  '/v1/data/define':   [{n:'word',r:1,d:'computer'},{n:'lang',r:0,d:'en'}],
  '/v1/defi/protocols': [{n:'chain',r:0},{n:'limit',r:0,t:'n',d:'20'}],
  '/v1/defi/dexs':     [{n:'limit',r:0,t:'n',d:'20'}],
  '/v1/token/gas':     [{n:'chain',r:0,d:'ethereum'}],
  '/v1/token/global':  [],
  '/v1/token/balance': [{n:'address',r:1,d:'0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045'},{n:'chain',r:0,d:'ethereum'}],
  '/v1/token/transactions': [{n:'address',r:1,d:'0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045'},{n:'limit',r:0,t:'n',d:'5'},{n:'chain',r:0,d:'ethereum'}],
  '/v1/forex/convert': [{n:'from',r:0,d:'USD'},{n:'to',r:0,d:'MXN'},{n:'amount',r:0,t:'n',d:'100'}],
  '/v1/crypto/market': [],
  '/v1/crypto/fear-greed': [{n:'limit',r:0,t:'n',d:'30'}],
  '/v1/crypto/trending': [],
  '/v1/crypto/dominance': [],
  '/v1/web/dns':       [{n:'name',r:1,d:'example.com'},{n:'type',r:0,d:'A'}],
  '/v1/web/whois':     [{n:'domain',r:1}],
  '/v1/web/ssl':       [{n:'domain',r:1}],
  '/v1/web/headers':   [{n:'url',r:1}],
  '/v1/data/ip':       [{n:'ip',r:0,d:'me'}],
  '/v1/data/hash':     [{n:'text',r:1},{n:'algo',r:0,d:'sha256'}],
  '/v1/data/translate': [{n:'text',r:1},{n:'source',r:0,d:'auto'},{n:'target',r:0,d:'es'}],
  '/v1/data/summarize': [{n:'text',r:1},{n:'sentences',r:0,t:'n',d:'3'}],
  /* QuantumXBrain — FREE */
  '/v1/x402/brain':    [{n:'intent',r:0,d:'defi'}],
  '/v1/x402/intelligence': [],
  '/v1/x402/market-pulse': [],
  '/v1/x402/wallet-intel/{address}': [{n:'address',r:1,d:'0x677B483128D0399bCD0A5AB36eE990C0246d7f61'}],
  '/v1/x402/sentiment': [],
  '/v1/x402/compliance': [{n:'address',r:1,d:'0x677B483128D0399bCD0A5AB36eE990C0246d7f61'}],
  '/v1/x402/gas-intelligence': [],
  '/v1/x402/token-discovery': [],
  '/v1/x402/whale-intelligence': [],
  '/v1/x402/network-health': [],
  '/v1/x402/stablecoin-flow': [],
  '/v1/x402/defi-yield': [],
  '/v1/x402/tx-patterns': [],
  '/v1/x402/leaderboard': [],
  '/v1/x402/search-intel': [{n:'q',r:1,d:'0x677B483128D0399bCD0A5AB36eE990C0246d7f61'}],
};

export const CATEGORIES = {
  'QuantumXBrain': { color: '#d946ef', icon: '⟐' },
  'Maps':      { color: '#a855f7', icon: '⊛' },
  'Token':     { color: '#ec4899', icon: '◈' },
  'DeFi':      { color: '#f59e0b', icon: '⟁' },
  'Web':       { color: '#0052FF', icon: '⊘' },
  'Data':      { color: '#00f0ff', icon: '⊞' },
  'News':      { color: '#22d3ee', icon: '◉' },
  'Forex':     { color: '#34d399', icon: '⟐' },
  'Crypto':    { color: '#f472b6', icon: '⟡' },
};

export function getCat(route) {
  if (route.includes('/x402/')) return 'QuantumXBrain';
  if (route.includes('/maps/')) return 'Maps';
  if (route.includes('/token/')) return 'Token';
  if (route.includes('/defi/')) return 'DeFi';
  if (route.includes('/web/')) return 'Web';
  if (route.includes('/data/')) return 'Data';
  if (route.includes('/news/')) return 'News';
  if (route.includes('/forex/')) return 'Forex';
  if (route.includes('/crypto/')) return 'Crypto';
  return 'Data';
}

export function fmtUptime(s) {
  s = Math.floor(s || 0);
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  return (d ? d + 'd ' : '') + (h ? h + 'h ' : '') + m + 'm';
}
