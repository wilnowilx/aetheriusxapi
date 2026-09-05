/* aetheriusxAPI control room — vanilla JS, no build step.
   Same-origin calls: works locally (uvicorn) and behind nginx (/aetherapi/). */
const $ = s => document.querySelector(s);

/* route -> [{name, required, type, def}] — mirrors main.py signatures */
const SPECS = {
  "/v1/maps/search":   [{n:"q",r:1},{n:"location",r:0,d:"Mexico"}],
  "/v1/maps/reviews":  [{n:"place_name",r:1}],
  "/v1/maps/nearby":   [{n:"lat",r:1,t:"n",d:"19.43"},{n:"lon",r:1,t:"n",d:"-99.13"},
                        {n:"radius",r:0,t:"n",d:"1000"},{n:"category",r:0}],
  "/v1/token/analyze": [{n:"address",r:1,d:"0x833589fcd6edb6e08f4c7c32d4f71b54bda02913"},{n:"chain",r:0,d:"base"}],
  "/v1/token/holders": [{n:"address",r:1},{n:"chain",r:0,d:"ethereum"}],
  "/v1/token/price":   [{n:"address",r:1,d:"0x833589fcd6edb6e08f4c7c32d4f71b54bda02913"},{n:"chain",r:0,d:"base"}],
  "/v1/web/scrape":    [{n:"url",r:1,d:"https://example.com"}],
  "/v1/web/screenshot":[{n:"url",r:1,d:"https://example.com"},{n:"width",r:0,t:"n",d:"1280"},{n:"height",r:0,t:"n",d:"720"}],
  "/v1/email/validate":[{n:"email",r:1,d:"user@example.com"}],
  "/v1/data/weather":  [{n:"lat",r:1,t:"n",d:"19.43"},{n:"lon",r:1,t:"n",d:"-99.13"}],
  "/v1/storage/drift": [{n:"chain",r:0,d:"base"},{n:"layers",r:0,t:"n",d:"2"}],
  "/v1/defi/yields": [{n:"chain",r:0},{n:"project",r:0},{n:"limit",r:0,t:"n",d:"20"}],
  "/v1/defi/stablecoins": [{n:"limit",r:0,t:"n",d:"30"}],
  "/v1/defi/fees": [{n:"limit",r:0,t:"n",d:"20"}],
  "/v1/defi/tvl": [{n:"chain",r:0},{n:"limit",r:0,t:"n",d:"20"}],
  "/v1/forex/rates": [{n:"base",r:0,d:"USD"},{n:"symbols",r:0,d:"EUR,MXN"}],
  "/v1/news/hackernews": [{n:"kind",r:0,d:"top"},{n:"limit",r:0,t:"n",d:"10"}],
  "/v1/data/forecast": [{n:"lat",r:1,t:"n",d:"19.43"},{n:"lon",r:1,t:"n",d:"-99.13"},{n:"days",r:0,t:"n",d:"7"}],
  "/v1/data/airquality": [{n:"lat",r:1,t:"n",d:"19.43"},{n:"lon",r:1,t:"n",d:"-99.13"}],
  "/v1/data/define": [{n:"word",r:1,d:"computer"},{n:"lang",r:0,d:"en"}],
  "/v1/defi/protocols": [{n:"chain",r:0},{n:"limit",r:0,t:"n",d:"20"}],
  "/v1/defi/dexs": [{n:"limit",r:0,t:"n",d:"20"}],
  "/v1/defi/stablecoinchains": [{n:"limit",r:0,t:"n",d:"20"}],
  "/v1/token/prices": [{n:"addresses",r:1,d:"0x833589fcd6edb6e08f4c7c32d4f71b54bda02913"},{n:"chain",r:0,d:"base"}],
  "/v1/token/gas": [{n:"chain",r:0,d:"ethereum"}],
  "/v1/maps/reverse": [{n:"lat",r:1,t:"n",d:"19.43"},{n:"lon",r:1,t:"n",d:"-99.13"}],
  "/v1/forex/history": [{n:"start",r:1,d:"2026-01-01"},{n:"end",r:1,d:"2026-02-01"},{n:"base",r:0,d:"USD"},{n:"symbols",r:0}],
  "/v1/news/hn-item": [{n:"id",r:1,t:"n",d:"49546753"}],
  "/v1/news/hn-user": [{n:"username",r:1,d:"pg"}],
  "/v1/web/geoip": [{n:"ip",r:1,d:"8.8.8.8"}],
  "/v1/data/elevation": [{n:"lat",r:1,t:"n",d:"19.43"},{n:"lon",r:1,t:"n",d:"-99.13"}],
  "/v1/data/words": [{n:"word",r:1,d:"happy"},{n:"rel",r:0,d:"syn"}],
  "/v1/maps/geocode": [{n:"q",r:1,d:"Eiffel Tower"},{n:"limit",r:0,t:"n",d:"3"}],
  "/v1/token/global": [],
  "/v1/token/balance": [{n:"address",r:1,d:"0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045"},{n:"chain",r:0,d:"ethereum"}],
  "/v1/token/transactions": [{n:"address",r:1,d:"0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045"},{n:"limit",r:0,t:"n",d:"5"},{n:"chain",r:0,d:"ethereum"}],
  "/v1/maps/geocode": [{n:"q",r:1,d:"Eiffel Tower"},{n:"limit",r:0,t:"n",d:"3"},{n:"lat",r:0,t:"n",d:"48.85"},{n:"lon",r:0,t:"n",d:"2.35"}],
  "/v1/defi/stablecoin-history": [{n:"chain",r:0,d:"ethereum"},{n:"limit",r:0,t:"n",d:"5"}],
  "/v1/forex/convert": [{n:"from",r:0,d:"USD"},{n:"to",r:0,d:"MXN"},{n:"amount",r:0,t:"n",d:"100"}],
  "/v1/news/hn-feed": [{n:"kind",r:0,d:"ask"},{n:"limit",r:0,t:"n",d:"5"}],
  "/v1/web/dns": [{n:"name",r:1,d:"example.com"},{n:"type",r:0,d:"A"}],
  "/v1/crypto/market": [],
  "/v1/crypto/fear-greed": [{n:"limit",r:0,t:"n",d:"30"}],
  "/v1/crypto/trending": [],
  "/v1/crypto/ohlcv": [{n:"coin",r:0,d:"bitcoin"},{n:"vs",r:0,d:"usd"},{n:"days",r:0,t:"n",d:"7"}],
  "/v1/crypto/dominance": [],
  "/v1/web/whois": [{n:"domain",r:1}],
  "/v1/web/headers": [{n:"url",r:1}],
  "/v1/web/ssl": [{n:"domain",r:1}],
  "/v1/data/ip": [{n:"ip",r:0,d:"me"}],
  "/v1/data/ua": [{n:"user_agent",r:1}],
  "/v1/data/hash": [{n:"text",r:1},{n:"algo",r:0,d:"sha256"}],
  "/v1/data/uuid": [{n:"count",r:0,t:"n",d:"1"}],
  "/v1/data/qrcode": [{n:"text",r:1},{n:"size",r:0,t:"n",d:"200"}],
  "/v1/news/reddit": [{n:"subreddit",r:0,d:"cryptocurrency"},{n:"sort",r:0,d:"hot"},{n:"limit",r:0,t:"n",d:"25"}],
  "/v1/news/devto": [{n:"tag",r:0,d:"javascript"},{n:"per_page",r:0,t:"n",d:"20"}],
  "/v1/defi/impermanent-loss": [{n:"entry_price",r:1,t:"n"},{n:"current_price",r:1,t:"n"}],
  "/v1/defi/staking-apy": [],
  "/v1/token/nft": [{n:"contract",r:1},{n:"token_id",r:0,d:"1"},{n:"chain",r:0,d:"ethereum"}],
  "/v1/data/translate": [{n:"text",r:1},{n:"source",r:0,d:"auto"},{n:"target",r:0,d:"es"}],
  "/v1/data/summarize": [{n:"text",r:1},{n:"sentences",r:0,t:"n",d:"3"}],
};
const FALLBACK_META = {
  "/v1/maps/search":"$0.01/call - Business search via OpenStreetMap",
  "/v1/maps/reviews":"$0.02/call - Place lookup via OpenStreetMap",
  "/v1/maps/nearby":"$0.015/call - Nearby places by coordinates",
  "/v1/token/analyze":"$0.02/call - Token contract analysis",
  "/v1/token/holders":"$0.03/call - Holder distribution (key-gated)",
  "/v1/token/price":"$0.005/call - Real-time token price",
  "/v1/web/scrape":"$0.01/call - Web scraper",
  "/v1/web/screenshot":"$0.025/call - Screenshot URL",
  "/v1/email/validate":"$0.005/call - Email validation",
  "/v1/data/weather":"$0.008/call - Current weather",
  "/v1/storage/drift":"$0.02/call - Cross-RPC slot drift",
  "/v1/defi/yields":"$0.02/call - Top yield pools",
  "/v1/defi/stablecoins":"$0.01/call - Stablecoin list",
  "/v1/defi/fees":"$0.015/call - Protocol fees",
  "/v1/defi/tvl":"$0.01/call - Chain TVLs",
  "/v1/forex/rates":"$0.008/call - Fiat FX rates",
  "/v1/news/hackernews":"$0.01/call - HN stories",
  "/v1/data/forecast":"$0.008/call - 7-day forecast",
  "/v1/data/airquality":"$0.008/call - Air quality",
  "/v1/data/define":"$0.005/call - Definitions",
  "/v1/defi/protocols":"$0.01/call - Protocols by TVL",
  "/v1/defi/dexs":"$0.015/call - DEX volumes",
  "/v1/defi/stablecoinchains":"$0.01/call - Stables by chain",
  "/v1/token/prices":"$0.01/call - Batch prices",
  "/v1/token/gas":"$0.01/call - Gas oracle",
  "/v1/maps/reverse":"$0.01/call - Coords to address",
  "/v1/forex/history":"$0.01/call - Historical FX",
  "/v1/news/hn-item":"$0.005/call - HN item",
  "/v1/news/hn-user":"$0.005/call - HN user",
  "/v1/web/geoip":"$0.008/call - IP geolocation",
  "/v1/data/elevation":"$0.005/call - Elevation",
  "/v1/data/words":"$0.005/call - Word relations",
  "/v1/maps/geocode":"$0.01/call - Forward geocode",
  "/v1/token/global":"$0.01/call - Global stats",
  "/v1/token/balance":"$0.01/call - ETH balance",
  "/v1/token/transactions":"$0.02/call - Wallet txs",
  "/v1/defi/stablecoin-history":"$0.01/call - Stable history",
  "/v1/forex/convert":"$0.008/call - Convert",
  "/v1/news/hn-feed":"$0.01/call - Ask/Show/Jobs",
  "/v1/web/dns":"$0.005/call - DNS lookup",
  "/v1/crypto/market":"$0.01/call - Global crypto market",
  "/v1/crypto/fear-greed":"$0.005/call - Fear & Greed",
  "/v1/crypto/trending":"$0.01/call - Trending coins",
  "/v1/crypto/ohlcv":"$0.015/call - OHLCV candles",
  "/v1/crypto/dominance":"$0.008/call - Crypto dominance",
  "/v1/web/whois":"$0.01/call - WHOIS lookup",
  "/v1/web/headers":"$0.005/call - HTTP headers",
  "/v1/web/ssl":"$0.008/call - SSL cert info",
  "/v1/data/ip":"$0.005/call - IP geolocation",
  "/v1/data/ua":"$0.003/call - User-Agent parser",
  "/v1/data/hash":"$0.002/call - Hash generator",
  "/v1/data/uuid":"$0.001/call - UUID generator",
  "/v1/data/qrcode":"$0.005/call - QR code",
  "/v1/news/reddit":"$0.01/call - Reddit posts",
  "/v1/news/devto":"$0.008/call - Dev.to articles",
  "/v1/defi/impermanent-loss":"$0.01/call - IL calculator",
  "/v1/defi/staking-apy":"$0.01/call - Staking APY",
  "/v1/token/nft":"$0.02/call - NFT metadata",
  "/v1/data/translate":"$0.01/call - Text translation",
  "/v1/data/summarize":"$0.015/call - Text summarizer",
};

