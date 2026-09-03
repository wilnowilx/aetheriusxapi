/* aetheriusxAPI control room — vanilla JS, no build step.
   Same-origin calls: works locally (uvicorn) and behind nginx (/aetherapi/). */
const $ = s => document.querySelector(s);

/* route -> [{name, required, type, def}] — mirrors main.py signatures */
const SPECS = {
  "/v1/maps/search":   [{n:"q",r:1},{n:"location",r:0,d:"Mexico"}],
  "/v1/maps/reviews":  [{n:"place_name",r:1}],
  "/v1/maps/nearby":   [{n:"lat",r:1,t:"n",d:"19.43"},{n:"lon",r:1,t:"n",d:"-99.13"},
                        {n:"radius",r:0,t:"n",d:"1000"},{n:"category",r:0}],
  "/v1/token/analyze": [{n:"address",r:1,d:"0x833589fCD6eDb6E08f4c7C32D4f71b54bdA4b4eE"},{n:"chain",r:0,d:"base"}],
  "/v1/token/holders": [{n:"address",r:1},{n:"chain",r:0,d:"ethereum"}],
  "/v1/token/price":   [{n:"address",r:1,d:"0x833589fCD6eDb6E08f4c7C32D4f71b54bdA4b4eE"},{n:"chain",r:0,d:"base"}],
  "/v1/web/scrape":    [{n:"url",r:1,d:"https://example.com"}],
  "/v1/web/screenshot":[{n:"url",r:1,d:"https://example.com"},{n:"width",r:0,t:"n",d:"1280"},{n:"height",r:0,t:"n",d:"720"}],
  "/v1/email/validate":[{n:"email",r:1,d:"user@example.com"}],
  "/v1/data/weather":  [{n:"lat",r:1,t:"n",d:"19.43"},{n:"lon",r:1,t:"n",d:"-99.13"}],
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
};

const state = { health:null, selected:null };

/* Backend base URL: same-origin by default (local uvicorn / VM proxy).
   Override via the Backend bar (stored in localStorage) when the page is
   served elsewhere (e.g. GitHub Pages) — requires CORS on the backend. */
function api(path){
  const base = (localStorage.getItem("aex_base") || "").replace(/\/+$/, "");
  return base ? base + path : ".." + path;
}
function refreshBaseState(){
  const b = localStorage.getItem("aex_base") || "";
  $("#backendState").textContent = b ? "→ " + b : "→ same origin";
  $("#backendUrl").value = b;
}

function splitMeta(s){ const i=s.indexOf(" - "); return i<0?[s,""]:[s.slice(0,i),s.slice(i+3)]; }

async function loadHealth(){
  try{
    const r = await fetch(api("/health"));
    if(!r.ok) throw 0;
    const h = await r.json();
    state.health = h;
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
    $("#netBadge").innerHTML = `<span class="dot"></span>offline`;
    const eps = FALLBACK_META;
    $("#hEndpoints").textContent = Object.keys(eps).length;
    renderCatalog(eps);
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
    const r = await fetch(api("/v1/telemetry"));
    if(!r.ok) return;
    const t = await r.json();
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
    const r = await fetch(api("/v1/storage/drift?layers=3"), {headers:{"X-PAYMENT":"dashboard-demo"}});
    if(r.status===404){
      box.innerHTML = `<p class="muted">Endpoint not deployed yet — planned payload shown below. The NATS/VPC telemetry stays private; only drift observations ship as API.</p>`;
    }else{
      const body = await r.json();
      box.innerHTML = `<p><b class="ok">LIVE</b> <span class="muted">slot_delta=${(body.drift||{}).slot_delta ?? "?"}</span></p><pre class="result small">${JSON.stringify(body,null,2)}</pre>`;
    }
  }catch(e){ box.innerHTML = `<p class="muted">Probe failed: ${e}</p>`; }
}

$("#btnPay").onclick = ()=>execute(true);
$("#btnFree").onclick = ()=>execute(false);
$("#btnWallet").onclick = ()=>{
  const v = $("#walletInput").value.trim();
  if(v){ $("#wStatus").textContent = "connected (demo)"; $("#wAddr").textContent = v.length>16 ? v.slice(0,10)+"…"+v.slice(-6) : v; }
  else { $("#wStatus").textContent = "disconnected"; $("#wAddr").textContent = "—"; }
};

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
