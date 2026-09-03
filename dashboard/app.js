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

const state = { health:null, selected:null, calls:0, ok:0, n402:0, err:0, lat:[] };

function splitMeta(s){ const i=s.indexOf(" - "); return i<0?[s,""]:[s.slice(0,i),s.slice(i+3)]; }

async function loadHealth(){
  try{
    const r = await fetch("../health");
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

function log(status, route, ms){
  state.calls++;
  if(status===200) state.ok++;
  else if(status===402) state.n402++;
  else state.err++;
  state.lat.push(ms); if(state.lat.length>12) state.lat.shift();
  $("#mCalls").textContent = state.calls;
  $("#mOk").textContent = state.ok;
  $("#m402").textContent = state.n402;
  $("#mErr").textContent = state.err;
  $("#mAvg").textContent = Math.round(state.lat.reduce((a,b)=>a+b,0)/state.lat.length)+" ms";
  const bars = $("#latBars"); bars.innerHTML = "";
  const mx = Math.max(...state.lat, 1);
  state.lat.forEach(v=>{
    const i = document.createElement("i");
    i.style.height = Math.max(8, Math.round(v/mx*100))+"%"; i.title = Math.round(v)+" ms";
    bars.appendChild(i);
  });
  const ul = $("#activity");
  if(ul.querySelector(".muted")) ul.innerHTML = "";
  const li = document.createElement("li");
  li.innerHTML = `<b>${status}</b> GET ${route} · ${Math.round(ms)} ms`;
  ul.prepend(li);
  while(ul.children.length>20) ul.lastChild.remove();
}

async function execute(paid){
  if(!state.selected) return;
  const route = state.selected;
  const url = ".." + route + "?" + params();
  $("#resultMeta").textContent = (paid?"paying → ":"no payment → ") + url;
  $("#resultBox").textContent = "…";
  const t0 = performance.now();
  try{
    const headers = paid ? {"X-PAYMENT":"dashboard-demo"} : {};
    const r = await fetch(url, {headers});
    const ms = performance.now()-t0;
    let body; try{ body = await r.json(); }catch(e){ body = await r.text(); }
    log(r.status, route, ms);
    const cls = r.status===200 ? "ok" : (r.status===402 ? "warn" : "bad");
    $("#resultMeta").innerHTML = `HTTP <b class="${cls}">${r.status}</b> · ${Math.round(ms)} ms` +
      (r.headers.get("X-PAYMENT-SETTLED") ? ` · settled: ${r.headers.get("X-PAYMENT-SETTLED")}` : "");
    $("#resultBox").textContent = typeof body === "string" ? body : JSON.stringify(body,null,2);
  }catch(e){
    log(0, route, performance.now()-t0);
    $("#resultMeta").innerHTML = `<b class="bad">network error</b>`;
    $("#resultBox").textContent = String(e);
  }
}

async function probeDrift(){
  const box = $("#driftBody");
  try{
    const r = await fetch("../v1/storage/drift?layers=3", {headers:{"X-PAYMENT":"dashboard-demo"}});
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

loadHealth();
probeDrift();
setInterval(()=>{ if(state.health) $("#hEndpoints").textContent = Object.keys(state.health.endpoints).length; }, 30000);