const state = { health:null, selected:null };

/* Backend base URL: same-origin by default (local uvicorn / VM proxy).
   Override via the Backend bar (stored in localStorage) when the page is
   served elsewhere (e.g. GitHub Pages) — requires CORS on the backend. */
function store(k, v){
  try{
    if(v === undefined) return localStorage.getItem(k) || "";
    if(v === null) localStorage.removeItem(k); else localStorage.setItem(k, v);
  }catch(e){ if(v === undefined) return ""; }
  return "";
}
function api(path){
  const base = store("aex_base").replace(/\/+$/, "");
  return base ? base + path : ".." + path;
}
/* auto-fallback: same-origin first, then the public VM over HTTPS.
   Dashboard shows REAL data everywhere with zero config. */
const VM_BASE = "https://34-156-149-38.sslip.io/aetherapi";
async function getJSON(path){
  const custom = store("aex_base").replace(/\/+$/, "");
  const bases = custom ? [custom, "..", VM_BASE] : ["..", VM_BASE];
  let err = null;
  for(const b of bases){
    try{
      const url = b === ".." ? ".." + path : b + path;
      const r = await fetch(url);
      if(r.ok) return {data: await r.json(), base: b === ".." ? "same origin" : b};
    }catch(e){ err = e; }
  }
  throw err || 0;
}
function refreshBaseState(){
  const b = store("aex_base");
  $("#backendState").textContent = b ? "→ " + b : "→ same origin";
  try{ $("#backendUrl").value = b; }catch(e){}
}

