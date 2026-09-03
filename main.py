"""aetheriusxAPI — unified backend.

Crypto-native API marketplace: AI agents pay per request in USDC on Base
via the x402 protocol. No accounts, no API keys — the wallet is the identity.

MODES (env X402_MODE, default "simulated"):
  - simulated : any non-empty X-PAYMENT header passes (local dev / tests).
  - real       : official x402 SDK middleware verifies USDC on-chain via a
                 facilitator (production on sentinel-v4).

Routes are served under BOTH /v1/* (canonical, per docs/API.md) and
/api/v1/* (legacy prefix already live behind nginx) so existing clients
keep working.

Endpoints with live upstream logic (no API key needed):
  maps/search, maps/reviews, maps/nearby  (OpenStreetMap Nominatim+Overpass)
  token/analyze                            (Etherscan contract verification)
  token/price                              (CoinGecko free API)
  web/scrape                               (direct fetch + parse)
  web/screenshot                           (WordPress mShots proxy, no browser)
  email/validate                           (syntax + MX + disposable check)
  data/weather                             (Open-Meteo free API)
Key-gated:
  token/holders                            (needs ETHERSCAN_API_KEY, else 501)
"""

import asyncio
import os
import re
import subprocess
import time
from datetime import datetime, timezone

import httpx
from fastapi import FastAPI, Query, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware

from x402_middleware import SimulatedX402Middleware
from telemetry import Tracker, TelemetryMiddleware

# === CONFIG (env-overridable, safe defaults) ===
PAY_TO = os.getenv(
    "AETHERIUS_WALLET", "0x677B483128D0399bCD0A5AB36eE990C0246d7f61"
)
NETWORK = os.getenv("AETHERIUS_NETWORK", "eip155:84532")  # Base Sepolia testnet
CURRENCY = "USDC"
X402_MODE = os.getenv("X402_MODE", "simulated").lower()
FACILITATOR_URL = os.getenv("FACILITATOR_URL", "https://x402.org/facilitator")
ETHERSCAN_API_KEY = os.getenv("ETHERSCAN_API_KEY", "")
VERSION = "2.0.0"

UA = {"User-Agent": "aetheriusxAPI/2.0 (AI Agent)"}

# Overpass instances tried in order (public mirrors; datacenter IPs are
# often throttled on the primary, so fail over automatically).
OVERPASS_URLS = [
    "https://overpass-api.de/api/interpreter",
    "https://overpass.kumi.systems/api/interpreter",
    "https://overpass.nchc.org.tw/api/interpreter",
]


async def _overpass_query(client: httpx.AsyncClient, query: str,
                          mirrors: list | None = None,
                          timeout: float = 25) -> dict | None:
    """POST an Overpass QL query, failing over across public mirrors."""
    for url in (mirrors or OVERPASS_URLS):
        try:
            r = await client.post(url, data={"data": query}, timeout=timeout)
            if r.status_code == 200:
                return r.json()
        except Exception:
            continue
    return None


async def _nominatim_search(client: httpx.AsyncClient, q: str,
                            location: str, limit: int = 20) -> dict:
    """Fast fallback search: Nominatim only (no phones/websites)."""
    resp = await client.get(
        "https://nominatim.openstreetmap.org/search",
        params={"q": f"{q}, {location}", "format": "json", "limit": limit},
        headers=UA,
    )
    results = []
    if resp.status_code == 200:
        for p in resp.json():
            results.append({
                "name": p.get("display_name", "").split(",")[0],
                "address": p.get("display_name", ""),
                "phone": "", "website": "",
                "lat": p.get("lat"), "lon": p.get("lon"),
            })
    return results

# Canonical route -> price (USD). Served under /v1/* AND /api/v1/*.
PRICES = {
    "/v1/maps/search": "$0.01",
    "/v1/maps/reviews": "$0.02",
    "/v1/maps/nearby": "$0.015",
    "/v1/token/analyze": "$0.02",
    "/v1/token/holders": "$0.03",
    "/v1/token/price": "$0.005",
    "/v1/web/scrape": "$0.01",
    "/v1/web/screenshot": "$0.025",
    "/v1/email/validate": "$0.005",
    "/v1/data/weather": "$0.008",
    "/v1/storage/drift": "$0.02",
    "/v1/defi/yields": "$0.02",
    "/v1/defi/stablecoins": "$0.01",
    "/v1/defi/fees": "$0.015",
    "/v1/defi/tvl": "$0.01",
    "/v1/forex/rates": "$0.008",
    "/v1/news/hackernews": "$0.01",
    "/v1/data/forecast": "$0.008",
    "/v1/data/airquality": "$0.008",
    "/v1/data/define": "$0.005",
    "/v1/defi/protocols": "$0.01",
    "/v1/defi/dexs": "$0.015",
    "/v1/defi/stablecoinchains": "$0.01",
    "/v1/token/prices": "$0.01",
    "/v1/token/gas": "$0.01",
    "/v1/maps/reverse": "$0.01",
    "/v1/news/hn-item": "$0.005",
    "/v1/news/hn-user": "$0.005",
    "/v1/forex/history": "$0.01",
    "/v1/web/geoip": "$0.008",
}

DESCRIPTIONS = {
    "/v1/maps/search": "Business search via OpenStreetMap - names, addresses, phones, coords",
    "/v1/maps/reviews": "Place lookup via OpenStreetMap - coords, type, importance",
    "/v1/maps/nearby": "Nearby places by coordinates via OpenStreetMap",
    "/v1/token/analyze": "Token contract analysis - verification, ABI, risk score",
    "/v1/token/holders": "Token holder distribution (requires ETHERSCAN_API_KEY)",
    "/v1/token/price": "Real-time token price via CoinGecko",
    "/v1/web/scrape": "Web scraper - structured content as JSON",
    "/v1/web/screenshot": "Website screenshot URL (mShots proxy, no browser needed)",
    "/v1/email/validate": "Email validation - syntax, MX, disposable, risk score",
    "/v1/data/weather": "Current weather by coordinates via Open-Meteo",
    "/v1/storage/drift": "Cross-RPC slot drift - which block number each layer sees",
    "/v1/defi/yields": "Top DeFi yield pools by TVL via Llama",
    "/v1/defi/stablecoins": "Stablecoin list with prices via Llama",
    "/v1/defi/fees": "Protocol fees and revenue via Llama",
    "/v1/defi/tvl": "Chain TVLs via Llama",
    "/v1/forex/rates": "Fiat exchange rates via Frankfurter",
    "/v1/news/hackernews": "Hacker News top stories with metadata",
    "/v1/data/forecast": "7-day forecast via Open-Meteo",
    "/v1/data/airquality": "Air quality via Open-Meteo",
    "/v1/data/define": "Dictionary definitions, no key",
    "/v1/defi/protocols": "DeFi protocols by TVL via Llama",
    "/v1/defi/dexs": "DEX volume leaders via Llama",
    "/v1/defi/stablecoinchains": "Stable distribution by chain via Llama",
    "/v1/token/prices": "Batch token prices in one call",
    "/v1/token/gas": "Ethereum gas oracle via Etherscan",
    "/v1/maps/reverse": "Coords to address via Nominatim",
    "/v1/news/hn-item": "Single HN item by id",
    "/v1/news/hn-user": "HN user profile and karma",
    "/v1/forex/history": "Historical FX ranges via Frankfurter",
    "/v1/web/geoip": "IP geolocation and ISP",
}

