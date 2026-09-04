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

function renderCatalog(eps){
  const box = $("#catalog"); box.innerHTML = "";
  Object.keys(SPECS).forEach(route=>{
    const [price,desc] = splitMeta(eps[route] || FALLBACK_META[route]);
    const d = document.createElement("div");
    d.className = "ep"; d.dataset.route = route;
    d.innerHTML = `<div><code>GET ${route}</code><small>${desc}</small></div><span class="price">${price}</span>`;
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
async function loadTelemetry(){
  try{
    const {data: t} = await getJSON("/v1/telemetry");
    const T = t.totals || {};
    $("#mUp").textContent = fmtUptime(t.uptime_s);
    $("#mCalls").textContent = T.calls ?? 0;
    $("#mOk").textContent = T.ok_200 ?? 0;
    $("#m402").textContent = T.challenges_402 ?? 0;
    $("#mErr").textContent = T.errors ?? 0;
    $("#mVol").textContent = "$" + (T.volume_usdc ?? 0) + " USDC";
    $("#mWal").textContent = t.wallets_seen ?? 0;
    $("#mAvg").textContent = T.avg_latency_ms != null ? T.avg_latency_ms + " ms" : "—";
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
    $("#resultBox").textContent = typeof body === "string" ? body : JSON.stringify(body,null,2);
  }catch(e){
    loadTelemetry();
    $("#resultMeta").innerHTML = `<b class="bad">network error</b>`;
    $("#resultBox").textContent = String(e);
  }
}

async function probeDrift(){
  const box = $("#driftBody");
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

/* ===== OS MODE: draggable windows + dock (fine pointers, wide screens) ===== */
(function(){
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
    bar.innerHTML = '<span class="wdots"><i class="r"></i><i class="y"></i><i class="g"></i></span>';
    if(h){ bar.appendChild(h); }
    var min = document.createElement('button');
    min.className = 'wmin'; min.title = 'Minimize'; min.textContent = '–';
    bar.appendChild(min);
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
      if(e.target === min || card.classList.contains('min')) return;
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