function splitMeta(s){ const i=s.indexOf(" - "); return i<0?[s,""]:[s.slice(0,i),s.slice(i+3)]; }

async function loadHealth(){
  try{
    const {data: h, base: usedBase} = await getJSON("/health");
    state.health = h; state.base = usedBase;
    $("#backendState").textContent = "→ " + usedBase;
    $("#netBadge").innerHTML = `<span class="dot on"></span>${h.network} · ${h.mode}`;
    $("#hService").textContent = h.service;
    $("#hVersion").textContent = h.version;
    $("#hMode").textContent = h.mode;
    $("#hNetwork").textContent = h.network;
    $("#hWallet").textContent = h.wallet.slice(0,10)+"…"+h.wallet.slice(-6);
    $("#hWallet").title = h.wallet;
    $("#hEndpoints").textContent = Object.keys(h.endpoints).length;
    renderCatalog(h.endpoints);
    try{ var ch = document.querySelector(".catalog h2"); if(ch) ch.innerHTML = 'API Catalog <span class="tag">' + Object.keys(h.endpoints).length + ' live</span>'; }catch(_){}
    try{
      var secure = window.location.protocol === "https:";
      var sp = $("#secPill");
      if(sp){ sp.textContent = secure ? "🔒 Secure" : "⚠ HTTP"; sp.className = "secpill " + (secure ? "ok" : "warn"); sp.title = secure ? "TLS encrypted connection" : "Unencrypted connection — use the https host"; }
      var av = $("#appVer"); if(av) av.textContent = "v" + h.version;
    }catch(_){}
  }catch(e){
    const why = (e && e.message) || e || "network";
    $("#netBadge").innerHTML = `<span class="dot"></span>offline`;
    $("#netBadge").title = "health fetch failed: " + why;
    const eps = FALLBACK_META;
    $("#hEndpoints").textContent = Object.keys(eps).length;
    renderCatalog(eps);
    const act = $("#activity");
    if(act) act.innerHTML = `<li class="muted">Backend unreachable (${why}). Set Backend URL ⚙ or check VM.</li>`;
  }
}