# Public JSON-RPC endpoints used as independent observation layers.
# No keys. Distinct operators genuinely disagree by 0-3 blocks — that
# disagreement IS the product (distributed-state divergence, measured).
DRIFT_RPCS = {
    "base": ["https://mainnet.base.org",
             "https://base-mainnet.public.blastapi.io",
             "https://base.llamarpc.com"],
    "ethereum": ["https://cloudflare-eth.com", "https://ethereum.llamarpc.com"],
    "optimism": ["https://mainnet.optimism.io", "https://optimism.llamarpc.com"],
    "arbitrum": ["https://arb1.arbitrum.io/rpc", "https://arbitrum.llamarpc.com"],
    "polygon": ["https://polygon-rpc.com", "https://polygon.llamarpc.com"],
}

# === APP ===
app = FastAPI(
    title="aetheriusxAPI",
    description="Crypto-native API marketplace. AI agents pay per request in USDC on Base via x402.",
    version=VERSION,
)


@app.exception_handler(RequestValidationError)
async def validation_handler(request: Request, exc: RequestValidationError):
    """Return docs-compliant 400 instead of FastAPI's default 422."""
    missing = [".".join(map(str, e["loc"][1:])) or e["loc"][0]
               for e in exc.errors() if e["type"] == "missing"]
    detail = (f"Missing required parameter: {', '.join(missing)}"
              if missing else "Invalid request parameters")
    return JSONResponse(status_code=400, content={"error": detail})


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


async def fetch_json(client: httpx.AsyncClient, url: str,
                     params: dict | None = None,
                     timeout: float = 15):
    """GET JSON from an upstream. Returns (ok, payload). Never raises."""
    try:
        r = await client.get(url, params=params or {}, headers=UA,
                             timeout=timeout)
        if r.status_code == 200:
            try:
                return True, r.json()
            except Exception:
                return False, {"error": "Upstream returned non-JSON",
                               "url": url}
        return False, {"error": f"Upstream HTTP {r.status_code}", "url": url}
    except Exception as e:
        return False, {"error": str(e)[:200], "url": url}


def pick(obj: dict, keep: tuple = ("name",),
         contains: tuple = ("fee", "vol", "tvl", "revenue")) -> dict:
    """Defensive row trimmer: keep listed keys + any key mentioning targets."""
    row = {k: obj.get(k) for k in keep}
    for k, v in obj.items():
        kl = k.lower()
        if any(t in kl for t in contains) and k not in row:
            row[k] = v
    return row


def _err(status_code: int, payload: dict) -> JSONResponse:
    """Build an error response. (status_code is keyword-only in Starlette.)"""
    return JSONResponse(content=payload, status_code=status_code)


def _paid_routes_for_sdk(prefix: str) -> dict:
    """Build official-SDK route table lazily (imported only in real mode)."""
    from x402.http.types import RouteConfig
    from x402.http import PaymentOption

    table = {}
    for canonical, price in PRICES.items():
        route = prefix + canonical[len("/v1"):]  # /v1/x -> {prefix}/x
        table[f"GET {route}"] = RouteConfig(
            accepts=[PaymentOption(scheme="exact", pay_to=PAY_TO,
                                   price=price, network=NETWORK)],
            description=DESCRIPTIONS[canonical],
            mime_type="application/json",
        )
    return table


tracker = Tracker(prices=PRICES,
                    db_path=os.getenv("AETHERIUS_DB_PATH") or None)

if X402_MODE == "real":
    try:
        from x402.http import FacilitatorConfig, HTTPFacilitatorClient
        from x402.http.middleware.fastapi import PaymentMiddlewareASGI
        from x402.mechanisms.evm.exact import ExactEvmServerScheme
        from x402.server import x402ResourceServer

        _facilitator = HTTPFacilitatorClient(FacilitatorConfig(url=FACILITATOR_URL))
        _server = x402ResourceServer(_facilitator)
        _server.register(NETWORK, ExactEvmServerScheme())
        _routes = {}
        _routes.update(_paid_routes_for_sdk("/v1"))
        _routes.update(_paid_routes_for_sdk("/api/v1"))
        app.add_middleware(PaymentMiddlewareASGI, routes=_routes, server=_server)
        print(f"[x402] REAL mode: {len(_routes)} paid routes on {NETWORK}", flush=True)
    except ImportError as e:
        print(f"[x402] SDK missing ({e}); falling back to SIMULATED mode", flush=True)
        app.add_middleware(SimulatedX402Middleware, prices=PRICES,
                           pay_to=PAY_TO, network=NETWORK, currency=CURRENCY)
else:
    app.add_middleware(SimulatedX402Middleware, prices=PRICES,
                       pay_to=PAY_TO, network=NETWORK, currency=CURRENCY)
    print("[x402] SIMULATED mode: pass any X-PAYMENT header", flush=True)

# Telemetry: outermost API observer (see note below on ordering).
app.add_middleware(TelemetryMiddleware, tracker=tracker)

# CORS LAST (= outermost): browser preflights short-circuit here, never
# polluting telemetry. Public read API, no cookies: explicit origin list with
# env override + Codespaces dev regex. (Starlette inserts at position 0, so
# last-added sits outermost.)
CORS_ORIGINS = [o.strip() for o in os.getenv(
    "CORS_ORIGINS",
    "https://wilnowilx.github.io,http://127.0.0.1:4020,http://localhost:4020"
).split(",") if o.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_origin_regex=r"https://.*\.app\.github\.dev",
    allow_methods=["GET", "OPTIONS"],
    allow_headers=["*"],
)


# === FREE ROUTES ===

@app.get("/health")
@app.get("/api/v1/health")
async def health():
    return {
        "status": "alive",
        "service": "aetheriusxAPI",
        "version": VERSION,
        "mode": X402_MODE,
        "network": NETWORK,
        "currency": CURRENCY,
        "wallet": PAY_TO,
        "timestamp": _now(),
        "endpoints": {k: f"{v}/call - {DESCRIPTIONS[k]}"
                      for k, v in PRICES.items()},
    }


@app.get("/v1/telemetry")
@app.get("/api/v1/telemetry")
async def telemetry():
    """FREE public proof layer: uptime, totals, per-endpoint stats, volume."""
    return tracker.snapshot(mode=X402_MODE, network=NETWORK,
                            currency=CURRENCY, version=VERSION, wallet=PAY_TO)


@app.get("/")
async def root():
    return {"service": "aetheriusxAPI", "version": VERSION,
            "docs": "/docs", "health": "/health", "dashboard": "/dashboard/",
            "telemetry": "/v1/telemetry"}


# Control-room dashboard (static, no build step). Mounted only if present
# so unit/test checkouts without the folder still boot.
if os.path.isdir(os.path.join(os.path.dirname(__file__), "dashboard")):
    app.mount("/dashboard",
              StaticFiles(directory=os.path.join(os.path.dirname(__file__),
                                                 "dashboard"), html=True),
              name="dashboard")