const WIKI_DB = {
  "/v1/maps/search":"Searches businesses by keyword and location via OpenStreetMap. Returns name, address, distance. Good for location-aware agents.",
  "/v1/maps/reviews":"Looks up a specific place by name. Returns rating, type, coordinates. Useful for business research agents.",
  "/v1/maps/nearby":"Finds nearby places by lat/lon coordinates. Filter by radius and category. Perfect for navigation agents.",
  "/v1/maps/reverse":"Reverse geocoding: converts lat/lon coordinates to a human-readable address. Used by mapping agents.",
  "/v1/maps/geocode":"Forward geocoding: converts a place name or address to coordinates. Essential for location-based queries.",
  "/v1/token/analyze":"Analyzes an ERC-20 token contract. Returns name, symbol, decimals, total supply. Used by DeFi agents.",
  "/v1/token/holders":"Shows the top holders of a token. Returns wallet addresses and balances. Key for whale-watching agents.",
  "/v1/token/price":"Real-time token price in USD. Supports Base, Ethereum, and other chains. Used by trading agents.",
  "/v1/token/prices":"Batch token prices for multiple addresses in one call. Saves gas and latency for portfolio agents.",
  "/v1/token/gas":"Current gas price oracle for any EVM chain. Helps agents estimate transaction costs.",
  "/v1/token/global":"Global crypto market stats: total market cap, BTC dominance, total volume. Used by macro agents.",
  "/v1/token/balance":"Reads ETH or ERC-20 balance for any wallet address on any supported chain.",
  "/v1/token/transactions":"Lists recent transactions for a wallet address. Returns hash, value, timestamps.",
  "/v1/web/scrape":"Scrapes any URL and returns the full HTML content. Powers content extraction agents.",
  "/v1/web/screenshot":"Takes a screenshot of any URL. Returns the image. Used by monitoring agents.",
  "/v1/web/geoip":"Geolocates an IP address. Returns country, city, ISP. Used by security and analytics agents.",
  "/v1/web/dns":"DNS lookup for any domain. Returns A, AAAA, MX, TXT records. Used by infrastructure agents.",
  "/v1/email/validate":"Validates email syntax, MX records, and disposable detection. Returns risk score and verdict.",
  "/v1/data/weather":"Current weather by coordinates. Returns temp, humidity, conditions. Used by logistics agents.",
  "/v1/data/forecast":"7-day weather forecast by coordinates. Returns daily high/low and conditions.",
  "/v1/data/airquality":"Air quality index by coordinates. Returns AQI and pollutant levels. Used by health agents.",
  "/v1/data/define":"Dictionary lookup: returns definition, part of speech, synonyms, antonyms. Used by NLP agents.",
  "/v1/data/elevation":"Returns elevation above sea level for any coordinates. Used by terrain and mapping agents.",
  "/v1/data/words":"Word relationship API: synonyms, antonyms, hypernyms. Powers language and NLP agents.",
  "/v1/storage/drift":"Measures cross-RPC slot drift on Base. Shows clock skew between different data layers.",
  "/v1/defi/yields":"Top yield farming pools across DeFi. Returns APY, TVL, chain. Used by yield-aggregator agents.",
  "/v1/defi/stablecoins":"Lists all stablecoins with market cap, peg info, and chain distribution.",
  "/v1/defi/fees":"Protocol fee revenue across DeFi. Returns 24h fees, 7d fees. Used by fundamental analysis agents.",
  "/v1/defi/tvl":"Total value locked by chain. Shows which chains are attracting the most capital.",
  "/v1/defi/protocols":"Lists DeFi protocols ranked by TVL. Returns name, chain, category.",
  "/v1/defi/dexs":"DEX trading volumes. Returns 24h volume, chain, type. Used by market analysis agents.",
  "/v1/defi/stablecoinchains":"Stablecoin distribution across chains. Shows where stablecoin liquidity sits.",
  "/v1/defi/stablecoin-history":"Historical stablecoin market cap data. Used by macro analysis agents.",
  "/v1/forex/rates":"Real-time fiat forex rates. Returns rates for any base currency pair.",
  "/v1/forex/history":"Historical forex rates for a date range. Used by financial analysis agents.",
  "/v1/forex/convert":"Converts an amount between any two currencies using live rates.",
  "/v1/news/hackernews":"Hacker News front page. Returns top/new/best stories with scores and comment counts.",
  "/v1/news/hn-item":"Fetches any HN item by ID. Returns title, URL, score, comments.",
  "/v1/news/hn-user":"Fetches any HN user profile. Returns karma, about, submission count.",
  "/v1/news/hn-feed":"HN Ask/Show/Jobs feeds. Returns curated content from specific HN categories.",
  "/v1/crypto/market": { name: "Crypto Market", category: "Crypto", description: "Global crypto market data - total MC, volume, BTC dominance", params: [], response: "{ total_market_cap_usd, total_volume_usd, btc_dominance, eth_dominance, active_cryptos }", price: "$0.01" },
  "/v1/crypto/fear-greed": { name: "Fear & Greed Index", category: "Crypto", description: "Crypto Fear & Greed Index - current value and history", params: [{ name: "limit", type: "int", default: 30, description: "Data points" }], response: "{ current_value, current_label, history[] }", price: "$0.005" },
  "/v1/crypto/trending": { name: "Trending Coins", category: "Crypto", description: "Trending coins on CoinGecko", params: [], response: "{ trending[] }", price: "$0.01" },
  "/v1/crypto/ohlcv": { name: "OHLCV Candles", category: "Crypto", description: "OHLCV candlestick data for any coin pair", params: [{ name: "coin", type: "string", default: "bitcoin" }, { name: "vs", type: "string", default: "usd" }, { name: "days", type: "int", default: 7 }], response: "{ coin, candles[] }", price: "$0.015" },
  "/v1/crypto/dominance": { name: "Crypto Dominance", category: "Crypto", description: "Crypto dominance indices - BTC, ETH, and altcoin shares", params: [], response: "{ btc, eth, usdt, bnb, sol, others }", price: "$0.008" },
  "/v1/web/whois": { name: "WHOIS Lookup", category: "Web", description: "Domain WHOIS lookup - registrar, dates, nameservers", params: [{ name: "domain", type: "string", required: true }], response: "{ domain, status, registration, expiration, nameservers[] }", price: "$0.01" },
  "/v1/web/headers": { name: "HTTP Headers", category: "Web", description: "HTTP response headers checker for any URL", params: [{ name: "url", type: "string", required: true }], response: "{ url, status_code, headers, content_type, server, cors }", price: "$0.005" },
  "/v1/web/ssl": { name: "SSL Certificate", category: "Web", description: "SSL certificate info - issuer, expiry, chain", params: [{ name: "domain", type: "string", required: true }], response: "{ domain, subject, issuer_org, not_before, not_after, san[] }", price: "$0.008" },
  "/v1/data/ip": { name: "IP Geolocation", category: "Data", description: "IP address geolocation - city, country, coordinates", params: [{ name: "ip", type: "string", default: "me" }], response: "{ ip, city, region, country, lat, lon, org, timezone }", price: "$0.005" },
  "/v1/data/ua": { name: "User-Agent Parser", category: "Data", description: "User-Agent parser - browser, OS, device type", params: [{ name: "user_agent", type: "string", required: true }], response: "{ user_agent, browser, os, device }", price: "$0.003" },
  "/v1/data/hash": { name: "Hash Generator", category: "Data", description: "Hash generator - MD5, SHA1, SHA256, SHA512", params: [{ name: "text", type: "string", required: true }, { name: "algo", type: "string", default: "sha256" }], response: "{ text, algorithm, hash }", price: "$0.002" },
  "/v1/data/uuid": { name: "UUID Generator", category: "Data", description: "UUID v4 generator", params: [{ name: "count", type: "int", default: 1 }], response: "{ uuids[], count }", price: "$0.001" },
  "/v1/data/qrcode": { name: "QR Code Generator", category: "Data", description: "QR code generator as data URL", params: [{ name: "text", type: "string", required: true }, { name: "size", type: "int", default: 200 }], response: "{ text, data_url, qr_url }", price: "$0.005" },
  "/v1/news/reddit": { name: "Reddit Posts", category: "News", description: "Reddit posts from any subreddit", params: [{ name: "subreddit", type: "string", default: "cryptocurrency" }, { name: "sort", type: "string", default: "hot" }, { name: "limit", type: "int", default: 25 }], response: "{ subreddit, posts[] }", price: "$0.01" },
  "/v1/news/devto": { name: "Dev.to Articles", category: "News", description: "Dev.to articles - latest tech posts", params: [{ name: "tag", type: "string", default: "javascript" }, { name: "per_page", type: "int", default: 20 }], response: "{ articles[] }", price: "$0.008" },
  "/v1/defi/impermanent-loss": { name: "IL Calculator", category: "DeFi", description: "Impermanent loss calculator for LP positions", params: [{ name: "entry_price", type: "float", required: true }, { name: "current_price", type: "float", required: true }], response: "{ price_ratio, impermanent_loss_pct }", price: "$0.01" },
  "/v1/defi/staking-apy": { name: "Staking APY", category: "DeFi", description: "Staking APY tracker for major protocols", params: [], response: "{ pools[] }", price: "$0.01" },
  "/v1/token/nft": { name: "NFT Metadata", category: "Token", description: "NFT metadata fetcher - name, image, attributes", params: [{ name: "contract", type: "string", required: true }, { name: "token_id", type: "string", default: "1" }, { name: "chain", type: "string", default: "ethereum" }], response: "{ name, description, image_url, collection, attributes[] }", price: "$0.02" },
  "/v1/data/translate": { name: "Text Translation", category: "Data", description: "Text translation via free API", params: [{ name: "text", type: "string", required: true }, { name: "source", type: "string", default: "auto" }, { name: "target", type: "string", default: "es" }], response: "{ text, translation, confidence }", price: "$0.01" },
  "/v1/data/summarize": { name: "Text Summarizer", category: "Data", description: "Extractive text summarizer", params: [{ name: "text", type: "string", required: true }, { name: "sentences", type: "int", default: 3 }], response: "{ summary, original_sentences, summary_sentences }", price: "$0.015" }
};
function renderCatalog(eps){
  const box = $("#catalog"); box.innerHTML = "";
  const CARDINALS = {};
  const allRoutes = [...Object.keys(SPECS)];
  allRoutes.forEach(route=>{
    const [price,desc] = splitMeta(eps[route] || FALLBACK_META[route]);
    const wikiRaw = WIKI_DB[route];
    let wiki, wikiName;
    if(wikiRaw && typeof wikiRaw === "object"){
      wiki = wikiRaw.description;
      wikiName = wikiRaw.name || route;
      const cat = wikiRaw.category || "Other";
      CARDINALS[cat] = (CARDINALS[cat]||0) + 1;
    } else {
      wiki = wikiRaw || desc;
      wikiName = route;
    }
    const d = document.createElement("div");
    d.className = "ep"; d.dataset.route = route;
    if(wikiRaw && typeof wikiRaw === "object"){
      d.dataset.category = wikiRaw.category || "";
      d.innerHTML = `<div class="ep-row"><span class="method-badge">GET</span><code>${route}</code><span class="price">${wikiRaw.price || price}</span></div><div class="ep-info">${wikiRaw.description || desc}</div><div class="ep-wiki"><div class="wk-title">${wikiName} <span class="wk-cat">${wikiRaw.category||""}</span></div><div class="wk-desc">${wiki}</div>${wikiRaw.response ? '<div class="wk-resp"><code>'+wikiRaw.response+'</code></div>' : ''}</div>`;
    } else {
      d.innerHTML = `<div class="ep-row"><span class="method-badge">GET</span><code>${route}</code><span class="price">${price}</span></div><div class="ep-info">${desc}</div><div class="ep-wiki"><div class="wk-title">${route}</div><div class="wk-desc">${wiki}</div></div>`;
    }
    d.onclick = ()=>select(route);
    box.appendChild(d);
  });
}

function select(route){
  state.selected = route;
  document.querySelectorAll(".ep").forEach(e=>e.classList.toggle("sel", e.dataset.route===route));
  $("#expRoute").textContent = route;
  const f = $("#expForm"); f.innerHTML = "";
  SPECS[route].forEach(p=>{
    const lab = document.createElement("label");
    lab.textContent = p.n + (p.r ? " *" : "");
    const inp = document.createElement("input");
    inp.name = p.n; inp.value = p.d || "";
    if(p.t==="n"){ inp.type = "number"; inp.step = "any"; }
    if(p.r) inp.required = true;
    lab.appendChild(inp); f.appendChild(lab);
  });
  $("#btnPay").disabled = false; $("#btnFree").disabled = false;
}

function params(){
  const q = new URLSearchParams();
  new FormData($("#expForm")).forEach((v,k)=>{ if(v!=="") q.append(k,v); });
  return q.toString();
}

function fmtUptime(s){
  s = Math.floor(s || 0);
  const d = Math.floor(s/86400), h = Math.floor(s%86400/3600), m = Math.floor(s%3600/60);
  return (d ? d+"d " : "") + (h ? h+"h " : "") + m + "m";
}

/* REAL server-side telemetry — no simulated numbers anywhere. */
function tweenNum(el, to, fmt){
  if(!el) return;
  to = Number(to) || 0;
  const from = parseFloat(String(el.dataset.v || "0").replace(/[^0-9.\-]/g, "")) || 0;
  el.dataset.v = to;
  if(from === to){ el.textContent = fmt(to); return; }
  const t0 = performance.now(), dur = 650;
  el.classList.remove("flash"); void el.offsetWidth; el.classList.add("flash");
  (function step(t){
    const k = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - k, 3);
    el.textContent = fmt(from + (to - from) * e);
    if(k < 1) requestAnimationFrame(step);
  })(t0);
}
async function loadTelemetry(){
  try{
    const {data: t} = await getJSON("/v1/telemetry");
    const T = t.totals || {};
    $("#mUp").textContent = fmtUptime(t.uptime_s);
    const _int = v=>Math.round(v).toLocaleString();
    tweenNum($("#mCalls"), T.calls ?? 0, _int);
    tweenNum($("#mOk"), T.ok_200 ?? 0, _int);
    tweenNum($("#m402"), T.challenges_402 ?? 0, _int);
    tweenNum($("#mErr"), T.errors ?? 0, _int);
    tweenNum($("#mVol"), T.volume_usdc ?? 0, v=>"$" + v.toFixed(4) + " USDC");
    tweenNum($("#mWal"), t.wallets_seen ?? 0, _int);
    if(T.avg_latency_ms != null) tweenNum($("#mAvg"), T.avg_latency_ms, v=>v.toFixed(1) + " ms");
    else { const _m = $("#mAvg"); if(_m) _m.textContent = "—"; }
    const bars = $("#latBars"); bars.innerHTML = "";
    const samples = t.recent_latency_ms || [];
    const mx = Math.max(...samples, 1);
    samples.forEach(v=>{
      const i = document.createElement("i");
      i.style.height = Math.max(8, Math.round(v/mx*100))+"%"; i.title = v+" ms";
      bars.appendChild(i);
    });
    const ul = $("#activity"); ul.innerHTML = "";
    const evs = t.recent_events || [];
    if(!evs.length) ul.innerHTML = `<li class="muted">No API calls recorded yet — run the explorer.</li>`;
    evs.slice(0,20).forEach(e=>{
      const li = document.createElement("li");
      li.innerHTML = `<b>${e.status}</b> ${e.t} · GET ${e.route} · ${e.latency_ms} ms`;
      ul.appendChild(li);
    });
  }catch(e){ /* telemetry unreachable — explorer still works */ }
}