# === MAPS (OpenStreetMap: Nominatim + Overpass, no key) ===

async def _geocode(client: httpx.AsyncClient, location: str):
    resp = await client.get(
        "https://nominatim.openstreetmap.org/search",
        params={"q": location, "format": "json", "limit": 1},
        headers=UA,
    )
    if resp.status_code == 200 and resp.json():
        g = resp.json()[0]
        return g["lat"], g["lon"]
    return "19.4326", "-99.1332"  # Mexico City fallback


@app.get("/v1/maps/search")
@app.get("/api/v1/maps/search")
async def maps_search(q: str = Query(..., description="Search query"),
                      location: str = Query("Mexico", description="Location")):
    """Business search. Names, addresses, phones, websites, coordinates."""
    try:
        async with httpx.AsyncClient(timeout=30) as client:
            lat, lon = await _geocode(client, location)
            query = (f'[out:json][timeout:12];(node["name"~"{q}",i]'
                     f'(around:5000,{lat},{lon});way["name"~"{q}",i]'
                     f'(around:5000,{lat},{lon}););out center body;')
            # Regex queries are heavy: 2 fast mirrors, then Nominatim.
            data = await _overpass_query(client, query,
                                         mirrors=OVERPASS_URLS[:2], timeout=10)
            if data is None:
                results = await _nominatim_search(client, q, location)
                return {"query": q, "location": location,
                        "count": len(results), "results": results,
                        "data_source": "nominatim-fallback"}
            results = []
            for elem in data.get("elements", [])[:20]:
                tags = elem.get("tags", {})
                center = elem.get("center", {})
                results.append({
                    "name": tags.get("name", "Unknown"),
                    "address": (tags.get("addr:street", "") + " "
                                + tags.get("addr:housenumber", "")).strip(),
                    "phone": tags.get("phone", tags.get("contact:phone", "")),
                    "website": tags.get("website", ""),
                    "lat": elem.get("lat", center.get("lat")),
                    "lon": elem.get("lon", center.get("lon")),
                })
            return {"query": q, "location": location,
                    "count": len(results), "results": results,
                    "data_source": "overpass"}
    except Exception as e:
        return _err(500, {"error": str(e)})


@app.get("/v1/maps/reviews")
@app.get("/api/v1/maps/reviews")
async def maps_reviews(place_name: str = Query(..., description="Place name")):
    """Place info lookup. Display name, coordinates, type, importance."""
    try:
        async with httpx.AsyncClient(timeout=20) as client:
            resp = await client.get(
                "https://nominatim.openstreetmap.org/search",
                params={"q": place_name, "format": "json", "limit": 5},
                headers=UA,
            )
            if resp.status_code == 200:
                results = [{"name": p.get("display_name", ""),
                            "lat": p.get("lat"), "lon": p.get("lon"),
                            "type": p.get("type"),
                            "importance": p.get("importance")}
                           for p in resp.json()]
                return {"query": place_name, "count": len(results),
                        "results": results}
            return _err(502, {"error": "Nominatim unavailable"})
    except Exception as e:
        return _err(500, {"error": str(e)})


@app.get("/v1/maps/nearby")
@app.get("/api/v1/maps/nearby")
async def maps_nearby(lat: float = Query(..., description="Latitude"),
                      lon: float = Query(..., description="Longitude"),
                      radius: int = Query(1000, description="Radius in meters"),
                      category: str = Query("", description="amenity/shop filter")):
    """Nearby named places around coordinates, optional category filter."""
    try:
        radius = max(50, min(radius, 10000))
        if category:
            selector = (f'node["amenity"~"{category}",i](around:{radius},{lat},{lon});'
                        f'way["amenity"~"{category}",i](around:{radius},{lat},{lon});'
                        f'node["shop"~"{category}",i](around:{radius},{lat},{lon});')
        else:
            selector = (f'node["name"](around:{radius},{lat},{lon});'
                        f'way["name"](around:{radius},{lat},{lon});')
        query = f"[out:json][timeout:25];({selector});out center body;"
        async with httpx.AsyncClient(timeout=30) as client:
            data = await _overpass_query(client, query)
            if data is None:
                # Fallback: reverse-geocode single best guess for the coords.
                try:
                    r = await client.get(
                        "https://nominatim.openstreetmap.org/reverse",
                        params={"lat": lat, "lon": lon, "format": "json"},
                        headers=UA)
                    results = []
                    if r.status_code == 200 and r.json().get("display_name"):
                        p = r.json()
                        results = [{"name": p.get("display_name", "").split(",")[0],
                                    "category": p.get("type", ""),
                                    "lat": lat, "lon": lon}]
                except Exception:
                    results = []
                return {"lat": lat, "lon": lon, "radius": radius,
                        "category": category or "all",
                        "count": len(results), "results": results,
                        "data_source": "nominatim-reverse"}
            results = []
            for elem in data.get("elements", [])[:20]:
                tags = elem.get("tags", {})
                center = elem.get("center", {})
                results.append({
                    "name": tags.get("name", "Unknown"),
                    "category": tags.get("amenity", tags.get("shop", "")),
                    "lat": elem.get("lat", center.get("lat")),
                    "lon": elem.get("lon", center.get("lon")),
                })
            return {"lat": lat, "lon": lon, "radius": radius,
                    "category": category or "all",
                    "count": len(results), "results": results,
                    "data_source": "overpass"}
    except Exception as e:
        return _err(500, {"error": str(e)})


# === CRYPTO ===

CHAINIDS = {"ethereum": 1, "base": 8453, "optimism": 10,
            "arbitrum": 42161, "polygon": 137}

# Major stablecoins: served instantly via Coinbase spot (fiat-grade source,
# immune to DEX-indexer gaps and datacenter throttling).
KNOWN_TOKENS = {
    "0x833589fcd6edb6e08f4c7c32d4f71b54bda4b4ee": "USDC",  # Base
    "0xa0b86991c6218b36c1d19d4a2e9eb0ce69c744": "USDC",    # Ethereum
    "0xdac17f958d2ee523a2206206994597c13d831ec7": "USDT",  # Ethereum
    "0x6b175474e89094c44da98b954eedeac495271d0f": "DAI",   # Ethereum
}
COINGECKO_PLATFORM = {"ethereum": "ethereum", "base": "base",
                      "optimism": "optimistic-ethereum",
                      "arbitrum": "arbitrum-one", "polygon": "polygon-pos"}