function escH(s){ return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;"); }
function hlJSON(src){
  return escH(src).replace(/("(\\u[0-9a-fA-F]{4}|\\[^]|[^"\\])*")(\s*:)?|\b(true|false|null)\b|-?\d+(\.\d+)?([eE][+-]?\d+)?/g, function(m, str, _e, key, bool, num){
    if(str) return key ? '<span class="jk">' + str + '</span>:' : '<span class="js">' + str + '</span>';
    if(bool) return '<span class="jb">' + bool + '</span>';
    if(num) return '<span class="jn">' + num + '</span>';
    return m;
  });
}
function copyResult(){
  const el = document.getElementById("resultBox");
  const t = el ? el.innerText : "";
  if(navigator.clipboard) navigator.clipboard.writeText(t).catch(function(){});
}
async function execute(paid){
  if(!state.selected) return;
  const route = state.selected;
  const url = api(route) + "?" + params();
  $("#resultMeta").textContent = (paid?"paying → ":"no payment → ") + url;
  $("#resultBox").textContent = "…";
  const t0 = performance.now();
  try{
    const headers = paid ? {"X-PAYMENT":"dashboard-demo"} : {};
    const r = await fetch(url, {headers});
    const ms = performance.now()-t0;
    let body; try{ body = await r.json(); }catch(e){ body = await r.text(); }
    loadTelemetry();
    const cls = r.status===200 ? "ok" : (r.status===402 ? "warn" : "bad");
    $("#resultMeta").innerHTML = `HTTP <b class="${cls}">${r.status}</b> · ${Math.round(ms)} ms` +
      (r.headers.get("X-PAYMENT-SETTLED") ? ` · settled: ${r.headers.get("X-PAYMENT-SETTLED")}` : "");
    const pretty = typeof body === "string" ? body : JSON.stringify(body,null,2);
    $("#resultBox").innerHTML = hlJSON(pretty);
    const mt = $("#resultMeta");
    if(mt) mt.innerHTML += ` · <button class="copybtn" onclick="copyResult()">⧉ copy</button>`;
  }catch(e){
    loadTelemetry();
    $("#resultMeta").innerHTML = `<b class="bad">network error</b>`;
    $("#resultBox").textContent = String(e);
  }
}

async function probeDrift(){
  const box = $("#driftBody");
  try{ Array.prototype.forEach.call(box.parentElement.querySelectorAll("pre"), function(p){ if(p.textContent.indexOf("ingress") >= 0) p.remove(); }); }catch(_){}
  try{
    const {data: body} = await getJSON("/v1/storage/drift/sample?chain=base");
    box.innerHTML = `<p><b class="ok">LIVE</b> <span class="muted">${body.chain} slot ${body.slot} via ${body.layer} · ${body.latency_ms} ms</span></p><pre class="result small">slot ${body.slot} @ ${body.observed_at}\nfree sample — full multi-layer comparison is paid, try it in Explorer →</pre>`;
  }catch(e){ box.innerHTML = `<p class="muted">Drift probe failed (${(e && e.message) || e || "network"}). Check Backend URL ⚙.</p>`; }
}

$("#btnPay").onclick = ()=>execute(true);
$("#btnFree").onclick = ()=>execute(false);
$("#btnWallet").onclick = ()=>{
  const v = $("#walletInput").value.trim();
  if(v){ $("#wStatus").textContent = "connected (demo)"; $("#wAddr").textContent = v.length>16 ? v.slice(0,10)+"…"+v.slice(-6) : v; }
  else { $("#wStatus").textContent = "disconnected"; $("#wAddr").textContent = "—"; }
};