@app.get("/v1/token/analyze")
@app.get("/api/v1/token/analyze")
async def token_analyze(address: str = Query(..., description="Token contract"),
                        chain: str = Query("ethereum", description="Blockchain")):
    """Contract analysis: Etherscan verification + heuristic risk score."""
    try:
        result = {"address": address, "chain": chain,
                  "analyzed_at": _now(), "checks": {}}
        if chain.lower() in ("ethereum", "base", "optimism", "arbitrum"):
            async with httpx.AsyncClient(timeout=15) as client:
                vr = await client.get(
                    "https://api.etherscan.io/api",
                    params={"module": "contract", "action": "getabi",
                            "address": address, "tag": "latest"})
                if vr.status_code == 200:
                    data = vr.json()
                    result["checks"]["verified"] = data.get("status") == "1"
                    result["checks"]["has_abi"] = data.get("status") == "1"
        risk = 50
        if result["checks"].get("verified"):
            risk -= 20
        if not result["checks"].get("has_abi"):
            risk += 30
        result["risk_score"] = max(0, min(100, risk))
        result["risk_level"] = ("low" if risk < 30
                                else "medium" if risk < 60 else "high")
        return result
    except Exception as e:
        return _err(500, {"error": str(e), "address": address})


@app.get("/v1/token/holders")
@app.get("/api/v1/token/holders")
async def token_holders(address: str = Query(..., description="Token contract"),
                        chain: str = Query("ethereum", description="Blockchain")):
    """Holder distribution. Requires ETHERSCAN_API_KEY env var."""
    if not ETHERSCAN_API_KEY:
        return _err(501, {
            "error": "token/holders requires an Etherscan API key",
            "how": "Set ETHERSCAN_API_KEY env var (free at etherscan.io/apis).",
            "address": address, "chain": chain})
    try:
        chainid = CHAINIDS.get(chain.lower(), 1)
        async with httpx.AsyncClient(timeout=20) as client:
            r = await client.get(
                "https://api.etherscan.io/v2/api",
                params={"chainid": chainid, "module": "token",
                        "action": "tokenholderlist",
                        "contractaddress": address, "page": 1, "offset": 20,
                        "apikey": ETHERSCAN_API_KEY})
            data = r.json()
            if data.get("status") == "1":
                return {"address": address, "chain": chain,
                        "count": len(data["result"]),
                        "holders": data["result"], "fetched_at": _now()}
            return _err(502, {"error": data.get("message", "Etherscan error")})
    except Exception as e:
        return _err(500, {"error": str(e)})


@app.get("/v1/token/price")
@app.get("/api/v1/token/price")
async def token_price(address: str = Query(..., description="Token contract"),
                      chain: str = Query("ethereum", description="Blockchain")):
    """Real-time USD price: known stables via Coinbase, else 4-source chain."""
    try:
        async with httpx.AsyncClient(timeout=15) as client:
            # Instant path: major stablecoins via Coinbase spot.
            symbol = KNOWN_TOKENS.get(address.lower())
            if symbol:
                try:
                    r = await client.get(
                        f"https://api.coinbase.com/v2/prices/{symbol}-USD/spot")
                    if r.status_code == 200:
                        amt = (r.json().get("data") or {}).get("amount")
                        if amt is not None:
                            return {"address": address, "chain": chain,
                                    "price_usd": float(amt),
                                    "symbol": symbol,
                                    "vs_currency": "usd",
                                    "data_source": "coinbase",
                                    "fetched_at": _now()}
                except Exception:
                    pass
            # Primary: CoinGecko (chain-specific).
            platform = COINGECKO_PLATFORM.get(chain.lower())
            if platform:
                try:
                    r = await client.get(
                        f"https://api.coingecko.com/api/v3/simple/token_price/{platform}",
                        params={"contract_addresses": address,
                                "vs_currencies": "usd",
                                "include_24hr_change": "true"})
                    info = (r.json().get(address.lower())
                            if r.status_code == 200 else None)
                    if info and info.get("usd") is not None:
                        return {"address": address, "chain": chain,
                                "price_usd": info.get("usd"),
                                "change_24h": info.get("usd_24h_change"),
                                "vs_currency": "usd",
                                "data_source": "coingecko",
                                "fetched_at": _now()}
                except Exception:
                    pass
            # Fallback: DexScreener (chain-agnostic, datacenter-friendly).
            try:
                r = await client.get(
                    f"https://api.dexscreener.com/latest/dex/tokens/{address}",
                    headers=UA)
                if r.status_code == 200:
                    pairs = r.json().get("pairs") or []
                    if pairs:
                        p0 = pairs[0]
                        return {"address": address, "chain": chain,
                                "price_usd": float(p0.get("priceUsd", 0)),
                                "change_24h": (p0.get("priceChange") or {}).get("h24"),
                                "dex": p0.get("dexId"),
                                "vs_currency": "usd",
                                "data_source": "dexscreener",
                                "fetched_at": _now()}
            except Exception:
                pass
            # Last resort: GeckoTerminal (address-based, free, no key).
            gt_network = {"ethereum": "eth", "base": "base",
                          "polygon": "polygon_pos", "arbitrum": "arbitrum",
                          "optimism": "optimism"}.get(chain.lower())
            if gt_network:
                try:
                    r = await client.get(
                        f"https://api.geckoterminal.com/api/v2/networks/"
                        f"{gt_network}/tokens/{address}", headers=UA)
                    if r.status_code == 200:
                        attrs = (r.json().get("data") or {}).get("attributes") or {}
                        if attrs.get("price_usd") is not None:
                            chg = (attrs.get("price_change_percentage") or {}).get("h24")
                            return {"address": address, "chain": chain,
                                    "price_usd": float(attrs["price_usd"]),
                                    "change_24h": float(chg) if chg is not None else None,
                                    "vs_currency": "usd",
                                    "data_source": "geckoterminal",
                                    "fetched_at": _now()}
                except Exception:
                    pass
            # Final fallback: Llama.fi (server-grade, address-based).
            llama_chain = {"ethereum": "ethereum", "base": "base",
                           "polygon": "polygon", "arbitrum": "arbitrum",
                           "optimism": "optimism"}.get(chain.lower())
            if llama_chain:
                try:
                    r = await client.get(
                        "https://coins.llama.fi/prices/current/"
                        f"{llama_chain}:{address}")
                    if r.status_code == 200:
                        coin = (r.json().get("coins") or {}).get(
                            f"{llama_chain}:{address}")
                        if coin and coin.get("price") is not None:
                            return {"address": address, "chain": chain,
                                    "price_usd": float(coin["price"]),
                                    "symbol": coin.get("symbol"),
                                    "vs_currency": "usd",
                                    "data_source": "llama",
                                    "fetched_at": _now()}
                except Exception:
                    pass
            return _err(404, {"error": "Token not found (CoinGecko + "
                                       "DexScreener + GeckoTerminal + Llama)",
                              "address": address, "chain": chain})
    except Exception as e:
        return _err(500, {"error": str(e)})


# === WEB ===