$("#backendGear").onclick = ()=>{ $("#backendBar").classList.toggle("collapsed"); };
$("#osToggle").onclick = ()=>{
  try{ localStorage.setItem("aex_os", OS_ON ? "0" : "1"); }catch(e){}
  location.reload();
};
(function(){ var b=$("#osToggle"); if(b) b.textContent = OS_ON ? "🖥️" : "▦"; })();
$("#btnBaseUse").onclick = ()=>{
  localStorage.setItem("aex_base", $("#backendUrl").value.trim().replace(/\/+$/, ""));
  refreshBaseState(); loadHealth(); loadTelemetry();
};
$("#btnBaseReset").onclick = ()=>{
  localStorage.removeItem("aex_base");
  refreshBaseState(); loadHealth(); loadTelemetry();
};
refreshBaseState();
loadHealth();
loadTelemetry();
probeDrift();
    setInterval(loadTelemetry, 10000);
    /* dock auto-hide: appears near bottom edge or on window actions */
    (function dockWatch(){
      var dock = document.getElementById('osdock');
      if(!dock){ setTimeout(dockWatch, 500); return; }
      var t = null;
      function show(ms){
        dock.classList.add('show');
        if(t) clearTimeout(t);
        t = setTimeout(function(){ dock.classList.remove('show'); }, ms || 2600);
      }
      window.__dockShow = show;
      window.addEventListener('mousemove', function(e){
        if(e.clientY > window.innerHeight - 70) show();
      }, {passive:true});
      dock.addEventListener('mouseleave', function(){ show(1200); });
      show(3500);
    })();

/* ===== OS MODE (toggleable) + STATIC MODE (default-safe grid) ===== */
var OS_ON = (function(){ try{ return localStorage.getItem("aex_os") !== "0"; }catch(e){ return true; } })();
(function(){
  if(!OS_ON) return;
  if(!window.matchMedia('(pointer:fine)').matches) return;
  if(window.innerWidth <= 760) return;
  var z = 40;
  var dock = document.createElement('div');
  dock.id = 'osdock';
  document.body.appendChild(dock);
  var cards = Array.prototype.slice.call(document.querySelectorAll('.grid .card'));
  cards.forEach(function(card, ci){
    var h = card.querySelector('h2');
    var bar = document.createElement('div');
    bar.className = 'wintitle';
    bar.innerHTML = '<span class="wbrand"><svg width="14" height="14" viewBox="0 0 14 14"><polygon points="7,1 13,13 1,13" fill="none" stroke="#a855f7" stroke-width="1.6"/><circle cx="7" cy="9.2" r="1.6" fill="#d946ef"/></svg></span>';
    if(h){ bar.appendChild(h); }
    var max = document.createElement('button');
    max.className = 'wmin'; max.title = 'Maximize';
    max.innerHTML = '<svg width="11" height="11" viewBox="0 0 11 11"><rect x="1.5" y="1.5" width="8" height="8" rx="1.5" fill="none" stroke="currentColor" stroke-width="1.4"/></svg>';
    bar.appendChild(max);
    var min = document.createElement('button');
    min.className = 'wmin'; min.title = 'Minimize';
    min.innerHTML = '<svg width="11" height="11" viewBox="0 0 11 11"><line x1="1.5" y1="5.5" x2="9.5" y2="5.5" stroke="currentColor" stroke-width="1.6"/></svg>';
    bar.appendChild(min);
    max.onclick = function(e){ e.stopPropagation(); card.classList.toggle('max'); if(window.__dockShow) window.__dockShow(); focus(); };
    card.insertBefore(bar, card.firstChild);
    var dbtn = document.createElement('button');
    dbtn.textContent = h ? h.textContent.trim().slice(0, 14) : ('Win ' + (ci + 1));
    dock.appendChild(dbtn);
    function focus(){
      z++; card.style.zIndex = z;
      Array.prototype.forEach.call(dock.children, function(b){ b.classList.remove('on'); });
      if(!card.classList.contains('min')) dbtn.classList.add('on');
    }
    dbtn.onclick = function(){ card.classList.toggle('min'); focus(); };
    min.onclick = function(e){ e.stopPropagation(); card.classList.add('min'); focus(); };
    card.addEventListener('pointerdown', focus);
    var sx = 0, sy = 0, ox = 0, oy = 0, drag = false;
    bar.addEventListener('pointerdown', function(e){
      if((e.target.closest && e.target.closest('button')) || card.classList.contains('min') || card.classList.contains('max')) return;
      drag = true; card.classList.add('drag');
      sx = e.clientX; sy = e.clientY;
      ox = parseFloat(card.dataset.ox || '0'); oy = parseFloat(card.dataset.oy || '0');
      if(bar.setPointerCapture){ try{ bar.setPointerCapture(e.pointerId); }catch(_){} }
      focus(); e.preventDefault();
    });
    bar.addEventListener('pointermove', function(e){
      if(!drag) return;
      var nx = ox + e.clientX - sx, ny = oy + e.clientY - sy;
      card.dataset.ox = nx; card.dataset.oy = ny;
      card.style.transform = 'translate(' + nx + 'px,' + ny + 'px)';
    });
    ['pointerup','pointercancel'].forEach(function(ev){
      bar.addEventListener(ev, function(){ drag = false; card.classList.remove('drag'); });
    });
    bar.addEventListener('dblclick', function(){
      card.dataset.ox = '0'; card.dataset.oy = '0'; card.style.transform = '';
    });
  });
})();