@app.get("/v1/web/scrape")
@app.get("/api/v1/web/scrape")
async def web_scrape(url: str = Query(..., description="URL to scrape")):
    """Fetch a page, return title, text preview, links, content length."""
    try:
        async with httpx.AsyncClient(timeout=20, follow_redirects=True) as client:
            resp = await client.get(url, headers=UA)
            if resp.status_code != 200:
                return _err(resp.status_code,
                            {"error": f"HTTP {resp.status_code}",
                             "url": url})
            content = resp.text[:50000]
            m = re.search(r"<title[^>]*>(.*?)</title>", content,
                          re.IGNORECASE | re.DOTALL)
            title = m.group(1).strip() if m else ""
            text = re.sub(r"<script[^>]*>.*?</script>", "", content,
                          flags=re.DOTALL | re.IGNORECASE)
            text = re.sub(r"<style[^>]*>.*?</style>", "", text,
                          flags=re.DOTALL | re.IGNORECASE)
            text = re.sub(r"<[^>]+>", " ", text)
            text = re.sub(r"\s+", " ", text).strip()[:10000]
            links = re.findall(r'href=["\']([^"\' ]+)["\']', content)[:50]
            return {"url": url, "status": resp.status_code, "title": title,
                    "text_preview": text[:2000], "links_count": len(links),
                    "links": links[:20], "content_length": len(content)}
    except Exception as e:
        return _err(500, {"error": str(e), "url": url})


@app.get("/v1/web/screenshot")
@app.get("/api/v1/web/screenshot")
async def web_screenshot(url: str = Query(..., description="URL to capture"),
                         width: int = Query(1280, description="Viewport width"),
                         height: int = Query(720, description="Viewport height")):
    """Screenshot via WordPress mShots proxy (no headless browser needed)."""
    width = max(320, min(width, 1920))
    height = max(240, min(height, 1080))
    shot = f"https://s0.wp.com/mshots/v1/{httpx.QueryParams({'u': url})['u']}?w={width}"
    return {"url": url, "width": width, "height": height,
            "screenshot_url": shot,
            "note": "Rendered on demand by WordPress mShots; allow a few "
                    "seconds on first load.",
            "data_source": "mshots"}


# === DATA ===

DISPOSABLE = {"tempmail.com", "guerrillamail.com", "mailinator.com",
              "yopmail.com", "throwaway.email", "temp-mail.org",
              "10minutemail.com", "sharklasers.com", "dispostable.com",
              "trashmail.com", "fakeinbox.com"}


@app.get("/v1/email/validate")
@app.get("/api/v1/email/validate")
async def email_validate(email: str = Query(..., description="Email address")):
    """Syntax + MX record + disposable-domain check with risk score."""
    result = {"email": email, "valid_syntax": False, "has_mx": False,
              "is_disposable": False, "risk_score": 0}
    if not re.match(r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$", email):
        result.update(risk_score=100, verdict="invalid_syntax")
        return result
    result["valid_syntax"] = True
    domain = email.split("@")[1]
    try:
        mx = subprocess.run(["nslookup", "-type=mx", domain],
                            capture_output=True, text=True, timeout=8)
        out = mx.stdout.lower()
        result["has_mx"] = ("mail exchanger" in out or "mx preference" in out
                            or "mx record" in out)
    except Exception:
        result["has_mx"] = None
    result["is_disposable"] = domain.lower() in DISPOSABLE
    score = 0
    if not result["has_mx"]:
        score += 40
    if result["is_disposable"]:
        score += 50
    result["risk_score"] = min(100, score)
    result["verdict"] = ("valid" if score < 20
                         else "risky" if score < 50 else "invalid")
    return result


@app.get("/v1/data/weather")
@app.get("/api/v1/data/weather")
async def weather(lat: float = Query(..., description="Latitude"),
                  lon: float = Query(..., description="Longitude")):
    """Current weather via Open-Meteo free API (no key)."""
    try:
        async with httpx.AsyncClient(timeout=15) as client:
            r = await client.get(
                "https://api.open-meteo.com/v1/forecast",
                params={"latitude": lat, "longitude": lon,
                        "current": "temperature_2m,relative_humidity_2m,"
                                   "apparent_temperature,weather_code,"
                                   "wind_speed_10m",
                        "timezone": "auto"})
            if r.status_code != 200:
                return _err(502, {"error": "Open-Meteo unavailable"})
            d = r.json()
            return {"lat": lat, "lon": lon,
                    "timezone": d.get("timezone"),
                    "current": d.get("current", {}),
                    "data_source": "open-meteo", "fetched_at": _now()}
    except Exception as e:
        return _err(500, {"error": str(e)})


async def _rpc_slot(client: httpx.AsyncClient, url: str) -> dict:
    """Ask one RPC layer which slot (block number) it sees right now."""
    t0 = time.perf_counter()
    layer = {"name": url.split("://", 1)[1].split("/")[0],
             "slot": None, "observed_at": _now(),
             "latency_ms": None, "error": None}
    try:
        r = await client.post(url, json={"jsonrpc": "2.0", "id": 1,
                                         "method": "eth_blockNumber",
                                         "params": []})
        layer["latency_ms"] = round((time.perf_counter() - t0) * 1000, 1)
        if r.status_code == 200:
            result = (r.json().get("result") or "")
            if result.startswith("0x"):
                layer["slot"] = int(result, 16)
                return layer
        layer["error"] = f"HTTP {r.status_code}"
    except Exception as e:
        layer["latency_ms"] = round((time.perf_counter() - t0) * 1000, 1)
        layer["error"] = str(e)[:120]
    return layer


@app.get("/v1/storage/drift")
@app.get("/api/v1/storage/drift")
async def storage_drift(chain: str = Query("base", description="Chain"),
                        layers: int = Query(2, description="RPC layers to compare")):
    """Cross-layer slot drift: query N independent RPCs, report which block
    each one sees. Disagreement of 0-3 slots between operators is normal and
    IS the measured phenomenon (distributed-state divergence)."""
    rpcs = DRIFT_RPCS.get(chain.lower())
    if not rpcs:
        return _err(400, {"error": f"Unsupported chain: {chain}. "
                                   f"Use: {sorted(DRIFT_RPCS)}"})
    layers = max(1, min(layers, len(rpcs)))
    try:
        async with httpx.AsyncClient(timeout=12) as client:
            results = await asyncio.gather(
                *[_rpc_slot(client, url) for url in rpcs[:layers]])
            ok = [x for x in results if x["slot"] is not None]
            if not ok:
                return _err(502, {"error": "All RPC layers unreachable",
                                  "chain": chain, "layers": results})
            slots = [x["slot"] for x in ok]
            delta = max(slots) - min(slots)
            failed = [x["name"] for x in results if x["slot"] is None]
            if failed:
                status = "degraded"
            elif delta <= 1:
                status = "converged"
            else:
                status = "diverged"
            return {"chain": chain.lower(),
                    "layers": results,
                    "drift": {"slot_delta": delta,
                              "min_slot": min(slots),
                              "max_slot": max(slots),
                              "status": status,
                              "reporting_layers": len(ok),
                              "failed_layers": failed},
                    "data_source": "public-rpc",
                    "fetched_at": _now()}
    except Exception as e:
        return _err(500, {"error": str(e)})


# === SPEC-DRIVEN PACK: DeFi + Forex + News (free upstreams, no keys) ===

@app.get("/v1/defi/yields")
@app.get("/api/v1/defi/yields")
async def defi_yields(chain: str = Query("", description="Filter by chain"),
                      project: str = Query("", description="Filter by project"),
                      limit: int = Query(20, description="Max pools 1-100")):
    """Top DeFi yield pools by TVL. Llama Yields, no key."""
    limit = max(1, min(limit, 100))
    try:
        async with httpx.AsyncClient(timeout=25) as client:
            ok, data = await fetch_json(client, "https://yields.llama.fi/pools")
            if not ok:
                return _err(502, data)
            pools = data.get("data", []) if isinstance(data, dict) else []
            if chain:
                pools = [p for p in pools
                         if str(p.get("chain", "")).lower() == chain.lower()]
            if project:
                pools = [p for p in pools
                         if str(p.get("project", "")).lower() == project.lower()]
            pools = sorted(pools, key=lambda p: float(p.get("tvlUsd") or 0),
                           reverse=True)[:limit]
            out = [{"pool": p.get("pool"), "chain": p.get("chain"),
                    "project": p.get("project"), "symbol": p.get("symbol"),
                    "apy": p.get("apy"), "tvlUsd": p.get("tvlUsd")}
                   for p in pools]
            return {"count": len(out), "chain": chain or "all",
                    "project": project or "all", "pools": out,
                    "data_source": "llama-yields", "fetched_at": _now()}
    except Exception as e:
        return _err(500, {"error": str(e)})


@app.get("/v1/defi/stablecoins")
@app.get("/api/v1/defi/stablecoins")
async def defi_stablecoins(limit: int = Query(30, description="Max stables 1-100")):
    """Stablecoins with prices and circulation. Llama, no key."""
    limit = max(1, min(limit, 100))
    try:
        async with httpx.AsyncClient(timeout=20) as client:
            ok, data = await fetch_json(
                client, "https://stablecoins.llama.fi/stablecoins",
                params={"includePrices": "true"})
            if not ok:
                return _err(502, data)
            assets = data.get("peggedAssets", []) if isinstance(data, dict) else []
            assets = sorted(assets,
                            key=lambda a: float(a.get("circulating", {}).get("peggedUSD") or 0) if isinstance(a.get("circulating"), dict) else float(a.get("circulating") or 0),
                            reverse=True)[:limit]
            out = [{"name": a.get("name"), "symbol": a.get("symbol"),
                    "price": (a.get("price") or {}).get("peggedUSD") if isinstance(a.get("price"), dict) else a.get("price"),
                    "circulating_usd": (a.get("circulating") or {}).get("peggedUSD") if isinstance(a.get("circulating"), dict) else a.get("circulating"),
                    "chains": a.get("chains", [])} for a in assets]
            return {"count": len(out), "stables": out,
                    "data_source": "llama-stablecoins", "fetched_at": _now()}
    except Exception as e:
        return _err(500, {"error": str(e)})


@app.get("/v1/defi/fees")
@app.get("/api/v1/defi/fees")
async def defi_fees(limit: int = Query(20, description="Max protocols 1-100")):
    """Protocol fees and revenue leaders. Llama, no key."""
    limit = max(1, min(limit, 100))
    try:
        async with httpx.AsyncClient(timeout=20) as client:
            ok, data = await fetch_json(
                client, "https://api.llama.fi/overview/fees",
                params={"excludeTotalDataChart": "true",
                        "excludeTotalDataChartBreakdown": "true"})
            if not ok:
                return _err(502, data)
            protos = data.get("protocols", []) if isinstance(data, dict) else []
            protos = sorted(protos, key=lambda p: float(p.get("total24h") or 0),
                            reverse=True)[:limit]
            out = [{"name": p.get("displayName") or p.get("name"),
                    "category": p.get("category"),
                    "fees_24h_usd": p.get("total24h"),
                    "fees_7d_usd": p.get("total7d"),
                    "fees_all_time_usd": p.get("totalAllTime")} for p in protos]
            return {"count": len(out), "protocols": out,
                    "total_24h_usd": data.get("total24h") if isinstance(data, dict) else None,
                    "data_source": "llama-fees", "fetched_at": _now()}
    except Exception as e:
        return _err(500, {"error": str(e)})


@app.get("/v1/defi/tvl")
@app.get("/api/v1/defi/tvl")
async def defi_tvl(limit: int = Query(20, description="Max chains 1-100"),
                   chain: str = Query("", description="Filter by chain name")):
    """Chain TVLs. Llama v2 API, no key. (Replaces /v1/defi/bridges — Llama
    put Bridges behind paywall; their monetization validates our model.)"""
    limit = max(1, min(limit, 100))
    try:
        async with httpx.AsyncClient(timeout=20) as client:
            ok, data = await fetch_json(client, "https://api.llama.fi/v2/chains")
            if not ok or not isinstance(data, list):
                return _err(502, data if isinstance(data, dict)
                            else {"error": "Llama TVL unavailable"})
            chains = data
            if chain:
                chains = [c for c in chains
                          if str(c.get("name", "")).lower() == chain.lower()]
            chains = sorted(chains, key=lambda c: float(c.get("tvl") or 0),
                            reverse=True)[:limit]
            out = [{"chain": c.get("name"), "tvl": c.get("tvl"),
                    "tokenSymbol": c.get("tokenSymbol"),
                    "chainId": c.get("chainId")} for c in chains]
            return {"count": len(out), "chains": out,
                    "data_source": "llama-tvl", "fetched_at": _now()}
    except Exception as e:
        return _err(500, {"error": str(e)})


@app.get("/v1/forex/rates")
@app.get("/api/v1/forex/rates")
async def forex_rates(base: str = Query("USD", description="Base currency"),
                      symbols: str = Query("", description="CSV targets, e.g. EUR,MXN")):
    """Fiat exchange rates. Frankfurter (ECB data), no key."""
    try:
        params = {"base": base.upper()}
        if symbols:
            params["symbols"] = symbols.upper()
        async with httpx.AsyncClient(timeout=15) as client:
            ok, data = await fetch_json(
                client, "https://api.frankfurter.dev/v1/latest", params=params)
            if not ok:
                return _err(502, data)
            data["data_source"] = "frankfurter"
            data["fetched_at"] = _now()
            return data
    except Exception as e:
        return _err(500, {"error": str(e)})


@app.get("/v1/news/hackernews")
@app.get("/api/v1/news/hackernews")
async def news_hackernews(kind: str = Query("top", description="top|new|best"),
                          limit: int = Query(10, description="Max stories 1-25")):
    """Hacker News stories with metadata. Firebase API, no key."""
    if kind not in ("top", "new", "best"):
        return _err(400, {"error": f"Invalid kind: {kind}. Use top|new|best"})
    limit = max(1, min(limit, 25))
    try:
        async with httpx.AsyncClient(timeout=25) as client:
            ok, ids = await fetch_json(
                client, f"https://hacker-news.firebaseio.com/v0/{kind}stories.json")
            if not ok or not isinstance(ids, list):
                return _err(502, {"error": "HN API unavailable"})
            async def one(iid: int):
                ok2, item = await fetch_json(
                    client, f"https://hacker-news.firebaseio.com/v0/item/{iid}.json")
                if not ok2 or not isinstance(item, dict):
                    return None
                return {"id": item.get("id"), "title": item.get("title"),
                        "url": item.get("url"), "score": item.get("score"),
                        "by": item.get("by"), "time": item.get("time"),
                        "descendants": item.get("descendants")}
            items = [x for x in await asyncio.gather(
                * [one(i) for i in ids[:limit]]) if x]
            return {"kind": kind, "count": len(items), "stories": items,
                    "data_source": "hacker-news", "fetched_at": _now()}
    except Exception as e:
        return _err(500, {"error": str(e)})


# === SCALE PACK 2: toward 10 per category (all free, no keys) ===

@app.get("/v1/data/forecast")
@app.get("/api/v1/data/forecast")
async def data_forecast(lat: float = Query(...), lon: float = Query(...),
                        days: int = Query(7, description="Days 1-16")):
    """7-day forecast. Open-Meteo, no key."""
    days = max(1, min(days, 16))
    try:
        async with httpx.AsyncClient(timeout=15) as client:
            ok, data = await fetch_json(client,
                "https://api.open-meteo.com/v1/forecast",
                params={"latitude": lat, "longitude": lon,
                        "daily": "temperature_2m_max,temperature_2m_min,precipitation_sum,weathercode",
                        "timezone": "auto", "forecast_days": days})
            if not ok:
                return _err(502, data)
            return {"lat": lat, "lon": lon, "days": days,
                    "daily": data.get("daily", {}),
                    "data_source": "open-meteo", "fetched_at": _now()}
    except Exception as e:
        return _err(500, {"error": str(e)})


@app.get("/v1/data/airquality")
@app.get("/api/v1/data/airquality")
async def data_airquality(lat: float = Query(...), lon: float = Query(...)):
    """Current air quality. Open-Meteo AQ API, no key."""
    try:
        async with httpx.AsyncClient(timeout=15) as client:
            ok, data = await fetch_json(client,
                "https://air-quality-api.open-meteo.com/v1/air-quality",
                params={"latitude": lat, "longitude": lon,
                        "current": "us_aqi,pm2_5,pm10,nitrogen_dioxide,ozone"})
            if not ok:
                return _err(502, data)
            return {"lat": lat, "lon": lon, "current": data.get("current", {}),
                    "data_source": "open-meteo-aq", "fetched_at": _now()}
    except Exception as e:
        return _err(500, {"error": str(e)})


@app.get("/v1/data/define")
@app.get("/api/v1/data/define")
async def data_define(word: str = Query(..., description="Word to define"),
                      lang: str = Query("en", description="Language code")):
    """Dictionary definitions. Free Dictionary API, no key."""
    try:
        async with httpx.AsyncClient(timeout=15) as client:
            ok, data = await fetch_json(client,
                f"https://api.dictionaryapi.dev/api/v2/entries/{lang}/{word}")
            if not ok:
                return _err(404, {"error": f"No definition found: {word}"})
            out = []
            for entry in (data if isinstance(data, list) else [])[:3]:
                meanings = []
                for m in (entry.get("meanings") or [])[:3]:
                    defs = [{"definition": d.get("definition"),
                             "example": d.get("example")}
                            for d in (m.get("definitions") or [])[:3]]
                    meanings.append({"partOfSpeech": m.get("partOfSpeech"),
                                     "definitions": defs})
                out.append({"word": entry.get("word"),
                            "phonetic": entry.get("phonetic"),
                            "meanings": meanings})
            return {"query": word, "count": len(out), "entries": out,
                    "data_source": "dictionaryapi", "fetched_at": _now()}
    except Exception as e:
        return _err(500, {"error": str(e)})


@app.get("/v1/defi/protocols")
@app.get("/api/v1/defi/protocols")
async def defi_protocols(chain: str = Query("", description="Filter by chain"),
                         limit: int = Query(20, description="Max 1-100")):
    """DeFi protocols by TVL. Llama, no key."""
    limit = max(1, min(limit, 100))
    try:
        async with httpx.AsyncClient(timeout=25) as client:
            ok, data = await fetch_json(client, "https://api.llama.fi/protocols")
            if not ok or not isinstance(data, list):
                return _err(502, data if isinstance(data, dict)
                            else {"error": "Llama protocols unavailable"})
            protos = data
            if chain:
                chains_l = chain.lower()
                protos = [p for p in protos
                          if chains_l in [str(c).lower() for c in (p.get("chains") or [])]]
            protos = sorted(protos, key=lambda p: float(p.get("tvl") or 0),
                            reverse=True)[:limit]
            out = [{"name": p.get("name"), "symbol": p.get("symbol"),
                    "category": p.get("category"), "tvl": p.get("tvl"),
                    "chains": (p.get("chains") or [])[:8]} for p in protos]
            return {"count": len(out), "chain": chain or "all",
                    "protocols": out, "data_source": "llama-protocols",
                    "fetched_at": _now()}
    except Exception as e:
        return _err(500, {"error": str(e)})


@app.get("/v1/defi/dexs")
@app.get("/api/v1/defi/dexs")
async def defi_dexs(limit: int = Query(20, description="Max 1-100")):
    """DEX volume leaders. Llama, no key."""
    limit = max(1, min(limit, 100))
    try:
        async with httpx.AsyncClient(timeout=20) as client:
            ok, data = await fetch_json(client,
                "https://api.llama.fi/overview/dexs",
                params={"excludeTotalDataChart": "true",
                        "excludeTotalDataChartBreakdown": "true"})
            if not ok:
                return _err(502, data)
            protos = data.get("protocols", []) if isinstance(data, dict) else []
            protos = sorted(protos,
                            key=lambda p: float(p.get("total24h") or p.get("total7d") or 0),
                            reverse=True)[:limit]
            out = [{"name": p.get("displayName") or p.get("name"),
                    "volume_24h_usd": p.get("total24h"),
                    "volume_7d_usd": p.get("total7d")} for p in protos]
            return {"count": len(out), "dexs": out,
                    "data_source": "llama-dexs", "fetched_at": _now()}
    except Exception as e:
        return _err(500, {"error": str(e)})


@app.get("/v1/defi/stablecoinchains")
@app.get("/api/v1/defi/stablecoinchains")
async def defi_stablecoinchains(limit: int = Query(20, description="Max 1-100")):
    """Stablecoin distribution by chain. Llama, no key. Schema-agnostic."""
    limit = max(1, min(limit, 100))
    try:
        async with httpx.AsyncClient(timeout=20) as client:
            ok, data = await fetch_json(client,
                "https://stablecoins.llama.fi/stablecoinchains")
            if not ok or not isinstance(data, list):
                return _err(502, data if isinstance(data, dict)
                            else {"error": "Llama stablecoin chains unavailable"})

            def _num(r):
                return max([float(v) for v in r.values()
                            if isinstance(v, (int, float))], default=0)

            rows = []
            for c in data:
                if isinstance(c, dict):
                    rows.append({k: v for k, v in c.items()
                                 if isinstance(v, (int, float, str))})
            rows.sort(key=_num, reverse=True)
            return {"count": min(len(rows), limit), "chains": rows[:limit],
                    "data_source": "llama-stablecoinchains", "fetched_at": _now()}
    except Exception as e:
        return _err(500, {"error": str(e)})


@app.get("/v1/token/prices")
@app.get("/api/v1/token/prices")
async def token_prices(addresses: str = Query(..., description="CSV, max 10"),
                       chain: str = Query("ethereum", description="Chain")):
    """Batch token prices in ONE call. Llama Coins, no key."""
    addrs = [a.strip() for a in addresses.split(",") if a.strip()][:10]
    if not addrs:
        return _err(400, {"error": "Provide at least one address"})
    try:
        irs = ",".join(f"{chain.lower()}:{a}" for a in addrs)
        async with httpx.AsyncClient(timeout=20) as client:
            ok, data = await fetch_json(client,
                f"https://coins.llama.fi/prices/current/{irs}")
            if not ok:
                return _err(502, data)
            coins = (data.get("coins") or {}) if isinstance(data, dict) else {}
            out = {}
            for a in addrs:
                c = coins.get(f"{chain.lower()}:{a}") or coins.get(f"{chain.lower()}:{a.lower()}")
                out[a] = ({"price_usd": c.get("price"),
                           "symbol": c.get("symbol")} if c else None)
            return {"chain": chain, "prices": out,
                    "data_source": "llama", "fetched_at": _now()}
    except Exception as e:
        return _err(500, {"error": str(e)})


@app.get("/v1/token/gas")
@app.get("/api/v1/token/gas")
async def token_gas(chain: str = Query("ethereum", description="ethereum only")):
    """Live gas oracle. Etherscan (mainnet), no key."""
    if chain.lower() != "ethereum":
        return _err(400, {"error": "Gas oracle supports ethereum only"})
    try:
        async with httpx.AsyncClient(timeout=15) as client:
            ok, data = await fetch_json(client, "https://api.etherscan.io/api",
                params={"module": "gastracker", "action": "gasoracle"})
            if not ok or data.get("status") != "1":
                return _err(502, {"error": "Etherscan gas oracle unavailable"})
            r = data.get("result", {})
            return {"chain": "ethereum",
                    "safe_gwei": r.get("SafeGasPrice"),
                    "propose_gwei": r.get("ProposeGasPrice"),
                    "fast_gwei": r.get("FastGasPrice"),
                    "last_block": r.get("LastBlock"),
                    "data_source": "etherscan", "fetched_at": _now()}
    except Exception as e:
        return _err(500, {"error": str(e)})


@app.get("/v1/maps/reverse")
@app.get("/api/v1/maps/reverse")
async def maps_reverse(lat: float = Query(...), lon: float = Query(...)):
    """Coords → address. Nominatim reverse, no key."""
    try:
        async with httpx.AsyncClient(timeout=15) as client:
            ok, data = await fetch_json(client,
                "https://nominatim.openstreetmap.org/reverse",
                params={"lat": lat, "lon": lon, "format": "json"})
            if not ok or not data.get("display_name"):
                return _err(502, {"error": "Nominatim reverse unavailable"})
            return {"lat": lat, "lon": lon,
                    "address": data.get("display_name"),
                    "details": data.get("address", {}),
                    "type": data.get("type"),
                    "data_source": "nominatim", "fetched_at": _now()}
    except Exception as e:
        return _err(500, {"error": str(e)})


@app.get("/v1/news/hn-item")
@app.get("/api/v1/news/hn-item")
async def news_hn_item(id: int = Query(..., description="HN item id")):
    """Single HN item. Firebase API, no key."""
    try:
        async with httpx.AsyncClient(timeout=15) as client:
            ok, item = await fetch_json(client,
                f"https://hacker-news.firebaseio.com/v0/item/{id}.json")
            if not ok or not isinstance(item, dict) or not item.get("id"):
                return _err(404, {"error": f"HN item not found: {id}"})
            if isinstance(item.get("text"), str):
                item["text"] = item["text"][:500]
            return {**{k: item.get(k) for k in
                       ("id", "title", "url", "score", "by", "time",
                        "descendants", "text")},
                    "data_source": "hacker-news", "fetched_at": _now()}
    except Exception as e:
        return _err(500, {"error": str(e)})


@app.get("/v1/news/hn-user")
@app.get("/api/v1/news/hn-user")
async def news_hn_user(username: str = Query(..., description="HN username")):
    """HN user profile + karma. Firebase API, no key."""
    try:
        async with httpx.AsyncClient(timeout=15) as client:
            ok, u = await fetch_json(client,
                f"https://hacker-news.firebaseio.com/v0/user/{username}.json")
            if not ok or not isinstance(u, dict) or not u.get("id"):
                return _err(404, {"error": f"HN user not found: {username}"})
            return {"id": u.get("id"), "karma": u.get("karma"),
                    "created": u.get("created"),
                    "about": str(u.get("about", ""))[:500],
                    "submitted_count": len(u.get("submitted") or []),
                    "data_source": "hacker-news", "fetched_at": _now()}
    except Exception as e:
        return _err(500, {"error": str(e)})


@app.get("/v1/forex/history")
@app.get("/api/v1/forex/history")
async def forex_history(start: str = Query(..., description="YYYY-MM-DD"),
                        end: str = Query(..., description="YYYY-MM-DD"),
                        base: str = Query("USD", description="Base currency"),
                        symbols: str = Query("", description="CSV targets")):
    """Historical FX range. Frankfurter, no key."""
    if not re.match(r"^\d{4}-\d{2}-\d{2}$", start) or not re.match(r"^\d{4}-\d{2}-\d{2}$", end):
        return _err(400, {"error": "Dates must be YYYY-MM-DD"})
    try:
        params = {"base": base.upper()}
        if symbols:
            params["symbols"] = symbols.upper()
        async with httpx.AsyncClient(timeout=20) as client:
            ok, data = await fetch_json(client,
                f"https://api.frankfurter.dev/v1/{start}..{end}", params=params)
            if not ok:
                return _err(502, data)
            data["data_source"] = "frankfurter"
            data["fetched_at"] = _now()
            return data
    except Exception as e:
        return _err(500, {"error": str(e)})


@app.get("/v1/web/geoip")
@app.get("/api/v1/web/geoip")
async def web_geoip(ip: str = Query(..., description="IPv4 address")):
    """IP → geo + ISP. ip-api free tier, no key."""
    try:
        async with httpx.AsyncClient(timeout=15) as client:
            ok, data = await fetch_json(client,
                f"http://ip-api.com/json/{ip}",
                params={"fields": "status,message,country,city,lat,lon,isp,org,query"})
            if not ok or data.get("status") != "success":
                return _err(404 if data.get("message") else 502,
                            {"error": data.get("message") or "GeoIP unavailable",
                             "ip": ip})
            data["data_source"] = "ip-api"
            data["fetched_at"] = _now()
            return data
    except Exception as e:
        return _err(500, {"error": str(e)})


if __name__ == "__main__":
    import uvicorn

    port = int(os.getenv("PORT", "4020"))
    print("=== aetheriusxAPI Starting ===")
    print(f"Version: {VERSION} | Mode: {X402_MODE} | Network: {NETWORK}")
    print(f"Wallet: {PAY_TO} | Port: {port}")
    for route, price in PRICES.items():
        print(f"GET {route:<24} {price}/call  (+ legacy /api{route})")
    print("==============================")
    uvicorn.run(app, host="0.0.0.0", port=port)
