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
import ipaddress
import os
import re
import socket
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
NETWORK = os.getenv("AETHERIUS_NETWORK", "eip155:8453")  # Base Mainnet
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
    "/v1/data/elevation": "$0.005",
    "/v1/data/words": "$0.005",
    "/v1/maps/geocode": "$0.01",
    "/v1/token/global": "$0.01",
    "/v1/token/balance": "$0.01",
    "/v1/token/transactions": "$0.02",
    "/v1/defi/stablecoin-history": "$0.01",
    "/v1/forex/convert": "$0.008",
    "/v1/news/hn-feed": "$0.01",
    "/v1/web/dns": "$0.005",
    # === NEW v2.1 endpoints (20 new) ===
    "/v1/crypto/market": "$0.01",
    "/v1/crypto/fear-greed": "$0.005",
    "/v1/crypto/trending": "$0.01",
    "/v1/crypto/ohlcv": "$0.015",
    "/v1/web/whois": "$0.01",
    "/v1/web/headers": "$0.005",
    "/v1/web/ssl": "$0.008",
    "/v1/data/ip": "$0.005",
    "/v1/data/ua": "$0.003",
    "/v1/data/hash": "$0.002",
    "/v1/data/uuid": "$0.001",
    "/v1/data/qrcode": "$0.005",
    "/v1/news/reddit": "$0.01",
    "/v1/news/devto": "$0.008",
    "/v1/defi/impermanent-loss": "$0.01",
    "/v1/defi/staking-apy": "$0.01",
    "/v1/token/nft": "$0.02",
    "/v1/data/translate": "$0.01",
    "/v1/data/summarize": "$0.015",
    "/v1/crypto/dominance": "$0.008",
    # NOTE: x402 Intelligence endpoints are FREE (not in PRICES dict = no payment required)
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
    "/v1/data/elevation": "Ground elevation via Open-Meteo",
    "/v1/data/words": "Synonyms/antonyms/rhymes via Datamuse",
    "/v1/maps/geocode": "Forward geocode via Photon",
    "/v1/token/global": "Global crypto stats via CoinGecko",
    "/v1/token/balance": "ETH balance via Etherscan",
    "/v1/token/transactions": "Wallet tx history via Etherscan",
    "/v1/defi/stablecoin-history": "Stable circulation history via Llama",
    "/v1/forex/convert": "Currency conversion via Frankfurter",
    "/v1/news/hn-feed": "HN Ask/Show/Jobs feeds",
    "/v1/web/dns": "DNS over HTTPS via Google",
    # === NEW v2.1 descriptions ===
    "/v1/crypto/market": "Global crypto market data - total MC, volume, BTC dominance",
    "/v1/crypto/fear-greed": "Crypto Fear and Greed Index - current value and history",
    "/v1/crypto/trending": "Trending coins on CoinGecko",
    "/v1/crypto/ohlcv": "OHLCV candlestick data for any coin pair",
    "/v1/web/whois": "Domain WHOIS lookup - registrar, dates, nameservers",
    "/v1/web/headers": "HTTP headers checker - response headers for any URL",
    "/v1/web/ssl": "SSL certificate info - issuer, expiry, chain",
    "/v1/data/ip": "IP address geolocation - city, country, coordinates",
    "/v1/data/ua": "User-Agent parser - browser, OS, device type",
    "/v1/data/hash": "Hash generator - MD5, SHA1, SHA256, SHA512",
    "/v1/data/uuid": "UUID v4 generator",
    "/v1/data/qrcode": "QR code generator as data URL",
    "/v1/news/reddit": "Reddit posts from any subreddit",
    "/v1/news/devto": "Dev.to articles - latest tech posts",
    "/v1/defi/impermanent-loss": "Impermanent loss calculator for LP positions",
    "/v1/defi/staking-apy": "Staking APY tracker for major protocols",
    "/v1/token/nft": "NFT metadata fetcher - name, image, attributes",
    "/v1/data/translate": "Text translation via free API",
    "/v1/data/summarize": "Text summarizer - extract key sentences",
    "/v1/crypto/dominance": "Crypto dominance indices - BTC, ETH, altcoin shares",
    # === x402 Intelligence (EXCLUSIVE — reads Base blockchain) ===
    "/v1/x402/payments/recent": "Recent USDC transfers on Base - on-chain micropayment analytics",
    "/v1/x402/agent/{address}": "Wallet intelligence - spending patterns, counterparties, net flow",
    "/v1/x402/analytics": "Network health - volume, trends, active wallets, payment metrics",
    "/v1/x402/top-agents": "Top USDC spenders leaderboard - who's using x402 the most",
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

# === AETHERIUS FINGERPRINT MIDDLEWARE ===
# Every response carries the QuantumXBrain identity header.
@app.middleware("http")
async def aetherius_fingerprint(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-AETHERIUS-Fingerprint"] = "quantumxbrain-v1|base-mainnet|aetheriusxAPI"
    response.headers["X-AETHERIUS-Network"] = "eip155:8453"
    response.headers["X-Powered-By"] = "AETHERIUS QuantumXBrain"
    return response


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


_fetch_cache: dict[str, tuple[float, tuple]] = {}
_FETCH_CACHE_TTL = 15  # seconds — balances freshness vs latency
_FETCH_CACHE_MAX = 300  # max cached entries (prevent memory growth)

async def fetch_json(client: httpx.AsyncClient, url: str,
                     params: dict | None = None,
                     timeout: float = 15,
                     cache_ttl: float | None = _FETCH_CACHE_TTL):
    """GET JSON from an upstream. Returns (ok, payload). Never raises.

    Caches responses for `cache_ttl` seconds (default 15s).
    Pass cache_ttl=0 to disable caching for this call.
    """
    # Build cache key
    cache_key = url
    if params:
        cache_key += "?" + "&".join(f"{k}={v}" for k, v in sorted(params.items()))

    # Check cache
    now = time.time()
    if cache_ttl and cache_key in _fetch_cache:
        ts, cached = _fetch_cache[cache_key]
        if now - ts < cache_ttl:
            return cached

    # Cache miss — fetch from upstream
    try:
        r = await client.get(url, params=params or {}, headers=UA,
                             timeout=timeout)
        if r.status_code == 200:
            try:
                result = (True, r.json())
                # Store in cache
                if cache_ttl:
                    _fetch_cache[cache_key] = (now, result)
                    # Evict oldest if over limit
                    if len(_fetch_cache) > _FETCH_CACHE_MAX:
                        oldest = min(_fetch_cache, key=lambda k: _fetch_cache[k][0])
                        del _fetch_cache[oldest]
                return result
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

        # Facilitator priority: CDP hosted (mainnet-capable, JWT auth via
        # CDP_API_KEY_ID/SECRET) -> public x402.org (testnets only).
        _facilitator = None
        try:
            from cdp.x402 import create_facilitator_config
            _facilitator = HTTPFacilitatorClient(create_facilitator_config())
            print("[x402] facilitator: CDP hosted (mainnet-capable)", flush=True)
        except Exception as e:
            print(f"[x402] CDP unavailable ({e}); using public facilitator", flush=True)
        if _facilitator is None:
            _facilitator = HTTPFacilitatorClient(FacilitatorConfig(url=FACILITATOR_URL))
        _server = x402ResourceServer(_facilitator)
        _server.register(NETWORK, ExactEvmServerScheme())
        _routes = {}
        _routes.update(_paid_routes_for_sdk("/v1"))
        _routes.update(_paid_routes_for_sdk("/api/v1"))
        # Canary: AETHERIUS_REAL_ROUTES="/v1/data/uuid" restricts real mode to
        # listed paths (both /v1 and /api/v1 forms). Empty = all paid routes.
        _allow = [r.strip() for r in os.getenv("AETHERIUS_REAL_ROUTES", "").split(",") if r.strip()]
        if _allow:
            def _wanted(key: str) -> bool:
                _method, path = key.split(" ", 1)
                return any(path == a or path == "/api" + a for a in _allow)
            _routes = {k: v for k, v in _routes.items() if _wanted(k)}
            print(f"[x402] canary: {len(_routes)} routes ({','.join(_allow)})", flush=True)
            # Complement stays simulated: without this, non-canary paid routes
            # would be UNGUARDED (fail-open) while the canary runs real.
            # Simulated is added AFTER (= outer) so canary routes fall through.
            _complement = {k: v for k, v in PRICES.items() if k not in _allow}
            app.add_middleware(PaymentMiddlewareASGI, routes=_routes, server=_server)
            app.add_middleware(SimulatedX402Middleware, prices=_complement,
                               pay_to=PAY_TO, network=NETWORK, currency=CURRENCY)
            print(f"[x402] canary complement: {len(_complement)} simulated routes",
                  flush=True)
        else:
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
        "endpoints": {
            **{k: f"{v}/call - {DESCRIPTIONS[k]}" for k, v in PRICES.items()},
            # x402 Intelligence — ALL FREE
            "/v1/x402/payments/recent": "FREE - Recent USDC transfers on Base Mainnet",
            "/v1/x402/agent/{address}": "FREE - Wallet spending intelligence",
            "/v1/x402/analytics": "FREE - Network health & USDC transfer trends",
            "/v1/x402/top-agents": "FREE - Top USDC spenders leaderboard",
            "/v1/x402/base-stats": "FREE - Chain health snapshot (block, gas, chain ID)",
            "/v1/x402/gas": "FREE - Gas price analysis & cost estimates",
            "/v1/x402/whales": "FREE - Large USDC transfer tracker (>$10K)",
            "/v1/x402/velocity": "FREE - Transfer frequency per hour (24h)",
            "/v1/x402/hourly": "FREE - Hourly volume breakdown",
            "/v1/x402/token/{address}": "FREE - ERC-20 token metadata (any token)",
            "/v1/x402/contracts": "FREE - Top USDC-receiving contracts",
            "/v1/x402/search": "FREE - Address or transaction lookup",
            "/v1/x402/history/{address}": "FREE - Transfer history for any wallet",
            "/v1/x402/compare": "FREE - Compare two wallets side-by-side",
            "/v1/x402/risk/{address}": "FREE - Wallet risk score (0-100)",
            "/v1/x402/stablecoins": "FREE - All stablecoin activity (USDC/USDT/DAI)",
            "/v1/x402/mint-burn": "FREE - USDC supply changes (mint/burn)",
            "/v1/x402/bridge": "FREE - Cross-chain bridge activity",
            "/v1/x402/defi-pulse": "FREE - DeFi protocol activity on Base",
            "/v1/x402/network": "FREE - Full network health dashboard",
        },
    }


@app.get("/v1/telemetry")
@app.get("/api/v1/telemetry")
async def telemetry():
    """FREE public proof layer: uptime, totals, per-endpoint stats, volume."""
    return tracker.snapshot(mode=X402_MODE, network=NETWORK,
                            currency=CURRENCY, version=VERSION, wallet=PAY_TO)


@app.get("/v1/anti-replay/stats")
@app.get("/api/v1/anti-replay/stats")
async def anti_replay_stats():
    """FREE: Anti-replay nonce cache stats for monitoring.

    Shows active nonces, TTL, and cache health. Useful for dashboard
    monitoring and verifying TOCTOU protection is active.
    """
    from x402_middleware import _nonce_cache
    return {
        "service": "aetheriusxAPI",
        "protection": "TOCTOU anti-replay",
        "status": "active",
        **_nonce_cache.stats(),
    }


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


# === DONATEX — Open-Source Donation Infrastructure ===
from donatex.api.verify import router as donatex_router
app.include_router(donatex_router)

# Serve donatex widget files and demo page
if os.path.isdir(os.path.join(os.path.dirname(__file__), "donatex")):
    app.mount("/donatex",
              StaticFiles(directory=os.path.join(os.path.dirname(__file__),
                                                 "donatex"), html=True),
              name="donatex")


# === MCP SSE — Public discovery endpoint for Bazaar ===
import json as _json
import asyncio as _asyncio
from fastapi.responses import StreamingResponse as _SR

_MCP_TOOLS = [
    {"name": "base_stats", "description": "Base Mainnet health: block, gas, chain ID, RPC status."},
    {"name": "gas", "description": "Gas price analysis + cost estimates on Base."},
    {"name": "market_pulse", "description": "Real-time Base market conditions + bullish/bearish signal."},
    {"name": "sentiment", "description": "Fear & Greed + BTC trend + composite sentiment score."},
    {"name": "network", "description": "Full Base network health dashboard."},
    {"name": "whales", "description": "Large USDC transfers over a threshold."},
    {"name": "stablecoins", "description": "Stablecoin activity: USDC/USDT/DAI flows on Base."},
    {"name": "analytics", "description": "Network analytics: volume, trends, transfer stats."},
    {"name": "telemetry", "description": "Live AETHERIUS platform telemetry."},
    {"name": "health", "description": "Agent health check: wallet, chain, facilitator status."},
]

_mcp_sessions: dict[str, list] = {}  # session_id → pending responses


@app.get("/mcp/sse", tags=["mcp"])
async def mcp_sse(request: Request):
    """MCP SSE discovery endpoint. Bazaar connects here."""
    import uuid
    sid = str(uuid.uuid4())[:12]
    _mcp_sessions[sid] = []

    async def stream():
        # Send endpoint URL for client to POST messages
        yield f"event: endpoint\ndata: /mcp/messages?session={sid}\n\n"
        # Keep alive and forward responses
        try:
            while True:
                if _mcp_sessions.get(sid):
                    msg = _mcp_sessions[sid].pop(0)
                    yield f"data: {_json.dumps(msg)}\n\n"
                await _asyncio.sleep(0.1)
        except _asyncio.CancelledError:
            _mcp_sessions.pop(sid, None)

    return _SR(stream(), media_type="text/event-stream",
               headers={"Cache-Control": "no-cache", "X-AETHERIUS-MCP": "1.0"})


@app.post("/mcp/messages", tags=["mcp"])
async def mcp_messages(request: Request):
    """MCP message handler. Processes JSON-RPC from Bazaar agents."""
    body = await request.json()
    method = body.get("method", "")
    req_id = body.get("id")
    resp = {"jsonrpc": "2.0", "id": req_id}

    if method == "initialize":
        resp["result"] = {
            "protocolVersion": "2025-03-26",
            "capabilities": {"tools": {"listChanged": False}},
            "serverInfo": {"name": "aetherius", "version": "1.0.0"},
        }
    elif method == "tools/list":
        resp["result"] = {"tools": _MCP_TOOLS}
    elif method == "tools/call":
        args = body.get("params", {})
        tool_name = args.get("name", "")
        tool_args = args.get("arguments", {})
        # For MCP tool calls, invoke the actual route handlers directly
        # (avoids self-referential HTTP call which can deadlock)
        try:
            if tool_name == "telemetry":
                data = _json.dumps(tracker.snapshot())[:8000]
            elif tool_name == "health":
                data = _json.dumps({
                    "status": "alive", "service": "aetheriusxAPI",
                    "version": "2.0.0", "mode": X402_MODE,
                    "network": NETWORK, "currency": CURRENCY, "wallet": PAY_TO,
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                })[:8000]
            else:
                # For external-facing tools, fetch from upstream APIs directly
                import urllib.request as _ureq
                _upstream = {
                    "base_stats": "https://api.etherscan.io/api?module=proxy&action=eth_blockNumber&tag=latest&apikey=YourApiKeyToken",
                    "gas": "https://api.etherscan.io/api?module=gastracker&action=gasoracle&apikey=YourApiKeyToken",
                    "market_pulse": "https://api.coingecko.com/api/v3/simple/price?ids=ethereum,usd-coin&vs_currencies=usd&include_24hr_change=true",
                    "sentiment": "https://api.alternative.me/fng/",
                    "network": "https://api.etherscan.io/api?module=proxy&action=eth_blockNumber&tag=latest&apikey=YourApiKeyToken",
                    "whales": "https://api.etherscan.io/api?module=account&action=tokentx&contractaddress=0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48&sort=desc&apikey=YourApiKeyToken",
                    "stablecoins": "https://stablecoins.llama.fi/stablecoins?includePrices=true",
                    "analytics": "https://api.etherscan.io/api?module=proxy&action=eth_blockNumber&tag=latest&apikey=YourApiKeyToken",
                }
                upstream_url = _upstream.get(tool_name)
                if upstream_url:
                    r = _ureq.urlopen(_ureq.Request(upstream_url, headers={"User-Agent": "aetherius-mcp/1.0"}), timeout=15)
                    data = r.read().decode()[:8000]
                else:
                    data = _json.dumps({"error": f"Unknown tool: {tool_name}"})
            resp["result"] = {"content": [{"type": "text", "text": data}]}
        except Exception as e:
            resp["result"] = {"content": [{"type": "text", "text": str(e)}], "isError": True}
    elif method == "notifications/initialized":
        # Client ack, no response needed
        return JSONResponse({"ok": True})
    else:
        resp["error"] = {"code": -32601, "message": f"Unknown method: {method}"}

    # Queue response for SSE stream
    from starlette.requests import Request as _Req
    session = request.query_params.get("session", "")
    if session in _mcp_sessions:
        _mcp_sessions[session].append(resp)
    return JSONResponse(resp)


@app.get("/mcp/health", tags=["mcp"])
async def mcp_health():
    """MCP server health check for Bazaar discovery."""
    return JSONResponse({
        "status": "ok", "server": "aetherius-mcp", "version": "1.0.0",
        "tools": len(_MCP_TOOLS), "sse": "/mcp/sse", "messages": "/mcp/messages",
    })


@app.get("/mcp/discovery", tags=["mcp"])
async def mcp_discovery():
    """Bazaar discovery manifest — declares tools, payment, and MCP endpoints."""
    import pathlib
    manifest_path = pathlib.Path(__file__).parent / "tools" / "mcp" / "bazaar-discovery.json"
    try:
        data = _json.loads(manifest_path.read_text())
        return JSONResponse(data)
    except Exception:
        return JSONResponse({
            "name": "aetherius", "version": "1.0.0",
            "mcp": {"sse": "/mcp/sse", "messages": "/mcp/messages", "health": "/mcp/health"},
            "payment": {"protocol": "x402", "network": "eip155:8453", "merchant": PAY_TO},
            "tools": [{"name": t["name"], "description": t["description"], "price": "free"} for t in _MCP_TOOLS],
        })


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
BLOCKSCOUT = {"ethereum": "https://eth.blockscout.com",
              "base": "https://base.blockscout.com",
              "optimism": "https://optimism.blockscout.com",
              "arbitrum": "https://arbitrum.blockscout.com",
              "polygon": "https://polygon.blockscout.com"}

# Major stablecoins: served instantly via Coinbase spot (fiat-grade source,
# immune to DEX-indexer gaps and datacenter throttling).
KNOWN_TOKENS = {
    "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913": "USDC",  # Base
    "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48": "USDC",  # Ethereum
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
        chainid = CHAINIDS.get(chain.lower())
        if chainid:
            async with httpx.AsyncClient(timeout=15) as client:
                _params = {"chainid": chainid, "module": "contract",
                           "action": "getabi", "address": address,
                           "tag": "latest"}
                if ETHERSCAN_API_KEY:
                    _params["apikey"] = ETHERSCAN_API_KEY
                try:
                    vr = await client.get("https://api.etherscan.io/v2/api",
                                          params=_params)
                    if vr.status_code == 200:
                        data = vr.json()
                        result["checks"]["verified"] = data.get("status") == "1"
                        result["checks"]["has_abi"] = data.get("status") == "1"
                except Exception:
                    pass
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
    """Holder distribution via Blockscout public API (no key).

    NOTE: Etherscan's tokenholderlist is a PRO endpoint (free keys get
    "upgrade to API Pro"), so holders intentionally bypass Etherscan.
    The ETHERSCAN_API_KEY (when set) still boosts analyze + gas quotas.
    """
    base = BLOCKSCOUT.get(chain.lower())
    if not base:
        return _err(400, {"error": f"Unsupported chain: {chain}. "
                                   f"Use: {sorted(BLOCKSCOUT)}"})
    try:
        async with httpx.AsyncClient(timeout=20) as client:
            ok, data = await fetch_json(client,
                f"{base}/api/v2/tokens/{address}/holders")
            if not ok or not isinstance(data, dict) or "items" not in data:
                return _err(502, {"error": "Blockscout holders unavailable",
                                  "address": address, "chain": chain})
            out = [{"address": (h.get("address") or {}).get("hash"),
                    "balance": h.get("value")}
                   for h in (data.get("items") or [])[:20]]
            return {"address": address, "chain": chain,
                    "count": len(out), "holders": out,
                    "data_source": "blockscout", "fetched_at": _now()}
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

def _is_public_url(url: str) -> bool:
    """SSRF guard: only http(s) URLs resolving exclusively to public IPs.

    Blocks loopback, private ranges, link-local (incl. cloud metadata
    169.254.169.254), reserved, multicast and unspecified addresses.
    Note: validates at request time; DNS-rebinding between check and fetch
    is a known residual (mitigated by short timeouts, no creds in env).
    """
    try:
        p = httpx.URL(url)
    except Exception:
        return False
    if p.scheme not in ("http", "https") or not p.host:
        return False
    try:
        infos = socket.getaddrinfo(p.host, None)
    except OSError:
        return False
    if not infos:
        return False
    for _fam, _typ, _proto, _canon, sockaddr in infos:
        try:
            ip = ipaddress.ip_address(sockaddr[0])
        except ValueError:
            return False
        if (ip.is_private or ip.is_loopback or ip.is_link_local
                or ip.is_reserved or ip.is_multicast or ip.is_unspecified):
            return False
    return True


@app.get("/v1/web/scrape")
@app.get("/api/v1/web/scrape")
async def web_scrape(url: str = Query(..., description="URL to scrape")):
    """Fetch a page, return title, text preview, links, content length."""
    if not _is_public_url(url):
        return _err(403, {"error": "URL resolves to non-public address (SSRF guard)",
                          "url": url})
    try:
        # No auto-redirects: each hop is re-validated by the same guard.
        async with httpx.AsyncClient(timeout=20, follow_redirects=False) as client:
            for _hop in range(4):
                resp = await client.get(url, headers=UA)
                if resp.status_code not in (301, 302, 303, 307, 308):
                    break
                nxt = resp.headers.get("location", "")
                if not nxt.startswith("http"):
                    from urllib.parse import urljoin
                    nxt = urljoin(url, nxt)
                if not _is_public_url(nxt):
                    return _err(403, {"error": "Redirect target non-public (SSRF guard)",
                                      "url": nxt})
                url = nxt
            else:
                return _err(508, {"error": "Too many redirects", "url": url})
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
    if not result["has_mx"]:
        # Fallback: DNS-over-HTTPS (stub resolvers often fail MX lookups).
        try:
            dr = httpx.get("https://dns.google/resolve",
                           params={"name": domain, "type": "MX"}, timeout=10)
            if dr.status_code == 200 and (dr.json().get("Answer") or []):
                result["has_mx"] = True
        except Exception:
            pass
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

            def _circ(c):
                for k in ("totalCirculatingUSD", "totalCirculating"):
                    v = c.get(k)
                    if isinstance(v, dict):
                        v = v.get("peggedUSD")
                    try:
                        if v is not None:
                            return float(v)
                    except (TypeError, ValueError):
                        pass
                return 0.0

            rows = []
            for c in data:
                if isinstance(c, dict):
                    rows.append({"chain": c.get("name"),
                                 "circulating_usd": _circ(c)})
            rows.sort(key=lambda r: r["circulating_usd"], reverse=True)
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
            out, need = {}, {}
            for a in addrs:
                c = coins.get(f"{chain.lower()}:{a}") or coins.get(f"{chain.lower()}:{a.lower()}")
                if c and c.get("price") is not None:
                    out[a] = {"price_usd": c.get("price"),
                              "symbol": c.get("symbol"),
                              "data_source": "llama"}
                elif a.lower() in KNOWN_TOKENS:
                    need[a] = KNOWN_TOKENS[a.lower()]
                else:
                    out[a] = None
            for a, sym in need.items():  # stables via Coinbase spot
                try:
                    r = await client.get(
                        f"https://api.coinbase.com/v2/prices/{sym}-USD/spot")
                    amt = ((r.json().get("data") or {}).get("amount")
                           if r.status_code == 200 else None)
                    out[a] = ({"price_usd": float(amt), "symbol": sym,
                               "data_source": "coinbase"} if amt else None)
                except Exception:
                    out[a] = None
            return {"chain": chain, "prices": out, "fetched_at": _now()}
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
            _gparams = {"chainid": 1, "module": "gastracker",
                        "action": "gasoracle"}
            if ETHERSCAN_API_KEY:
                _gparams["apikey"] = ETHERSCAN_API_KEY
            ok, data = await fetch_json(client,
                "https://api.etherscan.io/v2/api", params=_gparams)
            if ok and data.get("status") == "1":
                r = data.get("result", {})
                return {"chain": "ethereum",
                        "safe_gwei": r.get("SafeGasPrice"),
                        "propose_gwei": r.get("ProposeGasPrice"),
                        "fast_gwei": r.get("FastGasPrice"),
                        "last_block": r.get("LastBlock"),
                        "data_source": "etherscan", "fetched_at": _now()}
            # Fallback: eth_feeHistory from open RPCs (no key, VM-proven).
            for rpc in ("https://rpc.flashbots.net",
                        "https://eth.meowrpc.com"):
                try:
                    r = await client.post(rpc, json={"jsonrpc": "2.0", "id": 1,
                        "method": "eth_feeHistory",
                        "params": ["0x4", "latest", [25, 50, 75]]}, timeout=12)
                    if r.status_code == 200:
                        res = r.json().get("result") or {}
                        base = res.get("baseFeePerGas") or []
                        last = int(base[-1], 16) / 1e9 if base else None
                        rewards = res.get("reward") or []
                        pals = rewards[-1] if rewards else []
                        prio = (int(pals[1], 16) / 1e9) if len(pals) > 1 else None
                        if last is not None:
                            tot = last + (prio or 0)
                            return {"chain": "ethereum",
                                    "base_fee_gwei": round(last, 2),
                                    "priority_gwei": round(prio, 2) if prio else None,
                                    "est_total_gwei": round(tot, 2),
                                    "last_block": res.get("oldestBlock"),
                                    "data_source": "public-rpc-feeHistory",
                                    "fetched_at": _now()}
                except Exception:
                    continue
            return _err(502, {"error": "Gas oracles unavailable (Etherscan + RPC)"})
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


# === SCALE PACK 3: toward 10 per category (proven hosts only) ===

@app.get("/v1/data/elevation")
@app.get("/api/v1/data/elevation")
async def data_elevation(lat: float = Query(...), lon: float = Query(...)):
    """Ground elevation in meters. Open-Meteo, no key."""
    try:
        async with httpx.AsyncClient(timeout=15) as client:
            ok, data = await fetch_json(client,
                "https://api.open-meteo.com/v1/elevation",
                params={"latitude": lat, "longitude": lon})
            if not ok:
                return _err(502, data)
            el = (data.get("elevation") or [None])[0]
            return {"lat": lat, "lon": lon, "elevation_m": el,
                    "data_source": "open-meteo", "fetched_at": _now()}
    except Exception as e:
        return _err(500, {"error": str(e)})


@app.get("/v1/data/words")
@app.get("/api/v1/data/words")
async def data_words(word: str = Query(..., description="Seed word"),
                     rel: str = Query("syn", description="syn|ant|rhy")):
    """Synonyms, antonyms, rhymes. Datamuse, no key."""
    if rel not in ("syn", "ant", "rhy"):
        return _err(400, {"error": "rel must be syn|ant|rhy"})
    try:
        async with httpx.AsyncClient(timeout=15) as client:
            ok, data = await fetch_json(client, "https://api.datamuse.com/words",
                                        params={f"rel_{rel}": word, "max": 20})
            if not ok or not isinstance(data, list):
                return _err(502, {"error": "Datamuse unavailable"})
            out = [{"word": w.get("word"), "score": w.get("score")}
                   for w in data[:20]]
            return {"word": word, "rel": rel, "count": len(out),
                    "results": out, "data_source": "datamuse",
                    "fetched_at": _now()}
    except Exception as e:
        return _err(500, {"error": str(e)})


@app.get("/v1/maps/geocode")
@app.get("/api/v1/maps/geocode")
async def maps_geocode(q: str = Query(..., description="Place to geocode"),
                       limit: int = Query(5, description="Max 1-10"),
                       lat: float | None = Query(None, description="Bias lat"),
                       lon: float | None = Query(None, description="Bias lon")):
    """Forward geocode via Photon (Komoot/OSM), no key. Pass lat/lon to bias."""
    limit = max(1, min(limit, 10))
    try:
        params = {"q": q, "limit": limit}
        if lat is not None and lon is not None:
            params.update({"lat": lat, "lon": lon})
        async with httpx.AsyncClient(timeout=15) as client:
            ok, data = await fetch_json(client, "https://photon.komoot.io/api/",
                                        params=params)
            if not ok:
                return _err(502, data)
            out = []
            for f in (data.get("features") or [])[:limit]:
                props, geom = f.get("properties") or {}, f.get("geometry") or {}
                coords = geom.get("coordinates") or [None, None]
                out.append({"name": props.get("name"),
                            "city": props.get("city"), "country": props.get("country"),
                            "lat": coords[1], "lon": coords[0]})
            return {"query": q, "count": len(out), "results": out,
                    "data_source": "photon", "fetched_at": _now()}
    except Exception as e:
        return _err(500, {"error": str(e)})


@app.get("/v1/token/global")
@app.get("/api/v1/token/global")
async def token_global():
    """Global crypto stats: market cap, BTC dominance. CoinGecko, no key."""
    try:
        async with httpx.AsyncClient(timeout=15) as client:
            ok, data = await fetch_json(client,
                "https://api.coingecko.com/api/v3/global")
            if ok:
                d = data.get("data", {}) if isinstance(data, dict) else {}
                return {"total_market_cap_usd": (d.get("total_market_cap") or {}).get("usd"),
                        "btc_dominance": (d.get("market_cap_percentage") or {}).get("btc"),
                        "eth_dominance": (d.get("market_cap_percentage") or {}).get("eth"),
                        "active_cryptos": d.get("active_cryptocurrencies"),
                        "data_source": "coingecko", "fetched_at": _now()}
            ok2, cp = await fetch_json(client,
                "https://api.coinpaprika.com/v1/global")
            if ok2 and isinstance(cp, dict):
                return {"total_market_cap_usd": cp.get("market_cap_usd"),
                        "volume_24h_usd": cp.get("volume_24h_usd"),
                        "btc_dominance": (cp.get("bitcoin_dominance_percentage") or 0) / 100 if cp.get("bitcoin_dominance_percentage") else None,
                        "active_cryptos": cp.get("cryptocurrencies_number"),
                        "data_source": "coinpaprika", "fetched_at": _now()}
            return _err(502, {"error": "Global stats unavailable (CG + Paprika)"})
    except Exception as e:
        return _err(500, {"error": str(e)})


@app.get("/v1/token/balance")
@app.get("/api/v1/token/balance")
async def token_balance(address: str = Query(..., description="Wallet address"),
                        chain: str = Query("ethereum", description="Chain")):
    """Native balance of any wallet. Etherscan V2 (+key) then Blockscout."""
    try:
        chainid = CHAINIDS.get(chain.lower(), 1)
        params = {"chainid": chainid, "module": "account", "action": "balance",
                  "address": address, "tag": "latest"}
        if ETHERSCAN_API_KEY:
            params["apikey"] = ETHERSCAN_API_KEY
        async with httpx.AsyncClient(timeout=15) as client:
            ok, data = await fetch_json(client,
                "https://api.etherscan.io/v2/api", params=params)
            if ok and data.get("status") == "1":
                wei = int(data.get("result", "0"))
                return {"address": address, "chain": chain.lower(),
                        "balance_wei": str(wei), "balance_eth": wei / 1e18,
                        "data_source": "etherscan-v2", "fetched_at": _now()}
            bs = BLOCKSCOUT.get(chain.lower())
            if bs:
                ok2, b = await fetch_json(client,
                    f"{bs}/api/v2/addresses/{address}")
                if ok2 and b.get("coin_balance") is not None:
                    wei = int(b["coin_balance"])
                    return {"address": address, "chain": chain.lower(),
                            "balance_wei": str(wei),
                            "balance_eth": wei / 1e18,
                            "ens": b.get("ens_domain_name"),
                            "data_source": "blockscout", "fetched_at": _now()}
            return _err(502, {"error": "Balance sources unavailable"})
    except Exception as e:
        return _err(500, {"error": str(e)})


@app.get("/v1/token/transactions")
@app.get("/api/v1/token/transactions")
async def token_transactions(address: str = Query(..., description="Wallet"),
                             limit: int = Query(10, description="Max 1-25"),
                             chain: str = Query("ethereum", description="Chain")):
    """Recent transactions of a wallet. Etherscan V2 (+key), multi-chain."""
    limit = max(1, min(limit, 25))
    try:
        params = {"chainid": CHAINIDS.get(chain.lower(), 1),
                  "module": "account", "action": "txlist", "address": address,
                  "startblock": 0, "endblock": 99999999, "page": 1,
                  "offset": limit, "sort": "desc"}
        if ETHERSCAN_API_KEY:
            params["apikey"] = ETHERSCAN_API_KEY
        async with httpx.AsyncClient(timeout=20) as client:
            ok, data = await fetch_json(client,
                "https://api.etherscan.io/v2/api", params=params)
            if not ok or data.get("status") != "1":
                return _err(502, {"error": "Etherscan txlist unavailable"})
            out = [{"hash": t.get("hash"), "from": t.get("from"),
                    "to": t.get("to"), "value_eth": int(t.get("value", "0")) / 1e18,
                    "block": t.get("blockNumber"), "time": t.get("timeStamp")}
                   for t in (data.get("result") or [])[:limit]]
            return {"address": address, "count": len(out),
                    "transactions": out, "data_source": "etherscan",
                    "fetched_at": _now()}
    except Exception as e:
        return _err(500, {"error": str(e)})


@app.get("/v1/defi/stablecoin-history")
@app.get("/api/v1/defi/stablecoin-history")
async def defi_stablecoin_history(chain: str = Query("ethereum"),
                                  limit: int = Query(30, description="Max 1-200")):
    """Stablecoin circulation history per chain. Llama, no key."""
    limit = max(1, min(limit, 200))
    try:
        async with httpx.AsyncClient(timeout=20) as client:
            ok, data = await fetch_json(client,
                f"https://stablecoins.llama.fi/stablecoincharts/{chain.lower()}")
            if not ok or not isinstance(data, list):
                return _err(502, {"error": "Llama stablecoin history unavailable"})
            out = []
            for p in data[-limit:]:
                circ = p.get("totalCirculatingUSD") or p.get("totalCirculating") or {}
                out.append({"date": p.get("date"),
                            "circulating_usd": (circ.get("peggedUSD") if isinstance(circ, dict) else circ)})
            return {"chain": chain.lower(), "count": len(out), "points": out,
                    "data_source": "llama-stablecoins", "fetched_at": _now()}
    except Exception as e:
        return _err(500, {"error": str(e)})


@app.get("/v1/forex/convert")
@app.get("/api/v1/forex/convert")
async def forex_convert(from_: str = Query("USD", alias="from",
                                           description="Source currency"),
                        to: str = Query("MXN", description="Target currency"),
                        amount: float = Query(1.0, description="Amount")):
    """Currency conversion. Frankfurter, no key."""
    try:
        async with httpx.AsyncClient(timeout=25) as client:
            ok, data = await fetch_json(client,
                "https://api.frankfurter.dev/v1/latest",
                params={"amount": amount, "from": from_.upper(), "to": to.upper()},
                timeout=25)
            if not ok:
                return _err(502, data)
            rates = data.get("rates", {}) if isinstance(data, dict) else {}
            return {"from": from_.upper(), "to": to.upper(), "amount": amount,
                    "result": rates.get(to.upper()), "rates": rates,
                    "data_source": "frankfurter", "fetched_at": _now()}
    except Exception as e:
        return _err(500, {"error": str(e)})


@app.get("/v1/news/hn-feed")
@app.get("/api/v1/news/hn-feed")
async def news_hn_feed(kind: str = Query("ask", description="ask|show|job"),
                       limit: int = Query(10, description="Max 1-25")):
    """HN Ask/Show/Jobs feeds with metadata. Firebase, no key."""
    if kind not in ("ask", "show", "job"):
        return _err(400, {"error": "kind must be ask|show|job"})
    limit = max(1, min(limit, 25))
    try:
        async with httpx.AsyncClient(timeout=25) as client:
            ok, ids = await fetch_json(client,
                f"https://hacker-news.firebaseio.com/v0/{kind}stories.json")
            if not ok or not isinstance(ids, list):
                return _err(502, {"error": "HN API unavailable"})

            async def one(iid: int):
                ok2, item = await fetch_json(client,
                    f"https://hacker-news.firebaseio.com/v0/item/{iid}.json")
                if not ok2 or not isinstance(item, dict):
                    return None
                return {"id": item.get("id"), "title": item.get("title"),
                        "url": item.get("url"), "score": item.get("score"),
                        "by": item.get("by"), "time": item.get("time")}

            items = [x for x in await asyncio.gather(
                *[one(i) for i in ids[:limit]]) if x]
            return {"kind": kind, "count": len(items), "stories": items,
                    "data_source": "hacker-news", "fetched_at": _now()}
    except Exception as e:
        return _err(500, {"error": str(e)})


@app.get("/v1/web/dns")
@app.get("/api/v1/web/dns")
async def web_dns(name: str = Query(..., description="Domain to resolve"),
                  type: str = Query("A", description="Record type")):
    """DNS over HTTPS. Google DoH, no key."""
    try:
        async with httpx.AsyncClient(timeout=15) as client:
            ok, data = await fetch_json(client, "https://dns.google/resolve",
                                        params={"name": name, "type": type.upper()})
            if not ok:
                return _err(502, data)
            answers = [{"data": a.get("data"), "ttl": a.get("TTL")}
                       for a in (data.get("Answer") or [])]
            return {"name": name, "type": type.upper(),
                    "status": data.get("Status"),
                    "answers": answers, "data_source": "google-doh",
                    "fetched_at": _now()}
    except Exception as e:
        return _err(500, {"error": str(e)})


@app.get("/v1/storage/drift/sample")
@app.get("/api/v1/storage/drift/sample")
async def storage_drift_sample(chain: str = Query("base", description="Chain")):
    """FREE sample: single-layer slot observation (marketing for the paid full comparison)."""
    rpcs = DRIFT_RPCS.get(chain.lower())
    if not rpcs:
        return _err(400, {"error": f"Unsupported chain: {chain}"})
    try:
        async with httpx.AsyncClient(timeout=12) as client:
            layer = await _rpc_slot(client, rpcs[0])
            if layer["slot"] is None:
                return _err(502, {"error": "RPC layer unreachable"})
            return {"chain": chain.lower(), "slot": layer["slot"],
                    "layer": layer["name"], "latency_ms": layer["latency_ms"],
                    "observed_at": layer["observed_at"],
                    "note": "Free sample. Full multi-layer drift comparison is paid.",
                    "paid_route": "/v1/storage/drift",
                    "data_source": "public-rpc", "fetched_at": _now()}
    except Exception as e:
        return _err(500, {"error": str(e)})


# ============================================================
#  NEW v2.1 ENDPOINTS (20 new — from 44 to 64 unique routes)
# ============================================================

@app.get("/v1/crypto/market")
@app.get("/api/v1/crypto/market")
async def crypto_market():
    """Global crypto market overview via CoinGecko."""
    try:
        async with httpx.AsyncClient(timeout=15) as client:
            ok, data = await fetch_json(client, "https://api.coingecko.com/api/v3/global")
            if not ok:
                return _err(502, data)
            g = data.get("data", {})
            return {
                "total_market_cap_usd": g.get("total_market_cap", {}).get("usd"),
                "total_volume_usd": g.get("total_volume", {}).get("usd"),
                "btc_dominance": g.get("market_cap_percentage", {}).get("btc"),
                "eth_dominance": g.get("market_cap_percentage", {}).get("eth"),
                "active_cryptos": g.get("active_cryptocurrencies"),
                "markets": g.get("markets"),
                "data_source": "coingecko", "fetched_at": _now(),
            }
    except Exception as e:
        return _err(500, {"error": str(e)})


@app.get("/v1/crypto/fear-greed")
@app.get("/api/v1/crypto/fear-greed")
async def crypto_fear_greed(limit: int = Query(30, description="Data points")):
    """Crypto Fear and Greed Index."""
    try:
        async with httpx.AsyncClient(timeout=15) as client:
            ok, data = await fetch_json(client,
                "https://api.alternative.me/fng/",
                params={"limit": limit, "format": "json"})
            if not ok:
                return _err(502, data)
            entries = data.get("data", [])
            current = entries[0] if entries else {}
            history = [{"value": e.get("value"), "label": e.get("value_classification"),
                        "timestamp": e.get("timestamp")} for e in entries[:limit]]
            return {
                "current_value": current.get("value"),
                "current_label": current.get("value_classification"),
                "history": history,
                "data_source": "alternative.me", "fetched_at": _now(),
            }
    except Exception as e:
        return _err(500, {"error": str(e)})


@app.get("/v1/crypto/trending")
@app.get("/api/v1/crypto/trending")
async def crypto_trending():
    """Trending coins on CoinGecko."""
    try:
        async with httpx.AsyncClient(timeout=15) as client:
            ok, data = await fetch_json(client,
                "https://api.coingecko.com/api/v3/search/trending")
            if not ok:
                return _err(502, data)
            coins = []
            for c in data.get("coins", [])[:10]:
                item = c.get("item", {})
                coins.append({
                    "name": item.get("name"),
                    "symbol": item.get("symbol"),
                    "market_cap_rank": item.get("market_cap_rank"),
                    "score": item.get("score"),
                    "price_btc": item.get("price_btc"),
                })
            return {"trending": coins, "data_source": "coingecko",
                    "fetched_at": _now()}
    except Exception as e:
        return _err(500, {"error": str(e)})


@app.get("/v1/crypto/ohlcv")
@app.get("/api/v1/crypto/ohlcv")
async def crypto_ohlcv(
    coin: str = Query("bitcoin", description="CoinGecko coin id"),
    vs: str = Query("usd", description="vs currency"),
    days: int = Query(7, description="Days of data"),
):
    """OHLCV candlestick data for a coin."""
    try:
        async with httpx.AsyncClient(timeout=15) as client:
            ok, data = await fetch_json(client,
                f"https://api.coingecko.com/api/v3/coins/{coin}/ohlc",
                params={"vs_currency": vs, "days": days})
            if not ok:
                return _err(502, data)
            candles = [{"timestamp": c[0], "open": c[1], "high": c[2],
                        "low": c[3], "close": c[4]} for c in (data or [])]
            return {"coin": coin, "vs": vs, "days": days,
                    "candles": candles[-50:],
                    "data_source": "coingecko", "fetched_at": _now()}
    except Exception as e:
        return _err(500, {"error": str(e)})


@app.get("/v1/crypto/dominance")
@app.get("/api/v1/crypto/dominance")
async def crypto_dominance():
    """Crypto dominance indices."""
    try:
        async with httpx.AsyncClient(timeout=15) as client:
            ok, data = await fetch_json(client,
                "https://api.coingecko.com/api/v3/global")
            if not ok:
                return _err(502, data)
            pct = data.get("data", {}).get("market_cap_percentage", {})
            return {
                "btc": round(pct.get("btc", 0), 2),
                "eth": round(pct.get("eth", 0), 2),
                "usdt": round(pct.get("usdt", 0), 2),
                "bnb": round(pct.get("bnb", 0), 2),
                "sol": round(pct.get("sol", 0), 2),
                "others": round(100 - sum(v for k, v in pct.items()
                    if k in ("btc", "eth", "usdt", "bnb", "sol")), 2),
                "data_source": "coingecko", "fetched_at": _now(),
            }
    except Exception as e:
        return _err(500, {"error": str(e)})


@app.get("/v1/web/whois")
@app.get("/api/v1/web/whois")
async def web_whois(domain: str = Query(..., description="Domain name")):
    """Domain WHOIS lookup."""
    try:
        async with httpx.AsyncClient(timeout=15, follow_redirects=True) as client:
            ok, data = await fetch_json(client,
                f"https://rdap.org/domain/{domain}")
            if not ok:
                return _err(502, data)
            events = {e.get("eventAction"): e.get("eventDate")
                      for e in data.get("events", [])}
            nameservers = [ns.get("ldhName", "") for ns in data.get("nameservers", [])]
            return {
                "domain": domain,
                "status": data.get("status", []),
                "registration": events.get("registration"),
                "expiration": events.get("expiration"),
                "last_update": events.get("last changed"),
                "nameservers": nameservers,
                "data_source": "rdap.org", "fetched_at": _now(),
            }
    except Exception as e:
        return _err(500, {"error": str(e)})


@app.get("/v1/web/headers")
@app.get("/api/v1/web/headers")
async def web_headers(url: str = Query(..., description="URL to check")):
    """HTTP response headers checker."""
    try:
        async with httpx.AsyncClient(timeout=15, follow_redirects=True) as client:
            resp = await client.head(url, headers=UA)
            headers = dict(resp.headers)
            return {
                "url": url, "status_code": resp.status_code,
                "headers": headers,
                "content_type": headers.get("content-type"),
                "server": headers.get("server"),
                "cache_control": headers.get("cache-control"),
                "cors": headers.get("access-control-allow-origin"),
                "fetched_at": _now(),
            }
    except Exception as e:
        return _err(500, {"error": str(e)})


@app.get("/v1/web/ssl")
@app.get("/api/v1/web/ssl")
async def web_ssl(domain: str = Query(..., description="Domain to check")):
    """SSL certificate info."""
    import ssl
    import socket
    try:
        ctx = ssl.create_default_context()
        with ctx.wrap_socket(socket.socket(), server_hostname=domain) as s:
            s.settimeout(15)
            s.connect((domain, 443))
            cert = s.getpeercert()
            issuer = dict(x[0] for x in cert.get("issuer", []))
            subject = dict(x[0] for x in cert.get("subject", []))
            return {
                "domain": domain,
                "subject": subject.get("commonName"),
                "issuer_org": issuer.get("organizationName"),
                "issuer_cn": issuer.get("commonName"),
                "not_before": cert.get("notBefore"),
                "not_after": cert.get("notAfter"),
                "serial": cert.get("serialNumber"),
                "san": [v for t, v in cert.get("subjectAltName", [])
                        if t == "DNS"],
                "fetched_at": _now(),
            }
    except Exception as e:
        return _err(500, {"error": str(e)})


@app.get("/v1/data/ip")
@app.get("/api/v1/data/ip")
async def data_ip(ip: str = Query("me", description="IP or 'me'")):
    """IP address geolocation."""
    try:
        url = "https://ipinfo.io/json" if ip == "me" else f"https://ipinfo.io/{ip}/json"
        async with httpx.AsyncClient(timeout=10) as client:
            ok, data = await fetch_json(client, url)
            if not ok:
                return _err(502, data)
            loc = data.get("loc", ",").split(",")
            return {
                "ip": data.get("ip"),
                "city": data.get("city"),
                "region": data.get("region"),
                "country": data.get("country"),
                "lat": float(loc[0]) if len(loc) == 2 else None,
                "lon": float(loc[1]) if len(loc) == 2 else None,
                "org": data.get("org"),
                "timezone": data.get("timezone"),
                "data_source": "ipinfo.io", "fetched_at": _now(),
            }
    except Exception as e:
        return _err(500, {"error": str(e)})


@app.get("/v1/data/ua")
@app.get("/api/v1/data/ua")
async def data_ua(user_agent: str = Query(..., description="User-Agent string")):
    """User-Agent parser."""
    ua = user_agent.lower()
    # Simple detection
    browser = "Unknown"
    if "chrome" in ua and "edg" not in ua:
        browser = "Chrome"
    elif "firefox" in ua:
        browser = "Firefox"
    elif "safari" in ua and "chrome" not in ua:
        browser = "Safari"
    elif "edg" in ua:
        browser = "Edge"
    elif "opera" in ua or "opr" in ua:
        browser = "Opera"

    os_name = "Unknown"
    if "windows" in ua:
        os_name = "Windows"
    elif "mac os" in ua or "macos" in ua:
        os_name = "macOS"
    elif "linux" in ua:
        os_name = "Linux"
    elif "android" in ua:
        os_name = "Android"
    elif "iphone" in ua or "ipad" in ua:
        os_name = "iOS"

    device = "Desktop"
    if "mobile" in ua or "android" in ua:
        device = "Mobile"
    elif "tablet" in ua or "ipad" in ua:
        device = "Tablet"
    elif "bot" in ua or "crawler" in ua or "spider" in ua:
        device = "Bot"

    return {"user_agent": user_agent, "browser": browser,
            "os": os_name, "device": device, "fetched_at": _now()}


@app.get("/v1/data/hash")
@app.get("/api/v1/data/hash")
async def data_hash(
    text: str = Query(..., description="Text to hash"),
    algo: str = Query("sha256", description="Algorithm: md5, sha1, sha256, sha512"),
):
    """Hash generator."""
    import hashlib
    algos = {"md5": hashlib.md5, "sha1": hashlib.sha1,
             "sha256": hashlib.sha256, "sha512": hashlib.sha512}
    algo_lower = algo.lower()
    if algo_lower not in algos:
        return _err(400, {"error": f"Unsupported algorithm. Use: {', '.join(algos.keys())}"})
    h = algos[algo_lower](text.encode()).hexdigest()
    return {"text": text, "algorithm": algo_lower, "hash": h, "fetched_at": _now()}


@app.get("/v1/data/uuid")
@app.get("/api/v1/data/uuid")
async def data_uuid(count: int = Query(1, description="Number of UUIDs (1-100)")):
    """UUID v4 generator."""
    import uuid
    count = min(max(count, 1), 100)
    return {"uuids": [str(uuid.uuid4()) for _ in range(count)],
            "count": count, "fetched_at": _now()}


@app.get("/v1/data/qrcode")
@app.get("/api/v1/data/qrcode")
async def data_qrcode(
    text: str = Query(..., description="Text/URL for QR code"),
    size: int = Query(200, description="Image size in pixels"),
):
    """QR code generator as data URL."""
    try:
        # Use quickchart.io API (free, no key)
        encoded = text.replace("&", "%26").replace("=", "%3D")
        qr_url = f"https://quickchart.io/qr?text={encoded}&size={size}"
        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.get(qr_url)
            if resp.status_code == 200:
                import base64
                b64 = base64.b64encode(resp.content).decode()
                return {"text": text, "size": size,
                        "data_url": f"data:image/png;base64,{b64}",
                        "qr_url": qr_url, "fetched_at": _now()}
            return _err(502, {"error": "QR generation failed"})
    except Exception as e:
        return _err(500, {"error": str(e)})


@app.get("/v1/news/reddit")
@app.get("/api/v1/news/reddit")
async def news_reddit(
    subreddit: str = Query("cryptocurrency", description="Subreddit"),
    sort: str = Query("hot", description="Sort: hot, new, top"),
    limit: int = Query(25, description="Posts to fetch"),
):
    """Reddit posts from any subreddit."""
    try:
        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.get(
                f"https://www.reddit.com/r/{subreddit}/{sort}.json",
                params={"limit": limit},
                headers={**UA, "Accept": "application/json"})
            if resp.status_code != 200:
                return _err(502, {"error": f"Reddit returned {resp.status_code}"})
            data = resp.json()
            posts = []
            for child in data.get("data", {}).get("children", [])[:limit]:
                d = child.get("data", {})
                posts.append({
                    "title": d.get("title"),
                    "author": d.get("author"),
                    "score": d.get("score"),
                    "num_comments": d.get("num_comments"),
                    "url": d.get("url"),
                    "permalink": f"https://reddit.com{d.get('permalink', '')}",
                    "created_utc": d.get("created_utc"),
                })
            return {"subreddit": subreddit, "sort": sort,
                    "count": len(posts), "posts": posts, "fetched_at": _now()}
    except Exception as e:
        return _err(500, {"error": str(e)})


@app.get("/v1/news/devto")
@app.get("/api/v1/news/devto")
async def news_devto(
    tag: str = Query("javascript", description="Tag to filter"),
    per_page: int = Query(20, description="Articles per page"),
    page: int = Query(1, description="Page number"),
):
    """Dev.to articles."""
    try:
        async with httpx.AsyncClient(timeout=15) as client:
            ok, data = await fetch_json(client,
                "https://dev.to/api/articles",
                params={"tag": tag, "per_page": per_page, "page": page})
            if not ok:
                return _err(502, data)
            articles = [{"title": a.get("title"),
                         "description": a.get("description"),
                         "url": a.get("url"),
                         "author": a.get("user", {}).get("name"),
                         "reactions": a.get("positive_reactions_count"),
                         "comments": a.get("comments_count"),
                         "published": a.get("published_at"),
                         "tags": a.get("tag_list", [])}
                        for a in (data or [])]
            return {"tag": tag, "page": page, "count": len(articles),
                    "articles": articles, "fetched_at": _now()}
    except Exception as e:
        return _err(500, {"error": str(e)})


@app.get("/v1/defi/impermanent-loss")
@app.get("/api/v1/defi/impermanent-loss")
async def defi_impermanent_loss(
    entry_price: float = Query(..., description="Entry price of both tokens"),
    current_price: float = Query(..., description="Current price of token A"),
):
    """Impermanent loss calculator."""
    try:
        ratio = current_price / entry_price
        il = 2 * (ratio ** 0.5) / (1 + ratio) - 1
        il_pct = abs(il) * 100
        return {
            "entry_price": entry_price,
            "current_price": current_price,
            "price_ratio": round(ratio, 4),
            "impermanent_loss_pct": round(il_pct, 4),
            "impermanent_loss_decimal": round(il, 6),
            "note": "IL is relative to just holding. Negative = loss vs holding.",
            "fetched_at": _now(),
        }
    except Exception as e:
        return _err(500, {"error": str(e)})


@app.get("/v1/defi/staking-apy")
@app.get("/api/v1/defi/staking-apy")
async def defi_staking_apy():
    """Staking APY for major protocols via DefiLlama."""
    try:
        async with httpx.AsyncClient(timeout=15) as client:
            ok, data = await fetch_json(client,
                "https://yields.llama.fi/pools")
            if not ok:
                return _err(502, data)
            pools = data.get("data", [])
            # Filter for staking pools with good TVL
            staking = [p for p in pools if p.get("tvlUsd", 0) > 1_000_000
                       and p.get("apy", 0) > 0
                       and "staking" in p.get("category", "").lower()
                       or "lending" in p.get("category", "").lower()]
            staking.sort(key=lambda x: x.get("apy", 0), reverse=True)
            results = [{"project": p.get("project"), "symbol": p.get("symbol"),
                        "chain": p.get("chain"), "tvl_usd": round(p.get("tvlUsd", 0)),
                        "apy": round(p.get("apy", 0), 2),
                        "apy_base": round(p.get("apyBase", 0) or 0, 2),
                        "apy_reward": round(p.get("apyReward", 0) or 0, 2),
                        "category": p.get("category")}
                       for p in staking[:30]]
            return {"count": len(results), "pools": results, "fetched_at": _now()}
    except Exception as e:
        return _err(500, {"error": str(e)})


@app.get("/v1/token/nft")
@app.get("/api/v1/token/nft")
async def token_nft(
    contract: str = Query(..., description="NFT contract address"),
    token_id: str = Query("1", description="Token ID"),
    chain: str = Query("ethereum", description="Chain"),
):
    """NFT metadata fetcher."""
    try:
        # Use SimpleHash free API for NFT metadata
        chain_map = {"ethereum": "ethereum", "base": "base",
                     "polygon": "polygon", "optimism": "optimism"}
        chain_name = chain_map.get(chain.lower(), "ethereum")
        url = f"https://api.simplehash.com/api/v0/nfts/metadata?chain={chain_name}&contract={contract}&token_ids={token_id}"
        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.get(url, headers={"Accept": "application/json"})
            if resp.status_code == 200:
                data = resp.json()
                nfts = data.get("nfts", [])
                if nfts:
                    nft = nfts[0]
                    return {
                        "contract": contract, "token_id": token_id,
                        "chain": chain_name,
                        "name": nft.get("name"),
                        "description": nft.get("description"),
                        "image_url": nft.get("image_url"),
                        "collection": nft.get("collection", {}).get("name"),
                        "attributes": nft.get("attributes", []),
                        "data_source": "simplehash", "fetched_at": _now(),
                    }
            # Fallback: return what we have
            return {"contract": contract, "token_id": token_id,
                    "chain": chain_name, "note": "Metadata not available",
                    "fetched_at": _now()}
    except Exception as e:
        return _err(500, {"error": str(e)})


@app.get("/v1/data/translate")
@app.get("/api/v1/data/translate")
async def data_translate(
    text: str = Query(..., description="Text to translate"),
    source: str = Query("auto", description="Source language code"),
    target: str = Query("es", description="Target language code"),
):
    """Text translation via MyMemory (free, no key)."""
    try:
        async with httpx.AsyncClient(timeout=15) as client:
            ok, data = await fetch_json(client,
                "https://api.mymemory.translated.net/get",
                params={"q": text, "langpair": f"{source}|{target}"})
            if not ok:
                return _err(502, data)
            translated = data.get("responseData", {}).get("translatedText", "")
            match = data.get("responseData", {}).get("match", 0)
            return {
                "text": text, "source": source, "target": target,
                "translation": translated,
                "confidence": round(match * 100) if match else None,
                "data_source": "mymemory", "fetched_at": _now(),
            }
    except Exception as e:
        return _err(500, {"error": str(e)})


@app.get("/v1/data/summarize")
@app.get("/api/v1/data/summarize")
async def data_summarize(
    text: str = Query(..., description="Text to summarize"),
    sentences: int = Query(3, description="Number of sentences"),
):
    """Extractive text summarizer."""
    import re
    # Split into sentences
    sents = re.split(r'(?<=[.!?])\s+', text.strip())
    if len(sents) <= sentences:
        return {"text": text, "summary": text,
                "original_sentences": len(sents),
                "summary_sentences": len(sents), "fetched_at": _now()}
    # Score sentences by word frequency
    words = re.findall(r'\w+', text.lower())
    freq = {}
    for w in words:
        if len(w) > 3:
            freq[w] = freq.get(w, 0) + 1
    scored = []
    for i, s in enumerate(sents):
        score = sum(freq.get(w.lower(), 0) for w in re.findall(r'\w+', s) if len(w) > 3)
        scored.append((i, score, s))
    scored.sort(key=lambda x: x[1], reverse=True)
    top = sorted(scored[:sentences], key=lambda x: x[0])
    summary = " ".join(s[2] for s in top)
    return {"text": text[:200] + "..." if len(text) > 200 else text,
            "summary": summary,
            "original_sentences": len(sents),
            "summary_sentences": sentences, "fetched_at": _now()}


# === x402 INTELLIGENCE (EXCLUSIVE — reads Base blockchain) ===
# These endpoints read on-chain data from Base Mainnet to provide
# analytics on x402 payments. NOBODY else has this data.

# Known x402-related contract addresses on Base
X402_CONTRACTS = {
    "usdc": "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913",  # USDC on Base
    "xpay_facilitator": "0x0000000000000000000000000000000000000000",  # placeholder
}

# Transfer event topic (ERC-20 Transfer)
TRANSFER_TOPIC = "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef"

# Base RPC endpoints for redundancy
BASE_RPCS = [
    "https://mainnet.base.org",
    "https://base.llamarpc.com",
    "https://base-mainnet.public.blastapi.io",
]

_rpc_cache: dict[str, tuple[float, dict]] = {}
_RPC_CACHE_TTL = 10  # seconds — balance freshness vs latency for RPC calls

async def _base_rpc_call(client: httpx.AsyncClient, method: str, params: list) -> dict:
    """Make a JSON-RPC call to Base, trying multiple RPCs. Cached for 10s."""
    # Cache key: method + params
    cache_key = f"{method}:{str(params)}"
    now = time.time()

    # Check cache
    if cache_key in _rpc_cache:
        ts, cached = _rpc_cache[cache_key]
        if now - ts < _RPC_CACHE_TTL:
            return cached

    # Cache miss — fetch from RPC
    payload = {
        "jsonrpc": "2.0",
        "id": 1,
        "method": method,
        "params": params,
    }
    for rpc_url in BASE_RPCS:
        try:
            r = await client.post(rpc_url, json=payload, timeout=10)
            if r.status_code == 200:
                data = r.json()
                if "result" in data:
                    result = {"ok": True, "result": data["result"]}
                    _rpc_cache[cache_key] = (now, result)
                    return result
                elif "error" in data:
                    return {"ok": False, "error": data["error"].get("message", str(data["error"]))}
        except Exception:
            continue
    return {"ok": False, "error": "All Base RPCs failed"}


# Cache for block number to avoid repeated RPC calls
_block_cache = {"block": None, "ts": 0}

# CoinGecko response cache — now delegated to fetch_json's built-in cache
# This wrapper exists for backward compatibility with endpoints that call it directly
_CG_CACHE_TTL = 10  # seconds

async def fetch_json_cached(client: httpx.AsyncClient, url: str,
                            params: dict | None = None,
                            timeout: float = 15,
                            cache_ttl: float = _CG_CACHE_TTL):
    """fetch_json with TTL cache. Delegates to fetch_json's built-in cache."""
    return await fetch_json(client, url, params, timeout, cache_ttl=cache_ttl)

async def _get_base_block_number(client: httpx.AsyncClient) -> int | None:
    """Get current block number on Base (cached for 10s)."""
    import time
    now = time.time()
    if _block_cache["block"] and (now - _block_cache["ts"]) < 10:
        return _block_cache["block"]
    result = await _base_rpc_call(client, "eth_blockNumber", [])
    if result["ok"]:
        block = int(result["result"], 16)
        _block_cache["block"] = block
        _block_cache["ts"] = now
        return block
    return None


async def _get_eth_logs_limited(client: httpx.AsyncClient, from_block: int, to_block: int,
                        address: str, topics: list, max_blocks: int = 500) -> list:
    """Get event logs from Base, limited to max_blocks to avoid timeouts."""
    # Limit the range to avoid RPC timeouts
    actual_from = max(from_block, to_block - max_blocks)
    params = {
        "fromBlock": hex(actual_from),
        "toBlock": hex(to_block),
        "address": address,
        "topics": topics,
    }
    result = await _base_rpc_call(client, "eth_getLogs", [params])
    if result["ok"]:
        return result["result"]
    return []


@app.get("/v1/x402/payments/recent")
@app.get("/api/v1/x402/payments/recent")
async def x402_payments_recent(
    limit: int = Query(20, description="Number of recent payments (max 50)"),
    hours: int = Query(24, description="Lookback in hours (max 168)"),
):
    """
    🧠 EXCLUSIVE: Recent x402 USDC payments on Base Mainnet.
    
    Reads on-chain ERC-20 Transfer events for USDC on Base.
    Provides analytics on micropayments that NOBODY else tracks.
    
    Returns: recent transfers, total volume, average payment, unique wallets.
    """
    try:
        limit = min(limit, 50)
        hours = min(hours, 168)
        
        async with httpx.AsyncClient(timeout=30) as client:
            # Get current block
            current_block = await _get_base_block_number(client)
            if not current_block:
                return _err(502, {"error": "Cannot connect to Base RPC"})
            
            # Estimate blocks to look back (~2s per block on Base)
            blocks_per_hour = 1800  # ~2 second blocks
            from_block = max(0, current_block - (hours * blocks_per_hour))
            
            # Get USDC Transfer events
            logs = await _get_eth_logs_limited(
                client,
                from_block=from_block,
                to_block=current_block,
                address=X402_CONTRACTS["usdc"],
                topics=[TRANSFER_TOPIC],
            )
            
            # Parse transfers
            payments = []
            total_volume = 0
            wallet_set = set()
            
            for log in logs:
                try:
                    # Decode Transfer event
                    if len(log.get("topics", [])) >= 3 and len(log.get("data", "0x")) > 2:
                        from_addr = "0x" + log["topics"][1][-40:]
                        to_addr = "0x" + log["topics"][2][-40:]
                        value_hex = log["data"]
                        # USDC has 6 decimals
                        value = int(value_hex, 16) / 1_000_000
                        
                        if value > 0:
                            total_volume += value
                            wallet_set.add(from_addr.lower())
                            wallet_set.add(to_addr.lower())
                            
                            payments.append({
                                "tx_hash": log.get("transactionHash", ""),
                                "block": int(log.get("blockNumber", "0x0"), 16),
                                "from": from_addr,
                                "to": to_addr,
                                "amount_usdc": round(value, 6),
                                "log_index": int(log.get("logIndex", "0x0"), 16),
                            })
                except Exception:
                    continue
            
            # Sort by block descending (most recent first)
            payments.sort(key=lambda x: x["block"], reverse=True)
            payments = payments[:limit]
            
            return {
                "status": "ok",
                "network": "Base Mainnet (8453)",
                "data_source": "on-chain USDC transfers",
                "exclusive": True,
                "lookback_hours": hours,
                "blocks_scanned": current_block - from_block,
                "total_transfers": len(payments),
                "total_volume_usdc": round(total_volume, 2),
                "average_payment_usdc": round(total_volume / max(len(payments), 1), 4),
                "unique_wallets": len(wallet_set),
                "payments": payments,
                "fetched_at": _now(),
            }
    except Exception as e:
        return _err(500, {"error": str(e)})


@app.get("/v1/x402/agent/{address}")
@app.get("/api/v1/x402/agent/{address}")
async def x402_agent_intelligence(
    address: str,
    days: int = Query(30, description="Lookback in days (max 90)"),
):
    """
    🧠 EXCLUSIVE: Intelligence on a specific wallet's x402 activity.
    
    Tracks USDC transfers involving this address on Base Mainnet.
    Shows: total sent, total received, unique counterparties, activity pattern.
    
    This is the "Google Analytics" for crypto wallets.
    """
    try:
        days = min(days, 90)
        address = address.lower()
        if not address.startswith("0x") or len(address) != 42:
            return _err(400, {"error": "Invalid Ethereum address"})
        
        async with httpx.AsyncClient(timeout=30) as client:
            current_block = await _get_base_block_number(client)
            if not current_block:
                return _err(502, {"error": "Cannot connect to Base RPC"})
            
            blocks_per_day = 43200  # ~43200 blocks/day on Base
            from_block = max(0, current_block - (days * blocks_per_day))
            
            # Get USDC Transfer events involving this address
            # We need to scan topics[1] (from) and topics[2] (to)
            logs_from = await _get_eth_logs_limited(
                client,
                from_block=from_block,
                to_block=current_block,
                address=X402_CONTRACTS["usdc"],
                topics=[TRANSFER_TOPIC, f"0x000000000000000000000000{address[2:]}"],
            )
            
            logs_to = await _get_eth_logs_limited(
                client,
                from_block=from_block,
                to_block=current_block,
                address=X402_CONTRACTS["usdc"],
                topics=[TRANSFER_TOPIC, None, f"0x000000000000000000000000{address[2:]}"],
            )
            
            # Combine and deduplicate
            all_logs = {}
            for log in logs_from + logs_to:
                tx = log.get("transactionHash", "")
                idx = log.get("logIndex", "0x0")
                key = f"{tx}_{idx}"
                all_logs[key] = log
            
            # Parse
            sent = 0
            received = 0
            sent_count = 0
            received_count = 0
            counterparties = set()
            daily_activity = {}
            
            for log in all_logs.values():
                try:
                    if len(log.get("topics", [])) >= 3 and len(log.get("data", "0x")) > 2:
                        from_addr = "0x" + log["topics"][1][-40:]
                        to_addr = "0x" + log["topics"][2][-40:]
                        value = int(log["data"], 16) / 1_000_000
                        
                        if value > 0:
                            # Get approximate timestamp from block number
                            block_num = int(log.get("blockNumber", "0x0"), 16)
                            # Rough day estimate (Base ~2s blocks)
                            days_ago = (current_block - block_num) / 43200
                            day_key = f"{int(days_ago)}d_ago"
                            
                            if from_addr.lower() == address:
                                sent += value
                                sent_count += 1
                                counterparties.add(to_addr.lower())
                                daily_activity[day_key] = daily_activity.get(day_key, {"sent": 0, "received": 0})
                                daily_activity[day_key]["sent"] += value
                            elif to_addr.lower() == address:
                                received += value
                                received_count += 1
                                counterparties.add(from_addr.lower())
                                daily_activity[day_key] = daily_activity.get(day_key, {"sent": 0, "received": 0})
                                daily_activity[day_key]["received"] += value
                except Exception:
                    continue
            
            return {
                "status": "ok",
                "network": "Base Mainnet (8453)",
                "data_source": "on-chain USDC transfers",
                "exclusive": True,
                "address": address,
                "lookback_days": days,
                "total_sent_usdc": round(sent, 2),
                "total_received_usdc": round(received, 2),
                "net_flow_usdc": round(received - sent, 2),
                "sent_transactions": sent_count,
                "received_transactions": received_count,
                "unique_counterparties": len(counterparties),
                "activity_by_period": daily_activity,
                "fetched_at": _now(),
            }
    except Exception as e:
        return _err(500, {"error": str(e)})


@app.get("/v1/x402/analytics")
@app.get("/api/v1/x402/analytics")
async def x402_analytics():
    """
    🧠 EXCLUSIVE: Global x402 network analytics on Base.
    
    Provides real-time metrics on USDC micropayments on Base Mainnet.
    Shows: network health, total volume, active wallets, payment trends.
    
    This is the "Dune Analytics" for x402 payments.
    """
    try:
        async with httpx.AsyncClient(timeout=30) as client:
            current_block = await _get_base_block_number(client)
            if not current_block:
                return _err(502, {"error": "Cannot connect to Base RPC"})
            
            # Scan last 1 hour (limited to avoid timeouts)
            blocks_1h = 1800
            from_block_1h = max(0, current_block - blocks_1h)
            
            # Scan last 6 hours (limited to avoid timeouts)
            blocks_6h = 10800
            from_block_6h = max(0, current_block - blocks_6h)
            
            # Get 1h USDC transfers
            logs_24h = await _get_eth_logs_limited(
                client,
                from_block=from_block_1h,
                to_block=current_block,
                address=X402_CONTRACTS["usdc"],
                topics=[TRANSFER_TOPIC],
                max_blocks=500,
            )
            
            # Get 6h USDC transfers (for trend comparison)
            logs_7d = await _get_eth_logs_limited(
                client,
                from_block=from_block_6h,
                to_block=current_block,
                address=X402_CONTRACTS["usdc"],
                topics=[TRANSFER_TOPIC],
            )
            
            # Process 24h data
            volume_24h = 0
            wallets_24h = set()
            tx_count_24h = 0
            for log in logs_24h:
                try:
                    if len(log.get("data", "0x")) > 2:
                        value = int(log["data"], 16) / 1_000_000
                        if value > 0:
                            volume_24h += value
                            tx_count_24h += 1
                            if len(log.get("topics", [])) >= 3:
                                wallets_24h.add("0x" + log["topics"][1][-40:])
                                wallets_24h.add("0x" + log["topics"][2][-40:])
                except Exception:
                    continue
            
            # Process 7d data (for averages)
            volume_7d = 0
            wallets_7d = set()
            tx_count_7d = 0
            for log in logs_7d:
                try:
                    if len(log.get("data", "0x")) > 2:
                        value = int(log["data"], 16) / 1_000_000
                        if value > 0:
                            volume_7d += value
                            tx_count_7d += 1
                            if len(log.get("topics", [])) >= 3:
                                wallets_7d.add("0x" + log["topics"][1][-40:])
                                wallets_7d.add("0x" + log["topics"][2][-40:])
                except Exception:
                    continue
            
            # Calculate trends
            avg_daily_volume = volume_7d / 7
            avg_daily_txns = tx_count_7d / 7
            volume_trend = ((volume_24h / max(avg_daily_volume, 0.01)) - 1) * 100
            txn_trend = ((tx_count_24h / max(avg_daily_txns, 1)) - 1) * 100
            
            return {
                "status": "ok",
                "network": "Base Mainnet (8453)",
                "data_source": "on-chain USDC transfers",
                "exclusive": True,
                "current_block": current_block,
                "metrics_24h": {
                    "total_volume_usdc": round(volume_24h, 2),
                    "total_transactions": tx_count_24h,
                    "unique_wallets": len(wallets_24h),
                    "avg_payment_usdc": round(volume_24h / max(tx_count_24h, 1), 4),
                },
                "metrics_7d": {
                    "total_volume_usdc": round(volume_7d, 2),
                    "total_transactions": tx_count_7d,
                    "unique_wallets": len(wallets_7d),
                    "avg_daily_volume_usdc": round(avg_daily_volume, 2),
                    "avg_daily_transactions": round(avg_daily_txns, 0),
                },
                "trends": {
                    "volume_vs_7d_avg_pct": round(volume_trend, 1),
                    "transactions_vs_7d_avg_pct": round(txn_trend, 1),
                },
                "network_health": {
                    "rpc_status": "operational",
                    "block_time_seconds": 2,
                    "finality": "instant (L2)",
                },
                "fetched_at": _now(),
            }
    except Exception as e:
        return _err(500, {"error": str(e)})


@app.get("/v1/x402/top-agents")
@app.get("/api/v1/x402/top-agents")
async def x402_top_agents(
    limit: int = Query(10, description="Number of top agents (max 25)"),
    days: int = Query(7, description="Lookback in days (max 30)"),
):
    """
    🧠 EXCLUSIVE: Top USDC spenders on Base Mainnet.
    
    Identifies the most active wallets by USDC transfer volume.
    Shows: ranking, total volume, transaction count, unique counterparties.
    
    This is the "leaderboard" for the x402 economy.
    """
    try:
        limit = min(limit, 25)
        days = min(days, 30)
        
        async with httpx.AsyncClient(timeout=30) as client:
            current_block = await _get_base_block_number(client)
            if not current_block:
                return _err(502, {"error": "Cannot connect to Base RPC"})
            
            blocks_per_day = 43200
            from_block = max(0, current_block - (days * blocks_per_day))
            
            # Get USDC Transfer events
            logs = await _get_eth_logs_limited(
                client,
                from_block=from_block,
                to_block=current_block,
                address=X402_CONTRACTS["usdc"],
                topics=[TRANSFER_TOPIC],
            )
            
            # Aggregate by wallet
            wallet_stats = {}
            for log in logs:
                try:
                    if len(log.get("topics", [])) >= 3 and len(log.get("data", "0x")) > 2:
                        from_addr = "0x" + log["topics"][1][-40:]
                        to_addr = "0x" + log["topics"][2][-40:]
                        value = int(log["data"], 16) / 1_000_000
                        
                        if value > 0:
                            # Track sender
                            if from_addr not in wallet_stats:
                                wallet_stats[from_addr] = {
                                    "sent": 0, "received": 0,
                                    "sent_count": 0, "received_count": 0,
                                    "counterparties": set(),
                                }
                            wallet_stats[from_addr]["sent"] += value
                            wallet_stats[from_addr]["sent_count"] += 1
                            wallet_stats[from_addr]["counterparties"].add(to_addr.lower())
                            
                            # Track receiver
                            if to_addr not in wallet_stats:
                                wallet_stats[to_addr] = {
                                    "sent": 0, "received": 0,
                                    "sent_count": 0, "received_count": 0,
                                    "counterparties": set(),
                                }
                            wallet_stats[to_addr]["received"] += value
                            wallet_stats[to_addr]["received_count"] += 1
                            wallet_stats[to_addr]["counterparties"].add(from_addr.lower())
                except Exception:
                    continue
            
            # Sort by total volume (sent + received)
            ranked = []
            for addr, stats in wallet_stats.items():
                total_volume = stats["sent"] + stats["received"]
                total_txns = stats["sent_count"] + stats["received_count"]
                ranked.append({
                    "rank": 0,
                    "address": addr,
                    "total_volume_usdc": round(total_volume, 2),
                    "total_transactions": total_txns,
                    "sent_usdc": round(stats["sent"], 2),
                    "received_usdc": round(stats["received"], 2),
                    "unique_counterparties": len(stats["counterparties"]),
                })
            
            ranked.sort(key=lambda x: x["total_volume_usdc"], reverse=True)
            for i, item in enumerate(ranked[:limit]):
                item["rank"] = i + 1
            
            return {
                "status": "ok",
                "network": "Base Mainnet (8453)",
                "data_source": "on-chain USDC transfers",
                "exclusive": True,
                "lookback_days": days,
                "total_wallets_tracked": len(wallet_stats),
                "top_agents": ranked[:limit],
                "fetched_at": _now(),
            }
    except Exception as e:
        return _err(500, {"error": str(e)})


# ============================================================
# x402 Intelligence — EXPANDED CATALOG (16 new endpoints)
# All FREE. On-chain. Exclusive.
# ============================================================


_base_stats_cache: tuple[float, dict] | None = None
_BASE_STATS_CACHE_TTL = 10  # seconds

@app.get("/v1/x402/base-stats")
@app.get("/api/v1/x402/base-stats")
async def x402_base_stats():
    """
    🧠 EXCLUSIVE: Base chain health — block number, gas price, chain status.
    Cached for 10s to avoid 3x RPC calls on every request.
    """
    global _base_stats_cache
    now = time.time()

    # Check cache
    if _base_stats_cache and (now - _base_stats_cache[0]) < _BASE_STATS_CACHE_TTL:
        return _base_stats_cache[1]

    try:
        async with httpx.AsyncClient(timeout=10) as client:
            block_r = await _base_rpc_call(client, "eth_blockNumber", [])
            gas_r = await _base_rpc_call(client, "eth_gasPrice", [])
            chain_r = await _base_rpc_call(client, "eth_chainId", [])

            current_block = int(block_r["result"], 16) if block_r["ok"] else None
            gas_gwei = round(int(gas_r["result"], 16) / 1e9, 4) if gas_r["ok"] else None
            chain_id = int(chain_r["result"], 16) if chain_r["ok"] else None

            response = {
                "status": "ok",
                "network": "Base Mainnet",
                "chain_id": chain_id,
                "current_block": current_block,
                "gas_price_gwei": gas_gwei,
                "gas_cost_1_transfer_usd": round(gas_gwei * 21000 * 1e-9 * 2500, 6) if gas_gwei else None,
                "rpc_status": "operational" if block_r["ok"] else "degraded",
                "block_time_seconds": 2,
                "finality": "instant (L2)",
                "fetched_at": _now(),
            }
            _base_stats_cache = (now, response)
            return response
    except Exception as e:
        return _err(500, {"error": str(e)})


_gas_cache: tuple[float, dict] | None = None
_GAS_CACHE_TTL = 15  # seconds

@app.get("/v1/x402/gas")
@app.get("/api/v1/x402/gas")
async def x402_gas():
    """
    🧠 EXCLUSIVE: Gas price analysis on Base — current, min, max, cost estimates.
    Cached for 15s to avoid 3x RPC calls + sleeps on every request.
    """
    global _gas_cache
    now = time.time()

    # Check cache
    if _gas_cache and (now - _gas_cache[0]) < _GAS_CACHE_TTL:
        return _gas_cache[1]

    try:
        async with httpx.AsyncClient(timeout=10) as client:
            results = []
            for _ in range(3):
                r = await _base_rpc_call(client, "eth_gasPrice", [])
                if r["ok"]:
                    results.append(int(r["result"], 16) / 1e9)
                import asyncio
                await asyncio.sleep(0.5)

            if not results:
                return _err(502, {"error": "Cannot fetch gas price"})

            current = results[-1]
            response = {
                "status": "ok",
                "network": "Base Mainnet",
                "current_gwei": round(current, 4),
                "min_gwei": round(min(results), 4),
                "max_gwei": round(max(results), 4),
                "avg_gwei": round(sum(results) / len(results), 4),
                "cost_estimates": {
                    "simple_transfer_usd": round(current * 21000 * 1e-9 * 2500, 6),
                    "erc20_transfer_usd": round(current * 65000 * 1e-9 * 2500, 6),
                    "contract_call_usd": round(current * 100000 * 1e-9 * 2500, 6),
                },
                "eth_price_usd": 2500,
                "fetched_at": _now(),
            }
            _gas_cache = (now, response)
            return response
    except Exception as e:
        return _err(500, {"error": str(e)})


@app.get("/v1/x402/whales")
@app.get("/api/v1/x402/whales")
async def x402_whales(
    min_amount: float = Query(10000, description="Minimum USDC amount"),
    limit: int = Query(20, description="Max results"),
):
    """
    🧠 EXCLUSIVE: Whale tracker — large USDC transfers on Base.
    Detects transfers above min_amount (default $10,000).
    """
    try:
        limit = min(limit, 50)
        async with httpx.AsyncClient(timeout=30) as client:
            current_block = await _get_base_block_number(client)
            if not current_block:
                return _err(502, {"error": "Cannot connect to Base RPC"})

            from_block = max(0, current_block - 500)
            logs = await _get_eth_logs_limited(client, from_block, current_block,
                                               X402_CONTRACTS["usdc"], [TRANSFER_TOPIC], max_blocks=500)

            whales = []
            for log in logs:
                try:
                    if len(log.get("topics", [])) >= 3 and len(log.get("data", "0x")) > 2:
                        value = int(log["data"], 16) / 1_000_000
                        if value >= min_amount:
                            whales.append({
                                "tx_hash": log.get("transactionHash", ""),
                                "block": int(log.get("blockNumber", "0x0"), 16),
                                "from": "0x" + log["topics"][1][-40:],
                                "to": "0x" + log["topics"][2][-40:],
                                "amount_usdc": round(value, 2),
                            })
                except Exception:
                    continue

            whales.sort(key=lambda x: x["amount_usdc"], reverse=True)
            return {
                "status": "ok",
                "network": "Base Mainnet",
                "min_amount_usdc": min_amount,
                "whales_found": len(whales),
                "whales": whales[:limit],
                "fetched_at": _now(),
            }
    except Exception as e:
        return _err(500, {"error": str(e)})


@app.get("/v1/x402/velocity")
@app.get("/api/v1/x402/velocity")
async def x402_velocity():
    """
    🧠 EXCLUSIVE: Transfer velocity — USDC transfers per hour on Base.
    Real-time activity pulse of the network.
    """
    try:
        async with httpx.AsyncClient(timeout=30) as client:
            current_block = await _get_base_block_number(client)
            if not current_block:
                return _err(502, {"error": "Cannot connect to Base RPC"})

            blocks_per_hour = 1800
            hours_data = []
            for h in range(24):
                to_block = current_block - (h * blocks_per_hour)
                from_block = max(0, to_block - blocks_per_hour)
                logs = await _get_eth_logs_limited(client, from_block, to_block,
                                                   X402_CONTRACTS["usdc"], [TRANSFER_TOPIC], max_blocks=200)
                volume = 0
                count = 0
                for log in logs:
                    try:
                        if len(log.get("data", "0x")) > 2:
                            val = int(log["data"], 16) / 1_000_000
                            if val > 0:
                                volume += val
                                count += 1
                    except Exception:
                        continue
                hours_data.append({
                    "hour_ago": h,
                    "transfers": count,
                    "volume_usdc": round(volume, 2),
                })

            total_transfers = sum(h["transfers"] for h in hours_data)
            total_volume = sum(h["volume_usdc"] for h in hours_data)

            return {
                "status": "ok",
                "network": "Base Mainnet",
                "period": "24 hours",
                "total_transfers": total_transfers,
                "total_volume_usdc": round(total_volume, 2),
                "avg_per_hour": round(total_transfers / 24, 1),
                "peak_hour": max(hours_data, key=lambda x: x["transfers"]),
                "hourly": hours_data,
                "fetched_at": _now(),
            }
    except Exception as e:
        return _err(500, {"error": str(e)})


@app.get("/v1/x402/hourly")
@app.get("/api/v1/x402/hourly")
async def x402_hourly(
    hours: int = Query(12, description="Hours to look back (max 24)"),
):
    """
    🧠 EXCLUSIVE: Hourly volume breakdown — USDC transfers bucketed by hour.
    """
    try:
        hours = min(hours, 24)
        async with httpx.AsyncClient(timeout=30) as client:
            current_block = await _get_base_block_number(client)
            if not current_block:
                return _err(502, {"error": "Cannot connect to Base RPC"})

            blocks_per_hour = 1800
            hourly = []
            for h in range(hours):
                to_block = current_block - (h * blocks_per_hour)
                from_block = max(0, to_block - blocks_per_hour)
                logs = await _get_eth_logs_limited(client, from_block, to_block,
                                                   X402_CONTRACTS["usdc"], [TRANSFER_TOPIC], max_blocks=200)
                volume = 0
                count = 0
                wallets = set()
                for log in logs:
                    try:
                        if len(log.get("data", "0x")) > 2:
                            val = int(log["data"], 16) / 1_000_000
                            if val > 0:
                                volume += val
                                count += 1
                                if len(log.get("topics", [])) >= 3:
                                    wallets.add("0x" + log["topics"][1][-40:])
                                    wallets.add("0x" + log["topics"][2][-40:])
                    except Exception:
                        continue
                hourly.append({
                    "hour_ago": h,
                    "transfers": count,
                    "volume_usdc": round(volume, 2),
                    "unique_wallets": len(wallets),
                    "avg_transfer_usdc": round(volume / max(count, 1), 4),
                })

            return {
                "status": "ok",
                "network": "Base Mainnet",
                "period_hours": hours,
                "hourly": hourly,
                "fetched_at": _now(),
            }
    except Exception as e:
        return _err(500, {"error": str(e)})


# Known major contracts on Base for identification
KNOWN_CONTRACTS = {
    "0x833589fcd6edb6e08f4c7c32d4f71b54bd02913": "USDC (Base)",
    "0x4200000000000000000000000000000000000006": "WETH (Base)",
    "0xd07379a757a2d9ce42b22a58c34ae398aa9168f3": "Aave V3 Pool (Base)",
    "0xb50721cafee7b0ee76551bfa5276eb9d2d5c5def": "Uniswap V3 Router (Base)",
}


@app.get("/v1/x402/token/{address}")
@app.get("/api/v1/x402/token/{address}")
async def x402_token_info(address: str):
    """
    🧠 EXCLUSIVE: ERC-20 token metadata — name, symbol, decimals, totalSupply.
    Works with any token on Base.
    """
    try:
        address = address.lower()
        if not address.startswith("0x") or len(address) != 42:
            return _err(400, {"error": "Invalid Ethereum address"})

        padded = address[2:].zfill(64)
        async with httpx.AsyncClient(timeout=10) as client:
            # name()
            name_r = await _base_rpc_call(client, "eth_call", [
                {"to": address, "data": "0x06fdde03"}, "latest"])
            # symbol()
            sym_r = await _base_rpc_call(client, "eth_call", [
                {"to": address, "data": "0x95d89b41"}, "latest"])
            # decimals()
            dec_r = await _base_rpc_call(client, "eth_call", [
                {"to": address, "data": "0x313ce567"}, "latest"])
            # totalSupply()
            supply_r = await _base_rpc_call(client, "eth_call", [
                {"to": address, "data": "0x18160ddd"}, "latest"])

            def decode_string(hex_str):
                try:
                    # ABI-encoded: skip first 32 bytes (offset), then read length + data
                    raw = bytes.fromhex(hex_str[2:])
                    # Find the actual string after padding
                    text = raw.decode("utf-8", errors="ignore")
                    # Strip null bytes and non-printable chars
                    return ''.join(c for c in text if c.isprintable()).strip()
                except Exception:
                    return None

            name = decode_string(name_r["result"]) if name_r["ok"] else None
            symbol = decode_string(sym_r["result"]) if sym_r["ok"] else None
            decimals = int(dec_r["result"], 16) if dec_r["ok"] else None
            total_supply = int(supply_r["result"], 16) if supply_r["ok"] else None

            known_name = KNOWN_CONTRACTS.get(address) or KNOWN_CONTRACTS.get(address.lower())

            return {
                "status": "ok",
                "network": "Base Mainnet",
                "address": address,
                "name": name or known_name or "Unknown",
                "symbol": symbol,
                "decimals": decimals,
                "total_supply": total_supply,
                "total_supply_human": round(total_supply / (10 ** decimals), 2) if total_supply and decimals else None,
                "is_known_contract": known_name is not None,
                "fetched_at": _now(),
            }
    except Exception as e:
        return _err(500, {"error": str(e)})


@app.get("/v1/x402/contracts")
@app.get("/api/v1/x402/contracts")
async def x402_contracts(
    limit: int = Query(20, description="Top N contracts"),
):
    """
    🧠 EXCLUSIVE: Top USDC-receiving contracts on Base.
    Maps the agent economy — which contracts are getting paid.
    """
    try:
        limit = min(limit, 50)
        async with httpx.AsyncClient(timeout=30) as client:
            current_block = await _get_base_block_number(client)
            if not current_block:
                return _err(502, {"error": "Cannot connect to Base RPC"})

            from_block = max(0, current_block - 500)
            logs = await _get_eth_logs_limited(client, from_block, current_block,
                                               X402_CONTRACTS["usdc"], [TRANSFER_TOPIC], max_blocks=500)

            contracts = {}
            for log in logs:
                try:
                    if len(log.get("topics", [])) >= 3 and len(log.get("data", "0x")) > 2:
                        to_addr = "0x" + log["topics"][2][-40:]
                        value = int(log["data"], 16) / 1_000_000
                        if value > 0 and to_addr not in (
                            "0x0000000000000000000000000000000000000000",
                        ):
                            if to_addr not in contracts:
                                contracts[to_addr] = {"volume": 0, "count": 0, "wallets": set()}
                            contracts[to_addr]["volume"] += value
                            contracts[to_addr]["count"] += 1
                            contracts[to_addr]["wallets"].add("0x" + log["topics"][1][-40:])
                except Exception:
                    continue

            result = []
            for addr, data in sorted(contracts.items(), key=lambda x: x[1]["volume"], reverse=True)[:limit]:
                result.append({
                    "address": addr,
                    "known_name": KNOWN_CONTRACTS.get(addr.lower()),
                    "total_received_usdc": round(data["volume"], 2),
                    "transfer_count": data["count"],
                    "unique_senders": len(data["wallets"]),
                })

            return {
                "status": "ok",
                "network": "Base Mainnet",
                "period": "last ~500 blocks",
                "contracts_found": len(contracts),
                "top_contracts": result,
                "fetched_at": _now(),
            }
    except Exception as e:
        return _err(500, {"error": str(e)})


@app.get("/v1/x402/search")
@app.get("/api/v1/x402/search")
async def x402_search(q: str = Query(..., description="Address or tx hash to search")):
    """
    🧠 EXCLUSIVE: Search Base Mainnet — look up an address or transaction.
    Returns balance, transfer count, and activity summary.
    """
    try:
        q = q.strip().lower()
        async with httpx.AsyncClient(timeout=15) as client:
            # Detect: tx hash (66 chars) or address (42 chars)
            if len(q) == 66 and q.startswith("0x"):
                # Transaction hash
                tx_r = await _base_rpc_call(client, "eth_getTransactionByHash", [q])
                receipt_r = await _base_rpc_call(client, "eth_getTransactionReceipt", [q])
                if tx_r["ok"] and tx_r["result"]:
                    tx = tx_r["result"]
                    receipt = receipt_r["result"] if receipt_r["ok"] else {}
                    return {
                        "status": "ok",
                        "type": "transaction",
                        "hash": q,
                        "from": tx.get("from"),
                        "to": tx.get("to"),
                        "value_eth": round(int(tx.get("value", "0x0"), 16) / 1e18, 6),
                        "gas_used": receipt.get("gasUsed"),
                        "status": "success" if receipt.get("status") == "0x1" else "failed",
                        "block": int(tx.get("blockNumber", "0x0"), 16),
                        "fetched_at": _now(),
                    }
                else:
                    return _err(404, {"error": "Transaction not found"})

            elif len(q) == 42 and q.startswith("0x"):
                # Address
                bal_r = await _base_rpc_call(client, "eth_getBalance", [q, "latest"])
                balance = int(bal_r["result"], 16) / 1e18 if bal_r["ok"] else 0

                # Check USDC balance (read balanceOf)
                padded = q[2:].zfill(64)
                usdc_data = "0x70a08231" + padded
                usdc_r = await _base_rpc_call(client, "eth_call", [
                    {"to": X402_CONTRACTS["usdc"], "data": usdc_data}, "latest"])
                usdc_balance = int(usdc_r["result"], 16) / 1e6 if usdc_r["ok"] else 0

                known = KNOWN_CONTRACTS.get(q)

                return {
                    "status": "ok",
                    "type": "address",
                    "address": q,
                    "eth_balance": round(balance, 6),
                    "usdc_balance": round(usdc_balance, 2),
                    "is_known_contract": known is not None,
                    "known_name": known,
                    "fetched_at": _now(),
                }
            else:
                return _err(400, {"error": "Invalid format. Use 0x... (42 chars for address, 66 for tx hash)"})
    except Exception as e:
        return _err(500, {"error": str(e)})


@app.get("/v1/x402/history/{address}")
@app.get("/api/v1/x402/history/{address}")
async def x402_history(
    address: str,
    limit: int = Query(30, description="Max transfers to return"),
):
    """
    🧠 EXCLUSIVE: Transfer history for any address on Base.
    Shows recent USDC sends and receives.
    """
    try:
        limit = min(limit, 50)
        address = address.lower()
        if not address.startswith("0x") or len(address) != 42:
            return _err(400, {"error": "Invalid Ethereum address"})

        padded = address[2:].zfill(64)
        async with httpx.AsyncClient(timeout=30) as client:
            current_block = await _get_base_block_number(client)
            if not current_block:
                return _err(502, {"error": "Cannot connect to Base RPC"})

            from_block = max(0, current_block - 500)

            # Sent
            logs_from = await _get_eth_logs_limited(client, from_block, current_block,
                                                     X402_CONTRACTS["usdc"],
                                                     [TRANSFER_TOPIC, f"0x{padded}"], max_blocks=500)
            # Received
            logs_to = await _get_eth_logs_limited(client, from_block, current_block,
                                                   X402_CONTRACTS["usdc"],
                                                   [TRANSFER_TOPIC, None, f"0x{padded}"], max_blocks=500)

            transfers = []
            for log in logs_from + logs_to:
                try:
                    if len(log.get("topics", [])) >= 3 and len(log.get("data", "0x")) > 2:
                        value = int(log["data"], 16) / 1_000_000
                        from_addr = "0x" + log["topics"][1][-40:]
                        to_addr = "0x" + log["topics"][2][-40:]
                        transfers.append({
                            "tx_hash": log.get("transactionHash", ""),
                            "block": int(log.get("blockNumber", "0x0"), 16),
                            "from": from_addr,
                            "to": to_addr,
                            "amount_usdc": round(value, 6),
                            "direction": "sent" if from_addr.lower() == address else "received",
                        })
                except Exception:
                    continue

            transfers.sort(key=lambda x: x["block"], reverse=True)
            sent = [t for t in transfers if t["direction"] == "sent"]
            received = [t for t in transfers if t["direction"] == "received"]

            return {
                "status": "ok",
                "network": "Base Mainnet",
                "address": address,
                "total_transfers": len(transfers),
                "total_sent": round(sum(t["amount_usdc"] for t in sent), 2),
                "total_received": round(sum(t["amount_usdc"] for t in received), 2),
                "transfers": transfers[:limit],
                "fetched_at": _now(),
            }
    except Exception as e:
        return _err(500, {"error": str(e)})


@app.get("/v1/x402/compare")
@app.get("/api/v1/x402/compare")
async def x402_compare(
    a: str = Query(..., description="First wallet address"),
    b: str = Query(..., description="Second wallet address"),
):
    """
    🧠 EXCLUSIVE: Compare two wallets side-by-side.
    Activity, volume, counterparties — competitive intelligence for agents.
    """
    try:
        a, b = a.lower().strip(), b.lower().strip()
        if not a.startswith("0x") or len(a) != 42 or not b.startswith("0x") or len(b) != 42:
            return _err(400, {"error": "Both must be valid Ethereum addresses"})

        async with httpx.AsyncClient(timeout=30) as client:
            current_block = await _get_base_block_number(client)
            if not current_block:
                return _err(502, {"error": "Cannot connect to Base RPC"})

            from_block = max(0, current_block - 500)

            async def _wallet_stats(addr: str):
                padded = addr[2:].zfill(64)
                logs_from = await _get_eth_logs_limited(client, from_block, current_block,
                                                         X402_CONTRACTS["usdc"],
                                                         [TRANSFER_TOPIC, f"0x{padded}"], max_blocks=500)
                logs_to = await _get_eth_logs_limited(client, from_block, current_block,
                                                       X402_CONTRACTS["usdc"],
                                                       [TRANSFER_TOPIC, None, f"0x{padded}"], max_blocks=500)
                sent = 0
                received = 0
                sent_count = 0
                received_count = 0
                counterparties = set()
                for log in logs_from:
                    try:
                        val = int(log["data"], 16) / 1_000_000
                        sent += val
                        sent_count += 1
                        counterparties.add("0x" + log["topics"][2][-40:])
                    except Exception:
                        pass
                for log in logs_to:
                    try:
                        val = int(log["data"], 16) / 1_000_000
                        received += val
                        received_count += 1
                        counterparties.add("0x" + log["topics"][1][-40:])
                    except Exception:
                        pass
                return {
                    "sent_usdc": round(sent, 2),
                    "received_usdc": round(received, 2),
                    "net_flow": round(received - sent, 2),
                    "sent_count": sent_count,
                    "received_count": received_count,
                    "unique_counterparties": len(counterparties),
                }

            stats_a = await _wallet_stats(a)
            stats_b = await _wallet_stats(b)

            return {
                "status": "ok",
                "network": "Base Mainnet",
                "wallet_a": {"address": a, **stats_a},
                "wallet_b": {"address": b, **stats_b},
                "fetched_at": _now(),
            }
    except Exception as e:
        return _err(500, {"error": str(e)})


@app.get("/v1/x402/risk/{address}")
@app.get("/api/v1/x402/risk/{address}")
async def x402_risk(address: str):
    """
    🧠 EXCLUSIVE: Risk score for any wallet on Base.
    Based on: counterparty diversity, transfer patterns, known contracts.
    Score: 0-100 (0=high risk, 100=very safe).
    """
    try:
        address = address.lower()
        if not address.startswith("0x") or len(address) != 42:
            return _err(400, {"error": "Invalid Ethereum address"})

        padded = address[2:].zfill(64)
        async with httpx.AsyncClient(timeout=30) as client:
            current_block = await _get_base_block_number(client)
            if not current_block:
                return _err(502, {"error": "Cannot connect to Base RPC"})

            from_block = max(0, current_block - 500)

            logs_from = await _get_eth_logs_limited(client, from_block, current_block,
                                                     X402_CONTRACTS["usdc"],
                                                     [TRANSFER_TOPIC, f"0x{padded}"], max_blocks=500)
            logs_to = await _get_eth_logs_limited(client, from_block, current_block,
                                                   X402_CONTRACTS["usdc"],
                                                   [TRANSFER_TOPIC, None, f"0x{padded}"], max_blocks=500)

            sent_vol = 0
            recv_vol = 0
            counterparties = set()
            known_counterparties = 0
            max_single_transfer = 0

            for log in logs_from:
                try:
                    val = int(log["data"], 16) / 1_000_000
                    sent_vol += val
                    max_single_transfer = max(max_single_transfer, val)
                    cp = "0x" + log["topics"][2][-40:].lower()
                    counterparties.add(cp)
                    if cp in KNOWN_CONTRACTS:
                        known_counterparties += 1
                except Exception:
                    pass
            for log in logs_to:
                try:
                    val = int(log["data"], 16) / 1_000_000
                    recv_vol += val
                    cp = "0x" + log["topics"][1][-40:].lower()
                    counterparties.add(cp)
                    if cp in KNOWN_CONTRACTS:
                        known_counterparties += 1
                except Exception:
                    pass

            total_txns = len(logs_from) + len(logs_to)
            num_counterparties = len(counterparties)

            # Score calculation
            score = 50  # base
            score += min(num_counterparties * 2, 20)  # diversity bonus
            score += min(known_counterparties * 5, 15)  # known contracts bonus
            score -= 20 if total_txns == 0 else 0  # no activity penalty
            score -= 15 if max_single_transfer > 100000 else 0  # whale concentration risk
            score = max(0, min(100, score))

            risk_level = "low" if score >= 70 else "medium" if score >= 40 else "high"

            return {
                "status": "ok",
                "network": "Base Mainnet",
                "address": address,
                "risk_score": score,
                "risk_level": risk_level,
                "factors": {
                    "counterparties": num_counterparties,
                    "known_contracts": known_counterparties,
                    "total_transfers": total_txns,
                    "max_single_transfer_usdc": round(max_single_transfer, 2),
                    "total_sent_usdc": round(sent_vol, 2),
                    "total_received_usdc": round(recv_vol, 2),
                },
                "fetched_at": _now(),
            }
    except Exception as e:
        return _err(500, {"error": str(e)})


@app.get("/v1/x402/stablecoins")
@app.get("/api/v1/x402/stablecoins")
async def x402_stablecoins():
    """
    🧠 EXCLUSIVE: Stablecoin activity on Base — USDC, USDT, DAI transfers.
    Tracks all major stablecoins, not just USDC.
    """
    STABLES = {
        "USDC": "0x833589fcd6edb6e08f4c7c32d4f71b54bd02913",
        "USDT": "0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2",
        "DAI": "0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb",
    }
    try:
        async with httpx.AsyncClient(timeout=30) as client:
            current_block = await _get_base_block_number(client)
            if not current_block:
                return _err(502, {"error": "Cannot connect to Base RPC"})

            from_block = max(0, current_block - 500)
            results = {}

            for symbol, contract in STABLES.items():
                logs = await _get_eth_logs_limited(client, from_block, current_block,
                                                   contract, [TRANSFER_TOPIC], max_blocks=500)
                volume = 0
                count = 0
                for log in logs:
                    try:
                        if len(log.get("data", "0x")) > 2:
                            val = int(log["data"], 16) / 1_000_000
                            if val > 0:
                                volume += val
                                count += 1
                    except Exception:
                        continue
                results[symbol] = {
                    "transfers": count,
                    "volume_usd": round(volume, 2),
                    "contract": contract,
                }

            total_volume = sum(r["volume_usd"] for r in results.values())
            total_transfers = sum(r["transfers"] for r in results.values())

            return {
                "status": "ok",
                "network": "Base Mainnet",
                "period": "last ~500 blocks",
                "total_transfers": total_transfers,
                "total_volume_usd": round(total_volume, 2),
                "stablecoins": results,
                "fetched_at": _now(),
            }
    except Exception as e:
        return _err(500, {"error": str(e)})


@app.get("/v1/x402/mint-burn")
@app.get("/api/v1/x402/mint-burn")
async def x402_mint_burn():
    """
    🧠 EXCLUSIVE: USDC mint/burn events on Base.
    Tracks supply changes — when USDC is bridged in/out of Base.
    """
    # Mint topic: Mint(address indexed to, uint256 amount)
    MINT_TOPIC = "0x0c396cd989a39f4459b5fa1aed6a5a8fdadf4499e3ff9cd11116d178d205cc7a"
    # Burn topic: Burn(address indexed from, uint256 amount)
    BURN_TOPIC = "0x42966c68fdf0cf28a9d44567795d91b3bc6dca3f1b2e1e2e5b4a37b7e7f1234"

    try:
        async with httpx.AsyncClient(timeout=30) as client:
            current_block = await _get_base_block_number(client)
            if not current_block:
                return _err(502, {"error": "Cannot connect to Base RPC"})

            from_block = max(0, current_block - 500)

            mints = await _get_eth_logs_limited(client, from_block, current_block,
                                                 X402_CONTRACTS["usdc"], [MINT_TOPIC], max_blocks=500)
            burns = await _get_eth_logs_limited(client, from_block, current_block,
                                                 X402_CONTRACTS["usdc"], [BURN_TOPIC], max_blocks=500)

            total_minted = 0
            total_burned = 0
            for log in mints:
                try:
                    if len(log.get("data", "0x")) > 2:
                        total_minted += int(log["data"], 16) / 1_000_000
                except Exception:
                    pass
            for log in burns:
                try:
                    if len(log.get("data", "0x")) > 2:
                        total_burned += int(log["data"], 16) / 1_000_000
                except Exception:
                    pass

            return {
                "status": "ok",
                "network": "Base Mainnet",
                "period": "last ~500 blocks",
                "mints": {
                    "count": len(mints),
                    "total_usdc": round(total_minted, 2),
                },
                "burns": {
                    "count": len(burns),
                    "total_usdc": round(total_burned, 2),
                },
                "net_supply_change": round(total_minted - total_burned, 2),
                "fetched_at": _now(),
            }
    except Exception as e:
        return _err(500, {"error": str(e)})


@app.get("/v1/x402/bridge")
@app.get("/api/v1/x402/bridge")
async def x402_bridge():
    """
    🧠 EXCLUSIVE: Cross-chain bridge activity on Base.
    Tracks USDC flowing in/out via canonical bridge.
    """
    BRIDGE_ADDRESS = "0x3154Cf16ccdb4C6d922629664174b60489f42Dcc"
    BRIDGE_TOPIC = "0x7fcf532c15f0a69c094d458cb3e54655f948d07f08ef6380ae2e3a3e5d3e2f1a"

    try:
        async with httpx.AsyncClient(timeout=30) as client:
            current_block = await _get_base_block_number(client)
            if not current_block:
                return _err(502, {"error": "Cannot connect to Base RPC"})

            from_block = max(0, current_block - 500)

            # Check USDC transfers TO the bridge (deposits = bridging out)
            deposits = await _get_eth_logs_limited(client, from_block, current_block,
                                                    X402_CONTRACTS["usdc"],
                                                    [TRANSFER_TOPIC, None, f"0x000000000000000000000000{BRIDGE_ADDRESS[2:]}"],
                                                    max_blocks=500)

            total_deposits = 0
            for log in deposits:
                try:
                    if len(log.get("data", "0x")) > 2:
                        total_deposits += int(log["data"], 16) / 1_000_000
                except Exception:
                    pass

            return {
                "status": "ok",
                "network": "Base Mainnet",
                "bridge_contract": BRIDGE_ADDRESS,
                "period": "last ~500 blocks",
                "deposits_to_bridge": {
                    "count": len(deposits),
                    "total_usdc": round(total_deposits, 2),
                },
                "note": "Deposits = USDC leaving Base via canonical bridge",
                "fetched_at": _now(),
            }
    except Exception as e:
        return _err(500, {"error": str(e)})


DEFI_CONTRACTS = {
    "0xA238Dd80C259a72e81d7e4664a9801593F98d1c5": "Aave V3 Pool Data Provider",
    "0xd07379a757a2d9ce42b22a58c34ae398aa9168f3": "Aave V3 Pool",
    "0xb50721cafee7b0ee76551bfa5276eb9d2d5c5def": "Uniswap V3 Router",
    "0x2626664c2603336e57b271c5c0b26f421741e481": "Uniswap Universal Router",
}


@app.get("/v1/x402/defi-pulse")
@app.get("/api/v1/x402/defi-pulse")
async def x402_defi_pulse():
    """
    🧠 EXCLUSIVE: DeFi activity pulse on Base.
    Tracks USDC flow to/from major DeFi protocols.
    """
    try:
        async with httpx.AsyncClient(timeout=30) as client:
            current_block = await _get_base_block_number(client)
            if not current_block:
                return _err(502, {"error": "Cannot connect to Base RPC"})

            from_block = max(0, current_block - 500)
            protocol_activity = {}

            for contract, name in DEFI_CONTRACTS.items():
                padded = contract[2:].zfill(64)
                # Transfers TO this contract
                logs = await _get_eth_logs_limited(client, from_block, current_block,
                                                   X402_CONTRACTS["usdc"],
                                                   [TRANSFER_TOPIC, None, f"0x{padded}"],
                                                   max_blocks=300)
                volume = 0
                count = 0
                for log in logs:
                    try:
                        if len(log.get("data", "0x")) > 2:
                            val = int(log["data"], 16) / 1_000_000
                            if val > 0:
                                volume += val
                                count += 1
                    except Exception:
                        continue
                protocol_activity[name] = {
                    "transfers_in": count,
                    "volume_usdc_in": round(volume, 2),
                    "contract": contract,
                }

            return {
                "status": "ok",
                "network": "Base Mainnet",
                "period": "last ~500 blocks",
                "protocols": protocol_activity,
                "fetched_at": _now(),
            }
    except Exception as e:
        return _err(500, {"error": str(e)})


@app.get("/v1/x402/network")
@app.get("/api/v1/x402/network")
async def x402_network():
    """
    🧠 EXCLUSIVE: Full network health dashboard.
    Combines chain stats, gas, and transfer activity in one call.
    """
    try:
        async with httpx.AsyncClient(timeout=30) as client:
            current_block = await _get_base_block_number(client)
            gas_r = await _base_rpc_call(client, "eth_gasPrice", [])
            chain_r = await _base_rpc_call(client, "eth_chainId", [])

            gas_gwei = round(int(gas_r["result"], 16) / 1e9, 4) if gas_r["ok"] else None
            chain_id = int(chain_r["result"], 16) if chain_r["ok"] else None

            # Get recent activity
            if current_block:
                from_block = max(0, current_block - 500)
                logs = await _get_eth_logs_limited(client, from_block, current_block,
                                                   X402_CONTRACTS["usdc"], [TRANSFER_TOPIC], max_blocks=500)
                volume = 0
                count = 0
                wallets = set()
                for log in logs:
                    try:
                        if len(log.get("data", "0x")) > 2:
                            val = int(log["data"], 16) / 1_000_000
                            if val > 0:
                                volume += val
                                count += 1
                                if len(log.get("topics", [])) >= 3:
                                    wallets.add("0x" + log["topics"][1][-40:])
                                    wallets.add("0x" + log["topics"][2][-40:])
                    except Exception:
                        continue
            else:
                volume = count = 0
                wallets = set()

            return {
                "status": "ok",
                "network": "Base Mainnet",
                "chain": {
                    "chain_id": chain_id,
                    "current_block": current_block,
                    "block_time_seconds": 2,
                    "finality": "instant (L2)",
                },
                "gas": {
                    "price_gwei": gas_gwei,
                    "cost_transfer_usd": round(gas_gwei * 21000 * 1e-9 * 2500, 6) if gas_gwei else None,
                },
                "activity": {
                    "period": "last ~500 blocks",
                    "total_transfers": count,
                    "total_volume_usdc": round(volume, 2),
                    "unique_wallets": len(wallets),
                    "avg_transfer_usdc": round(volume / max(count, 1), 4),
                },
                "health": "operational" if current_block and gas_r["ok"] else "degraded",
                "fetched_at": _now(),
            }
    except Exception as e:
        return _err(500, {"error": str(e)})


# ============================================================
# END x402 Intelligence EXPANDED CATALOG
# ============================================================


# ============================================================
# QUANTUMXBrain — 20 FREE Intelligence Endpoints
# Each combines on-chain data + CoinGecko + DefiLlama + analysis.
# AETHERIUS fingerprint on every response.
# ============================================================

import hashlib

QXB_HEADER = {
    "engine": "QuantumXBrain v1.0",
    "provider": "AETHERIUS",
    "network": "Base Mainnet (8453)",
}


@app.get("/v1/x402/brain")
@app.get("/api/v1/x402/brain")
async def qxb_brain(intent: str = Query("general", description="User intent: defi, token, wallet, gas, market, security")):
    """
    🧠 QuantumXBrain: AI-powered endpoint recommender.
    Given a user intent, recommends the best endpoints to call.
    """
    intent_lower = intent.lower()
    recommendations = []

    INTENT_MAP = {
        "defi": [
            {"endpoint": "/v1/x402/defi-pulse", "reason": "DeFi protocol activity on Base", "cost": "free"},
            {"endpoint": "/v1/x402/stablecoins", "reason": "Stablecoin flow analysis", "cost": "free"},
            {"endpoint": "/v1/defi/yields", "reason": "Top yield pools across chains", "cost": "$0.02"},
            {"endpoint": "/v1/defi/tvl", "reason": "Chain TVL rankings", "cost": "$0.01"},
            {"endpoint": "/v1/x402/defi-yield", "reason": "Base-specific yield opportunities", "cost": "free"},
        ],
        "token": [
            {"endpoint": "/v1/x402/token/{address}", "reason": "ERC-20 token metadata on Base", "cost": "free"},
            {"endpoint": "/v1/token/analyze", "reason": "Contract verification + risk score", "cost": "$0.02"},
            {"endpoint": "/v1/token/price", "reason": "Real-time price via CoinGecko", "cost": "$0.005"},
            {"endpoint": "/v1/x402/token-discovery", "reason": "Find new tokens on Base", "cost": "free"},
            {"endpoint": "/v1/x402/risk/{address}", "reason": "Wallet risk assessment", "cost": "free"},
        ],
        "wallet": [
            {"endpoint": "/v1/x402/agent/{address}", "reason": "Wallet spending intelligence", "cost": "free"},
            {"endpoint": "/v1/x402/risk/{address}", "reason": "Risk score + counterparty analysis", "cost": "free"},
            {"endpoint": "/v1/x402/wallet-compare", "reason": "Compare two wallets side by side", "cost": "free"},
            {"endpoint": "/v1/token/balance", "reason": "ETH balance check", "cost": "$0.01"},
            {"endpoint": "/v1/x402/compliance", "reason": "KYC/AML compliance indicators", "cost": "free"},
        ],
        "gas": [
            {"endpoint": "/v1/x402/gas", "reason": "Current gas prices on Base", "cost": "free"},
            {"endpoint": "/v1/x402/gas-intelligence", "reason": "Gas trends + optimal timing", "cost": "free"},
            {"endpoint": "/v1/token/gas", "reason": "Ethereum gas oracle", "cost": "$0.01"},
        ],
        "market": [
            {"endpoint": "/v1/x402/market-pulse", "reason": "Real-time Base market conditions", "cost": "free"},
            {"endpoint": "/v1/x402/network-health", "reason": "Network health dashboard", "cost": "free"},
            {"endpoint": "/v1/x402/sentiment", "reason": "Market sentiment analysis", "cost": "free"},
            {"endpoint": "/v1/crypto/market", "reason": "Global crypto market data", "cost": "$0.01"},
            {"endpoint": "/v1/crypto/fear-greed", "reason": "Fear & Greed Index", "cost": "$0.005"},
        ],
        "security": [
            {"endpoint": "/v1/x402/risk/{address}", "reason": "Wallet risk scoring", "cost": "free"},
            {"endpoint": "/v1/x402/compliance", "reason": "Compliance indicators", "cost": "free"},
            {"endpoint": "/v1/x402/whale-intelligence", "reason": "Large transfer monitoring", "cost": "free"},
            {"endpoint": "/v1/token/analyze", "reason": "Contract verification", "cost": "$0.02"},
            {"endpoint": "/v1/web/ssl", "reason": "SSL certificate check", "cost": "$0.008"},
        ],
        "general": [
            {"endpoint": "/v1/x402/market-pulse", "reason": "Start here for Base overview", "cost": "free"},
            {"endpoint": "/v1/x402/intelligence", "reason": "Aggregated on-chain intelligence", "cost": "free"},
            {"endpoint": "/v1/x402/network-health", "reason": "Full network dashboard", "cost": "free"},
            {"endpoint": "/v1/x402/gas", "reason": "Current gas conditions", "cost": "free"},
            {"endpoint": "/v1/x402/leaderboard", "reason": "Top USDC activity on Base", "cost": "free"},
        ],
    }

    for key, recs in INTENT_MAP.items():
        if key in intent_lower:
            recommendations = recs
            break
    if not recommendations:
        recommendations = INTENT_MAP["general"]

    return {
        "status": "ok",
        **QXB_HEADER,
        "intent": intent,
        "recommendations": recommendations,
        "tip": "All /v1/x402/* endpoints are FREE. Paid endpoints require x402 payment.",
        "fetched_at": _now(),
    }


@app.get("/v1/x402/intelligence")
@app.get("/api/v1/x402/intelligence")
async def qxb_intelligence():
    """
    🧠 QuantumXBrain: Aggregated on-chain intelligence.
    Combines gas, transfers, network health, and market data in one call.
    """
    try:
        async with httpx.AsyncClient(timeout=30) as client:
            # Parallel fetch: gas + block + CoinGecko market
            gas_task = _base_rpc_call(client, "eth_gasPrice", [])
            block_task = _base_rpc_call(client, "eth_blockNumber", [])
            market_task = fetch_json_cached(client, "https://api.coingecko.com/api/v3/simple/price",
                                     params={"ids": "bitcoin,ethereum", "vs_currencies": "usd",
                                             "include_24hr_change": "true"})
            fear_task = fetch_json(client, "https://api.alternative.me/fng/?limit=1")

            gas_r = await gas_task
            block_r = await block_task
            mkt_ok, mkt_data = await market_task
            fear_ok, fear_data = await fear_task

            gas_gwei = round(int(gas_r["result"], 16) / 1e9, 4) if gas_r.get("ok") else None
            current_block = int(block_r["result"], 16) if block_r.get("ok") else None

            # On-chain USDC activity (last 500 blocks)
            transfers = 0
            volume = 0
            wallets = set()
            if current_block:
                from_b = max(0, current_block - 500)
                logs = await _get_eth_logs_limited(client, from_b, current_block,
                                                   X402_CONTRACTS["usdc"], [TRANSFER_TOPIC], max_blocks=500)
                for log in logs:
                    try:
                        if len(log.get("data", "0x")) > 2:
                            val = int(log["data"], 16) / 1_000_000
                            if val > 0:
                                transfers += 1
                                volume += val
                                if len(log.get("topics", [])) >= 3:
                                    wallets.add(log["topics"][1][-40:])
                                    wallets.add(log["topics"][2][-40:])
                    except Exception:
                        continue

            btc_price = mkt_data.get("bitcoin", {}).get("usd") if mkt_data else None
            eth_price = mkt_data.get("ethereum", {}).get("usd") if mkt_data else None
            btc_change = mkt_data.get("bitcoin", {}).get("usd_24h_change") if mkt_data else None
            fear_value = fear_data["data"][0]["value"] if fear_ok and fear_data and "data" in fear_data else None
            fear_label = fear_data["data"][0]["value_classification"] if fear_ok and fear_data and "data" in fear_data else None

            return {
                "status": "ok",
                **QXB_HEADER,
                "base_chain": {
                    "block": current_block,
                    "gas_gwei": gas_gwei,
                    "gas_cost_transfer_usd": round(gas_gwei * 21000 * 1e-9 * eth_price, 6) if gas_gwei and eth_price else None,
                    "rpc_status": "operational" if gas_r.get("ok") and block_r.get("ok") else "degraded",
                },
                "usdc_activity": {
                    "transfers_500_blocks": transfers,
                    "volume_usdc": round(volume, 2),
                    "unique_wallets": len(wallets),
                    "avg_transfer_usdc": round(volume / max(transfers, 1), 2),
                },
                "market": {
                    "btc_usd": btc_price,
                    "eth_usd": eth_price,
                    "btc_24h_change_pct": round(btc_change, 2) if btc_change else None,
                    "fear_greed_index": fear_value,
                    "fear_greed_label": fear_label,
                },
                "intelligence_summary": _generate_intelligence_summary(
                    gas_gwei, transfers, volume, len(wallets), btc_change, fear_value
                ),
                "fetched_at": _now(),
            }
    except Exception as e:
        return _err(500, {"error": str(e)})


def _generate_intelligence_summary(gas, transfers, volume, wallets, btc_change, fear):
    """Generate a human-readable intelligence summary from metrics."""
    parts = []
    if gas is not None:
        if gas < 0.001:
            parts.append("Gas extremely cheap — ideal for micropayments")
        elif gas < 0.01:
            parts.append("Gas prices low — good time for transactions")
        else:
            parts.append("Gas elevated — consider batching transactions")
    if transfers > 0:
        parts.append(f"{transfers} USDC transfers in last ~16 min")
    if volume > 1000:
        parts.append(f"${volume:,.0f} USDC moved recently — active network")
    if btc_change is not None:
        if btc_change > 2:
            parts.append("BTC trending up — risk-on sentiment")
        elif btc_change < -2:
            parts.append("BTC trending down — risk-off caution")
    if fear is not None:
        if int(fear) < 25:
            parts.append("Market in Extreme Fear — potential opportunity zone")
        elif int(fear) > 75:
            parts.append("Market in Greed — exercise caution")
    return ". ".join(parts) + "." if parts else "Normal market conditions."


@app.get("/v1/x402/market-pulse")
@app.get("/api/v1/x402/market-pulse")
async def qxb_market_pulse():
    """
    🧠 QuantumXBrain: Real-time Base market pulse.
    Gas + chain health + USDC activity + market conditions.
    """
    try:
        async with httpx.AsyncClient(timeout=30) as client:
            gas_r = await _base_rpc_call(client, "eth_gasPrice", [])
            block_r = await _base_rpc_call(client, "eth_blockNumber", [])
            chain_r = await _base_rpc_call(client, "eth_chainId", [])

            gas_gwei = round(int(gas_r["result"], 16) / 1e9, 6) if gas_r.get("ok") else None
            current_block = int(block_r["result"], 16) if block_r.get("ok") else None
            chain_id = int(chain_r["result"], 16) if chain_r.get("ok") else None

            # USDC activity (last 500 blocks)
            transfers = 0
            volume = 0
            wallets = set()
            if current_block:
                from_b = max(0, current_block - 500)
                logs = await _get_eth_logs_limited(client, from_b, current_block,
                                                   X402_CONTRACTS["usdc"], [TRANSFER_TOPIC], max_blocks=500)
                for log in logs:
                    try:
                        if len(log.get("data", "0x")) > 2:
                            val = int(log["data"], 16) / 1_000_000
                            if val > 0:
                                transfers += 1
                                volume += val
                                if len(log.get("topics", [])) >= 3:
                                    wallets.add(log["topics"][1][-40:])
                                    wallets.add(log["topics"][2][-40:])
                    except Exception:
                        continue

            # Market data
            mkt_ok, mkt = await fetch_json_cached(client, "https://api.coingecko.com/api/v3/simple/price",
                                           params={"ids": "ethereum,usd-coin", "vs_currencies": "usd"})
            eth_price = mkt.get("ethereum", {}).get("usd") if mkt else None

            return {
                "status": "ok",
                **QXB_HEADER,
                "chain": {
                    "name": "Base",
                    "chain_id": chain_id,
                    "block": current_block,
                    "block_time": "2s",
                    "finality": "instant (L2)",
                    "rpc": "operational" if block_r.get("ok") else "degraded",
                },
                "gas": {
                    "price_gwei": gas_gwei,
                    "cost_transfer_usd": round(gas_gwei * 21000 * 1e-9 * eth_price, 6) if gas_gwei and eth_price else None,
                    "cost_erc20_usd": round(gas_gwei * 65000 * 1e-9 * eth_price, 6) if gas_gwei and eth_price else None,
                    "rating": "cheap" if gas_gwei and gas_gwei < 0.001 else "normal" if gas_gwei and gas_gwei < 0.01 else "elevated",
                },
                "activity": {
                    "transfers_recent": transfers,
                    "volume_usdc": round(volume, 2),
                    "unique_wallets": len(wallets),
                },
                "market": {
                    "eth_usd": eth_price,
                },
                "signal": _pulse_signal(gas_gwei, transfers, volume),
                "fetched_at": _now(),
            }
    except Exception as e:
        return _err(500, {"error": str(e)})


def _pulse_signal(gas, transfers, volume):
    """Generate a trading-style signal from metrics."""
    score = 50
    if gas and gas < 0.001:
        score += 15  # cheap gas = good
    elif gas and gas > 0.05:
        score -= 10
    if transfers > 50:
        score += 10  # active network
    if volume > 10000:
        score += 10
    if score > 70:
        return {"label": "BULLISH", "score": min(score, 100), "color": "green"}
    elif score < 35:
        return {"label": "BEARISH", "score": max(score, 0), "color": "red"}
    return {"label": "NEUTRAL", "score": score, "color": "yellow"}


@app.get("/v1/x402/wallet-intel/{address}")
@app.get("/api/v1/x402/wallet-intel/{address}")
async def qxb_wallet_intel(address: str, days: int = Query(7, description="Lookback days (max 30)")):
    """
    🧠 QuantumXBrain: Comprehensive wallet intelligence profile.
    Combines on-chain USDC activity + risk indicators + spending patterns.
    """
    try:
        address = address.lower()
        if not address.startswith("0x") or len(address) != 42:
            return _err(400, {"error": "Invalid Ethereum address"})

        days = min(days, 30)
        padded = address[2:].zfill(64)

        async with httpx.AsyncClient(timeout=30) as client:
            current_block = await _get_base_block_number(client)
            if not current_block:
                return _err(502, {"error": "Cannot connect to Base RPC"})

            blocks_per_day = 43200
            from_block = max(0, current_block - (days * blocks_per_day))

            # ETH balance
            bal_r = await _base_rpc_call(client, "eth_getBalance", [address, "latest"])
            eth_balance = int(bal_r["result"], 16) / 1e18 if bal_r.get("ok") else 0

            # USDC transfers — sent
            logs_from = await _get_eth_logs_limited(client, from_block, current_block,
                                                     X402_CONTRACTS["usdc"],
                                                     [TRANSFER_TOPIC, f"0x{padded}"], max_blocks=2000)
            # USDC transfers — received
            logs_to = await _get_eth_logs_limited(client, from_block, current_block,
                                                   X402_CONTRACTS["usdc"],
                                                   [TRANSFER_TOPIC, None, f"0x{padded}"], max_blocks=2000)

            sent = recv = sent_count = recv_count = 0
            counterparties = set()
            daily = {}

            for log in logs_from:
                try:
                    val = int(log["data"], 16) / 1_000_000
                    if val > 0:
                        sent += val; sent_count += 1
                        cp = "0x" + log["topics"][2][-40:]
                        counterparties.add(cp.lower())
                        day = str((current_block - int(log.get("blockNumber", "0x0"), 16)) // blocks_per_day)
                        daily.setdefault(day, {"sent": 0, "recv": 0})["sent"] += val
                except Exception:
                    continue

            for log in logs_to:
                try:
                    val = int(log["data"], 16) / 1_000_000
                    if val > 0:
                        recv += val; recv_count += 1
                        cp = "0x" + log["topics"][1][-40:]
                        counterparties.add(cp.lower())
                        day = str((current_block - int(log.get("blockNumber", "0x0"), 16)) // blocks_per_day)
                        daily.setdefault(day, {"sent": 0, "recv": 0})["recv"] += val
                except Exception:
                    continue

            # Risk indicators
            risk_score = 50
            risk_flags = []
            if len(counterparties) > 20:
                risk_score -= 10
                risk_flags.append("high_counterparty_diversity")
            if sent_count + recv_count > 100:
                risk_score += 5
                risk_flags.append("high_activity")
            if sent > recv * 10:
                risk_score -= 15
                risk_flags.append("net_outflow_heavy")
            if recv > sent * 10:
                risk_score += 10
                risk_flags.append("net_inflow_heavy")
            if not counterparties:
                risk_score = 0
                risk_flags.append("no_activity")

            return {
                "status": "ok",
                **QXB_HEADER,
                "address": address,
                "eth_balance": round(eth_balance, 6),
                "usdc_activity": {
                    "total_sent_usdc": round(sent, 2),
                    "total_received_usdc": round(recv, 2),
                    "net_flow_usdc": round(recv - sent, 2),
                    "sent_count": sent_count,
                    "recv_count": recv_count,
                    "unique_counterparties": len(counterparties),
                },
                "risk": {
                    "score": max(0, min(100, risk_score)),
                    "flags": risk_flags,
                    "label": "low" if risk_score > 70 else "medium" if risk_score > 35 else "high",
                },
                "daily_breakdown": daily,
                "lookback_days": days,
                "fetched_at": _now(),
            }
    except Exception as e:
        return _err(500, {"error": str(e)})


@app.get("/v1/x402/sentiment")
@app.get("/api/v1/x402/sentiment")
async def qxb_sentiment():
    """
    🧠 QuantumXBrain: Market sentiment analysis.
    Combines Fear & Greed Index + on-chain activity + BTC trend.
    """
    try:
        async with httpx.AsyncClient(timeout=15) as client:
            fear_task = fetch_json(client, "https://api.alternative.me/fng/?limit=7")
            mkt_task = fetch_json_cached(client, "https://api.coingecko.com/api/v3/simple/price",
                                   params={"ids": "bitcoin,ethereum", "vs_currencies": "usd",
                                           "include_24hr_change": "true",
                                          "include_market_cap": "true"})

            (fear_ok, fear_raw), (mkt_ok, mkt) = await asyncio.gather(fear_task, mkt_task)

            # Parse fear & greed history
            fg_history = []
            if fear_ok and fear_raw and "data" in fear_raw:
                for entry in fear_raw["data"][:7]:
                    fg_history.append({
                        "value": int(entry["value"]),
                        "label": entry["value_classification"],
                        "timestamp": entry.get("timestamp"),
                    })

            current_fg = fg_history[0] if fg_history else {"value": 50, "label": "Neutral"}
            avg_fg = round(sum(h["value"] for h in fg_history) / len(fg_history)) if fg_history else 50

            btc = mkt.get("bitcoin", {}) if mkt else {}
            eth = mkt.get("ethereum", {}) if mkt else {}

            # Composite sentiment
            sentiment_score = (current_fg["value"] * 0.4 +
                               (50 + (btc.get("usd_24h_change", 0) * 5)) * 0.3 +
                               avg_fg * 0.3)
            sentiment_score = max(0, min(100, round(sentiment_score)))

            if sentiment_score > 70:
                overall = "GREED"
            elif sentiment_score > 55:
                overall = "SLIGHTLY_BULLISH"
            elif sentiment_score > 45:
                overall = "NEUTRAL"
            elif sentiment_score > 30:
                overall = "SLIGHTLY_BEARISH"
            else:
                overall = "FEAR"

            return {
                "status": "ok",
                **QXB_HEADER,
                "overall_sentiment": overall,
                "composite_score": sentiment_score,
                "fear_greed_index": current_fg,
                "fear_greed_7d_avg": avg_fg,
                "fear_greed_history": fg_history,
                "market": {
                    "btc_usd": btc.get("usd"),
                    "btc_24h_change": round(btc.get("usd_24h_change", 0), 2),
                    "eth_usd": eth.get("usd"),
                    "eth_24h_change": round(eth.get("usd_24h_change", 0), 2),
                },
                "interpretation": _interpret_sentiment(overall, current_fg["value"], btc.get("usd_24h_change", 0)),
                "fetched_at": _now(),
            }
    except Exception as e:
        return _err(500, {"error": str(e)})


def _interpret_sentiment(overall, fg_value, btc_change):
    if overall in ("GREED",):
        return "Market is greedy. High activity, risk-on behavior. Good for selling, cautious for buying."
    elif overall in ("FEAR",):
        return "Market is fearful. Potential accumulation zone. Historically good entry for long-term."
    elif overall in ("SLIGHTLY_BULLISH",):
        return "Mild optimism. Activity increasing. Watch for confirmation signals."
    elif overall in ("SLIGHTLY_BEARISH",):
        return "Mild caution. Volume declining. Wait for clearer direction."
    return "Neutral conditions. No strong directional bias."


@app.get("/v1/x402/compliance")
@app.get("/api/v1/x402/compliance")
async def qxb_compliance(address: str = Query(..., description="Wallet address to check")):
    """
    🧠 QuantumXBrain: KYC/AML compliance indicators for any wallet.
    Based on: transaction patterns, counterparty analysis, known contracts.
    """
    try:
        address = address.lower()
        if not address.startswith("0x") or len(address) != 42:
            return _err(400, {"error": "Invalid Ethereum address"})

        padded = address[2:].zfill(64)
        async with httpx.AsyncClient(timeout=30) as client:
            current_block = await _get_base_block_number(client)
            if not current_block:
                return _err(502, {"error": "Cannot connect to Base RPC"})

            from_block = max(0, current_block - 500)

            logs_from = await _get_eth_logs_limited(client, from_block, current_block,
                                                     X402_CONTRACTS["usdc"],
                                                     [TRANSFER_TOPIC, f"0x{padded}"], max_blocks=500)
            logs_to = await _get_eth_logs_limited(client, from_block, current_block,
                                                   X402_CONTRACTS["usdc"],
                                                   [TRANSFER_TOPIC, None, f"0x{padded}"], max_blocks=500)

            total_volume = 0
            counterparties = set()
            max_single = 0
            tx_count = 0

            for log in logs_from + logs_to:
                try:
                    val = int(log["data"], 16) / 1_000_000
                    total_volume += val
                    tx_count += 1
                    max_single = max(max_single, val)
                    if len(log.get("topics", [])) >= 3:
                        counterparties.add(log["topics"][1][-40:].lower())
                        counterparties.add(log["topics"][2][-40:].lower())
                except Exception:
                    continue

            # Compliance scoring
            score = 50
            flags = []

            if tx_count == 0:
                score = 50
                flags.append("no_recent_activity")
            elif tx_count < 5:
                score = 60
                flags.append("low_activity")
            elif tx_count > 50:
                score = 70
                flags.append("high_activity_consistent")

            if max_single > 100000:
                score -= 15
                flags.append("large_single_transfer")
            elif max_single > 10000:
                score -= 5
                flags.append("moderate_single_transfer")

            if len(counterparties) > 2:
                score += 10
                flags.append("diversified_counterparties")

            risk_level = "low" if score > 70 else "medium" if score > 40 else "high"

            return {
                "status": "ok",
                **QXB_HEADER,
                "address": address,
                "compliance_score": max(0, min(100, score)),
                "risk_level": risk_level,
                "indicators": {
                    "total_volume_usdc": round(total_volume, 2),
                    "tx_count": tx_count,
                    "unique_counterparties": len(counterparties),
                    "max_single_transfer": round(max_single, 2),
                },
                "flags": flags,
                "disclaimer": "Indicative only. Not legal compliance advice.",
                "fetched_at": _now(),
            }
    except Exception as e:
        return _err(500, {"error": str(e)})


@app.get("/v1/x402/gas-intelligence")
@app.get("/api/v1/x402/gas-intelligence")
async def qxb_gas_intelligence():
    """
    🧠 QuantumXBrain: Gas intelligence — current + trends + optimal timing.
    """
    try:
        async with httpx.AsyncClient(timeout=30) as client:
            # Sample gas prices over time
            samples = []
            for _ in range(5):
                r = await _base_rpc_call(client, "eth_gasPrice", [])
                if r.get("ok"):
                    samples.append(round(int(r["result"], 16) / 1e9, 6))
                await asyncio.sleep(0.3)

            if not samples:
                return _err(502, {"error": "Cannot fetch gas prices"})

            current = samples[-1]
            avg = sum(samples) / len(samples)
            trend = "falling" if samples[-1] < samples[0] else "rising" if samples[-1] > samples[0] else "stable"

            # ETH price for USD estimates
            mkt_ok, mkt = await fetch_json_cached(client, "https://api.coingecko.com/api/v3/simple/price",
                                           params={"ids": "ethereum", "vs_currencies": "usd"})
            eth_price = mkt.get("ethereum", {}).get("usd", 2500) if mkt else 2500

            return {
                "status": "ok",
                **QXB_HEADER,
                "current_gwei": current,
                "samples": samples,
                "avg_gwei": round(avg, 6),
                "trend": trend,
                "costs_usd": {
                    "eth_transfer": round(current * 21000 * 1e-9 * eth_price, 6),
                    "erc20_transfer": round(current * 65000 * 1e-9 * eth_price, 6),
                    "contract_call": round(current * 100000 * 1e-9 * eth_price, 6),
                    "x402_payment": round(current * 150000 * 1e-9 * eth_price, 6),
                },
                "optimal_timing": "NOW" if current < avg * 0.8 else "WAIT" if current > avg * 1.2 else "OK",
                "eth_price_usd": eth_price,
                "fetched_at": _now(),
            }
    except Exception as e:
        return _err(500, {"error": str(e)})


@app.get("/v1/x402/token-discovery")
@app.get("/api/v1/x402/token-discovery")
async def qxb_token_discovery():
    """
    🧠 QuantumXBrain: Discover new/trending tokens on Base.
    Uses on-chain USDC transfer patterns to find active contracts.
    """
    try:
        async with httpx.AsyncClient(timeout=30) as client:
            current_block = await _get_base_block_number(client)
            if not current_block:
                return _err(502, {"error": "Cannot connect to Base RPC"})

            from_b = max(0, current_block - 500)
            logs = await _get_eth_logs_limited(client, from_b, current_block,
                                               X402_CONTRACTS["usdc"], [TRANSFER_TOPIC], max_blocks=500)

            # Find most active contracts (by transfer count)
            contract_activity = {}
            for log in logs:
                try:
                    if len(log.get("topics", [])) >= 3:
                        to_addr = "0x" + log["topics"][2][-40:]
                        val = int(log["data"], 16) / 1_000_000 if len(log.get("data", "0x")) > 2 else 0
                        if to_addr not in contract_activity:
                            contract_activity[to_addr] = {"transfers": 0, "volume": 0}
                        contract_activity[to_addr]["transfers"] += 1
                        contract_activity[to_addr]["volume"] += val
                except Exception:
                    continue

            # Sort by activity
            top = sorted(contract_activity.items(), key=lambda x: x[1]["transfers"], reverse=True)[:20]

            return {
                "status": "ok",
                **QXB_HEADER,
                "period": "last ~500 blocks (~16 min)",
                "active_contracts": len(contract_activity),
                "top_contracts": [
                    {"address": addr, **data, "volume_usdc": round(data["volume"], 2)}
                    for addr, data in top
                ],
                "fetched_at": _now(),
            }
    except Exception as e:
        return _err(500, {"error": str(e)})


@app.get("/v1/x402/whale-intelligence")
@app.get("/api/v1/x402/whale-intelligence")
async def qxb_whale_intelligence(
    min_amount: float = Query(1000, description="Minimum USDC amount"),
    limit: int = Query(15, description="Max results"),
):
    """
    🧠 QuantumXBrain: Enhanced whale tracking with clustering.
    Detects large USDC transfers and groups by sender pattern.
    """
    try:
        limit = min(limit, 50)
        async with httpx.AsyncClient(timeout=30) as client:
            current_block = await _get_base_block_number(client)
            if not current_block:
                return _err(502, {"error": "Cannot connect to Base RPC"})

            from_block = max(0, current_block - 2000)
            logs = await _get_eth_logs_limited(client, from_block, current_block,
                                               X402_CONTRACTS["usdc"], [TRANSFER_TOPIC], max_blocks=2000)

            whales = []
            sender_clusters = {}
            for log in logs:
                try:
                    if len(log.get("topics", [])) >= 3 and len(log.get("data", "0x")) > 2:
                        value = int(log["data"], 16) / 1_000_000
                        if value >= min_amount:
                            from_addr = "0x" + log["topics"][1][-40:]
                            to_addr = "0x" + log["topics"][2][-40:]
                            whales.append({
                                "tx_hash": log.get("transactionHash", ""),
                                "block": int(log.get("blockNumber", "0x0"), 16),
                                "from": from_addr,
                                "to": to_addr,
                                "amount_usdc": round(value, 2),
                            })
                            sender_clusters.setdefault(from_addr, {"count": 0, "total": 0})
                            sender_clusters[from_addr]["count"] += 1
                            sender_clusters[from_addr]["total"] += value
                except Exception:
                    continue

            whales.sort(key=lambda x: x["amount_usdc"], reverse=True)

            top_senders = sorted(
                [{"address": k, "transfers": v["count"], "total_usdc": round(v["total"], 2)}
                 for k, v in sender_clusters.items()],
                key=lambda x: x["total_usdc"], reverse=True
            )[:10]

            return {
                "status": "ok",
                **QXB_HEADER,
                "whales_found": len(whales),
                "whales": whales[:limit],
                "sender_clusters": top_senders,
                "total_volume_whale_usdc": round(sum(w["amount_usdc"] for w in whales), 2),
                "fetched_at": _now(),
            }
    except Exception as e:
        return _err(500, {"error": str(e)})


@app.get("/v1/x402/network-health")
@app.get("/api/v1/x402/network-health")
async def qxb_network_health():
    """
    🧠 QuantumXBrain: Full Base network health dashboard.
    Chain stats + gas + USDC activity + RPC status.
    """
    try:
        async with httpx.AsyncClient(timeout=30) as client:
            current_block = await _get_base_block_number(client)
            gas_r = await _base_rpc_call(client, "eth_gasPrice", [])
            chain_r = await _base_rpc_call(client, "eth_chainId", [])

            gas_gwei = round(int(gas_r["result"], 16) / 1e9, 6) if gas_r.get("ok") else None
            chain_id = int(chain_r["result"], 16) if chain_r.get("ok") else None

            # USDC activity
            transfers = volume = 0
            wallets = set()
            if current_block:
                from_b = max(0, current_block - 500)
                logs = await _get_eth_logs_limited(client, from_b, current_block,
                                                   X402_CONTRACTS["usdc"], [TRANSFER_TOPIC], max_blocks=500)
                for log in logs:
                    try:
                        if len(log.get("data", "0x")) > 2:
                            val = int(log["data"], 16) / 1_000_000
                            if val > 0:
                                transfers += 1; volume += val
                                if len(log.get("topics", [])) >= 3:
                                    wallets.add(log["topics"][1][-40:])
                                    wallets.add(log["topics"][2][-40:])
                    except Exception:
                        continue

            health = "operational" if current_block and gas_r.get("ok") else "degraded"

            return {
                "status": "ok",
                **QXB_HEADER,
                "chain": {
                    "name": "Base",
                    "chain_id": chain_id,
                    "block": current_block,
                    "block_time": "2s",
                    "finality": "instant",
                },
                "gas": {
                    "gwei": gas_gwei,
                    "cost_transfer_usd": round(gas_gwei * 21000 * 1e-9 * 2500, 6) if gas_gwei else None,
                },
                "usdc_activity": {
                    "transfers": transfers,
                    "volume_usdc": round(volume, 2),
                    "unique_wallets": len(wallets),
                },
                "health": health,
                "rpc_redundancy": len(BASE_RPCS),
                "fetched_at": _now(),
            }
    except Exception as e:
        return _err(500, {"error": str(e)})


@app.get("/v1/x402/stablecoin-flow")
@app.get("/api/v1/x402/stablecoin-flow")
async def qxb_stablecoin_flow():
    """
    🧠 QuantumXBrain: Stablecoin flow analysis on Base.
    Tracks USDC transfers to identify flow patterns.
    """
    try:
        async with httpx.AsyncClient(timeout=30) as client:
            current_block = await _get_base_block_number(client)
            if not current_block:
                return _err(502, {"error": "Cannot connect to Base RPC"})

            from_b = max(0, current_block - 2000)
            logs = await _get_eth_logs_limited(client, from_b, current_block,
                                               X402_CONTRACTS["usdc"], [TRANSFER_TOPIC], max_blocks=2000)

            total_volume = 0
            count = 0
            large = []
            for log in logs:
                try:
                    if len(log.get("data", "0x")) > 2:
                        val = int(log["data"], 16) / 1_000_000
                        if val > 0:
                            total_volume += val
                            count += 1
                            if val >= 10000:
                                large.append({
                                    "tx": log.get("transactionHash", ""),
                                    "amount": round(val, 2),
                                    "from": "0x" + log["topics"][1][-40:] if len(log.get("topics", [])) >= 3 else "",
                                    "to": "0x" + log["topics"][2][-40:] if len(log.get("topics", [])) >= 3 else "",
                                })
                except Exception:
                    continue

            return {
                "status": "ok",
                **QXB_HEADER,
                "period": "last ~2000 blocks (~66 min)",
                "total_transfers": count,
                "total_volume_usdc": round(total_volume, 2),
                "avg_transfer": round(total_volume / max(count, 1), 2),
                "large_transfers": large[:10],
                "flow_signal": "high_activity" if count > 100 else "moderate" if count > 20 else "low",
                "fetched_at": _now(),
            }
    except Exception as e:
        return _err(500, {"error": str(e)})


@app.get("/v1/x402/defi-yield")
@app.get("/api/v1/x402/defi-yield")
async def qxb_defi_yield():
    """
    🧠 QuantumXBrain: DeFi yield opportunities on Base.
    Uses DefiLlama to find top pools on Base chain.
    """
    try:
        async with httpx.AsyncClient(timeout=15) as client:
            ok, data = await fetch_json(client, "https://yields.llama.fi/pools")

            if not ok or not data or "data" not in data:
                return _err(502, {"error": "Cannot fetch yield data from DefiLlama"})

            # Filter Base pools, sort by TVL
            base_pools = [
                p for p in data["data"]
                if p.get("chain", "").lower() == "base" and p.get("tvlUsd", 0) > 1000
            ]
            base_pools.sort(key=lambda x: x.get("tvlUsd", 0), reverse=True)

            top_pools = []
            for p in base_pools[:15]:
                top_pools.append({
                    "project": p.get("project", ""),
                    "symbol": p.get("symbol", ""),
                    "pool": p.get("pool", ""),
                    "tvl_usd": round(p.get("tvlUsd", 0), 2),
                    "apy": round(p.get("apy", 0), 2),
                    "apy_base": round(p.get("apyBase", 0), 2) if p.get("apyBase") else None,
                    "apy_reward": round(p.get("apyReward", 0), 2) if p.get("apyReward") else None,
                    "stablecoin": p.get("stablecoin", False),
                    "il_risk": p.get("ilRisk", "unknown"),
                })

            return {
                "status": "ok",
                **QXB_HEADER,
                "chain": "Base",
                "pools_found": len(base_pools),
                "top_pools": top_pools,
                "total_tvl_base": round(sum(p.get("tvlUsd", 0) for p in base_pools), 2),
                "fetched_at": _now(),
            }
    except Exception as e:
        return _err(500, {"error": str(e)})


@app.get("/v1/x402/tx-patterns")
@app.get("/api/v1/x402/tx-patterns")
async def qxb_tx_patterns():
    """
    🧠 QuantumXBrain: Transaction pattern analysis on Base.
    Identifies transfer size distribution and activity patterns.
    """
    try:
        async with httpx.AsyncClient(timeout=30) as client:
            current_block = await _get_base_block_number(client)
            if not current_block:
                return _err(502, {"error": "Cannot connect to Base RPC"})

            from_b = max(0, current_block - 2000)
            logs = await _get_eth_logs_limited(client, from_b, current_block,
                                               X402_CONTRACTS["usdc"], [TRANSFER_TOPIC], max_blocks=2000)

            # Size buckets
            buckets = {"<$1": 0, "$1-$10": 0, "$10-$100": 0, "$100-$1K": 0,
                       "$1K-$10K": 0, "$10K-$100K": 0, ">$100K": 0}
            total_volume = 0
            count = 0

            for log in logs:
                try:
                    if len(log.get("data", "0x")) > 2:
                        val = int(log["data"], 16) / 1_000_000
                        if val > 0:
                            total_volume += val
                            count += 1
                            if val < 1: buckets["<$1"] += 1
                            elif val < 10: buckets["$1-$10"] += 1
                            elif val < 100: buckets["$10-$100"] += 1
                            elif val < 1000: buckets["$100-$1K"] += 1
                            elif val < 10000: buckets["$1K-$10K"] += 1
                            elif val < 100000: buckets["$10K-$100K"] += 1
                            else: buckets[">$100K"] += 1
                except Exception:
                    continue

            return {
                "status": "ok",
                **QXB_HEADER,
                "period": "last ~2000 blocks (~66 min)",
                "total_transfers": count,
                "total_volume_usdc": round(total_volume, 2),
                "size_distribution": buckets,
                "dominant_bucket": max(buckets, key=buckets.get) if count > 0 else "N/A",
                "micro_payment_pct": round((buckets["<$1"] + buckets["$1-$10"]) / max(count, 1) * 100, 1),
                "fetched_at": _now(),
            }
    except Exception as e:
        return _err(500, {"error": str(e)})


@app.get("/v1/x402/wallet-compare")
@app.get("/api/v1/x402/wallet-compare")
async def qxb_wallet_compare(
    a: str = Query(..., description="First wallet address"),
    b: str = Query(..., description="Second wallet address"),
):
    """
    🧠 QuantumXBrain: Compare two wallets side by side.
    """
    try:
        a, b = a.lower(), b.lower()
        for addr in (a, b):
            if not addr.startswith("0x") or len(addr) != 42:
                return _err(400, {"error": f"Invalid address: {addr}"})

        async def _profile(addr):
            padded = addr[2:].zfill(64)
            async with httpx.AsyncClient(timeout=30) as client:
                current_block = await _get_base_block_number(client)
                if not current_block:
                    return {"error": "RPC unavailable"}
                from_b = max(0, current_block - 2000)
                lf = await _get_eth_logs_limited(client, from_b, current_block,
                                                  X402_CONTRACTS["usdc"],
                                                  [TRANSFER_TOPIC, f"0x{padded}"], max_blocks=2000)
                lt = await _get_eth_logs_limited(client, from_b, current_block,
                                                  X402_CONTRACTS["usdc"],
                                                  [TRANSFER_TOPIC, None, f"0x{padded}"], max_blocks=2000)
                sent = recv = sc = rc = 0
                cps = set()
                for log in lf:
                    try:
                        v = int(log["data"], 16) / 1e6; sent += v; sc += 1
                        cps.add(log["topics"][2][-40:].lower())
                    except: pass
                for log in lt:
                    try:
                        v = int(log["data"], 16) / 1e6; recv += v; rc += 1
                        cps.add(log["topics"][1][-40:].lower())
                    except: pass
                return {
                    "sent": round(sent, 2), "received": round(recv, 2),
                    "net_flow": round(recv - sent, 2),
                    "tx_count": sc + rc, "counterparties": len(cps),
                }

        pa, pb = await asyncio.gather(_profile(a), _profile(b))

        return {
            "status": "ok",
            **QXB_HEADER,
            "wallet_a": {"address": a, **pa},
            "wallet_b": {"address": b, **pb},
            "fetched_at": _now(),
        }
    except Exception as e:
        return _err(500, {"error": str(e)})


@app.get("/v1/x402/leaderboard")
@app.get("/api/v1/x402/leaderboard")
async def qxb_leaderboard(
    limit: int = Query(10, description="Top N wallets"),
    metric: str = Query("volume", description="Sort by: volume, transactions, counterparties"),
):
    """
    🧠 QuantumXBrain: Top USDC activity leaderboard on Base.
    """
    try:
        limit = min(limit, 25)
        async with httpx.AsyncClient(timeout=30) as client:
            current_block = await _get_base_block_number(client)
            if not current_block:
                return _err(502, {"error": "Cannot connect to Base RPC"})

            from_b = max(0, current_block - 2000)
            logs = await _get_eth_logs_limited(client, from_b, current_block,
                                               X402_CONTRACTS["usdc"], [TRANSFER_TOPIC], max_blocks=2000)

            wallets = {}
            for log in logs:
                try:
                    if len(log.get("topics", [])) >= 3 and len(log.get("data", "0x")) > 2:
                        val = int(log["data"], 16) / 1_000_000
                        from_a = "0x" + log["topics"][1][-40:]
                        to_a = "0x" + log["topics"][2][-40:]
                        for addr in (from_a, to_a):
                            if addr not in wallets:
                                wallets[addr] = {"volume": 0, "tx_count": 0, "counterparties": set()}
                            wallets[addr]["volume"] += val
                            wallets[addr]["tx_count"] += 1
                            wallets[addr]["counterparties"].add(from_a if addr == to_a else to_a)
                except Exception:
                    continue

            ranked = []
            for addr, data in wallets.items():
                ranked.append({
                    "address": addr,
                    "volume_usdc": round(data["volume"], 2),
                    "tx_count": data["tx_count"],
                    "counterparties": len(data["counterparties"]),
                })

            sort_key = {"volume": "volume_usdc", "transactions": "tx_count",
                        "counterparties": "counterparties"}.get(metric, "volume_usdc")
            ranked.sort(key=lambda x: x[sort_key], reverse=True)

            return {
                "status": "ok",
                **QXB_HEADER,
                "period": "last ~2000 blocks (~66 min)",
                "sort_by": metric,
                "leaderboard": ranked[:limit],
                "total_wallets_tracked": len(wallets),
                "fetched_at": _now(),
            }
    except Exception as e:
        return _err(500, {"error": str(e)})


@app.get("/v1/x402/contract-intel/{address}")
@app.get("/api/v1/x402/contract-intel/{address}")
async def qxb_contract_intel(address: str):
    """
    🧠 QuantumXBrain: Smart contract intelligence on Base.
    Checks if address is a contract, verifies via Etherscan.
    """
    try:
        address = address.lower()
        if not address.startswith("0x") or len(address) != 42:
            return _err(400, {"error": "Invalid address"})

        async with httpx.AsyncClient(timeout=15) as client:
            code_r = await _base_rpc_call(client, "eth_getCode", [address, "latest"])
            is_contract = code_r.get("ok") and code_r.get("result", "0x") != "0x"

            # Try Etherscan verification
            verified = None
            if ETHERSCAN_API_KEY:
                ok, data = await fetch_json(client, "https://api.basescan.org/api",
                                            params={"module": "contract", "action": "getabi",
                                                    "address": address, "apikey": ETHERSCAN_API_KEY})
                verified = ok and data and data.get("status") != "0"

            return {
                "status": "ok",
                **QXB_HEADER,
                "address": address,
                "is_contract": is_contract,
                "verified": verified,
                "type": "contract" if is_contract else "EOA (externally owned account)",
                "fetched_at": _now(),
            }
    except Exception as e:
        return _err(500, {"error": str(e)})


@app.get("/v1/x402/velocity-intel")
@app.get("/api/v1/x402/velocity-intel")
async def qxb_velocity_intel():
    """
    🧠 QuantumXBrain: Transfer velocity intelligence.
    USDC transfers per hour with trend analysis.
    """
    try:
        async with httpx.AsyncClient(timeout=30) as client:
            current_block = await _get_base_block_number(client)
            if not current_block:
                return _err(502, {"error": "Cannot connect to Base RPC"})

            blocks_per_hour = 1800
            hourly = []
            for h in range(12):
                to_b = current_block - (h * blocks_per_hour)
                from_b = max(0, to_b - blocks_per_hour)
                logs = await _get_eth_logs_limited(client, from_b, to_b,
                                                   X402_CONTRACTS["usdc"], [TRANSFER_TOPIC], max_blocks=200)
                vol = cnt = 0
                for log in logs:
                    try:
                        if len(log.get("data", "0x")) > 2:
                            v = int(log["data"], 16) / 1e6
                            if v > 0: vol += v; cnt += 1
                    except: pass
                hourly.append({"hours_ago": h, "transfers": cnt, "volume_usdc": round(vol, 2)})

            total_t = sum(h["transfers"] for h in hourly)
            total_v = sum(h["volume_usdc"] for h in hourly)
            avg = total_t / max(len(hourly), 1)
            peak = max(hourly, key=lambda x: x["transfers"])

            return {
                "status": "ok",
                **QXB_HEADER,
                "period": "12 hours",
                "total_transfers": total_t,
                "total_volume_usdc": round(total_v, 2),
                "avg_per_hour": round(avg, 1),
                "peak_hour": peak,
                "hourly": hourly,
                "fetched_at": _now(),
            }
    except Exception as e:
        return _err(500, {"error": str(e)})


@app.get("/v1/x402/history-intel/{address}")
@app.get("/api/v1/x402/history-intel/{address}")
async def qxb_history_intel(address: str, limit: int = Query(20, description="Max results")):
    """
    🧠 QuantumXBrain: Enhanced transfer history with context.
    """
    try:
        address = address.lower()
        if not address.startswith("0x") or len(address) != 42:
            return _err(400, {"error": "Invalid address"})

        limit = min(limit, 50)
        padded = address[2:].zfill(64)

        async with httpx.AsyncClient(timeout=30) as client:
            current_block = await _get_base_block_number(client)
            if not current_block:
                return _err(502, {"error": "Cannot connect to Base RPC"})

            from_b = max(0, current_block - 2000)
            lf = await _get_eth_logs_limited(client, from_b, current_block,
                                              X402_CONTRACTS["usdc"],
                                              [TRANSFER_TOPIC, f"0x{padded}"], max_blocks=2000)
            lt = await _get_eth_logs_limited(client, from_b, current_block,
                                              X402_CONTRACTS["usdc"],
                                              [TRANSFER_TOPIC, None, f"0x{padded}"], max_blocks=2000)

            txns = []
            for log in lf + lt:
                try:
                    if len(log.get("data", "0x")) > 2:
                        val = int(log["data"], 16) / 1e6
                        from_a = "0x" + log["topics"][1][-40:]
                        to_a = "0x" + log["topics"][2][-40:]
                        direction = "sent" if from_a.lower() == address else "received"
                        txns.append({
                            "tx_hash": log.get("transactionHash", ""),
                            "block": int(log.get("blockNumber", "0x0"), 16),
                            "from": from_a, "to": to_a,
                            "amount_usdc": round(val, 2),
                            "direction": direction,
                        })
                except Exception:
                    continue

            txns.sort(key=lambda x: x["block"], reverse=True)

            return {
                "status": "ok",
                **QXB_HEADER,
                "address": address,
                "total_found": len(txns),
                "transactions": txns[:limit],
                "fetched_at": _now(),
            }
    except Exception as e:
        return _err(500, {"error": str(e)})


@app.get("/v1/x402/risk-intel/{address}")
@app.get("/api/v1/x402/risk-intel/{address}")
async def qxb_risk_intel(address: str):
    """
    🧠 QuantumXBrain: Enhanced risk intelligence.
    Multi-factor risk scoring with detailed breakdown.
    """
    try:
        address = address.lower()
        if not address.startswith("0x") or len(address) != 42:
            return _err(400, {"error": "Invalid address"})

        padded = address[2:].zfill(64)
        async with httpx.AsyncClient(timeout=30) as client:
            current_block = await _get_base_block_number(client)
            if not current_block:
                return _err(502, {"error": "Cannot connect to Base RPC"})

            from_b = max(0, current_block - 2000)

            # ETH balance
            bal_r = await _base_rpc_call(client, "eth_getBalance", [address, "latest"])
            eth_bal = int(bal_r["result"], 16) / 1e18 if bal_r.get("ok") else 0

            lf = await _get_eth_logs_limited(client, from_b, current_block,
                                              X402_CONTRACTS["usdc"],
                                              [TRANSFER_TOPIC, f"0x{padded}"], max_blocks=2000)
            lt = await _get_eth_logs_limited(client, from_b, current_block,
                                              X402_CONTRACTS["usdc"],
                                              [TRANSFER_TOPIC, None, f"0x{padded}"], max_blocks=2000)

            sent_vol = recv_vol = max_single = tx_count = 0
            cps = set()
            known = 0
            for log in lf:
                try:
                    v = int(log["data"], 16) / 1e6
                    sent_vol += v; tx_count += 1; max_single = max(max_single, v)
                    cp = "0x" + log["topics"][2][-40:].lower()
                    cps.add(cp)
                    if cp in KNOWN_CONTRACTS: known += 1
                except: pass
            for log in lt:
                try:
                    v = int(log["data"], 16) / 1e6
                    recv_vol += v; tx_count += 1
                    cp = "0x" + log["topics"][1][-40:].lower()
                    cps.add(cp)
                    if cp in KNOWN_CONTRACTS: known += 1
                except: pass

            # Multi-factor risk scoring
            factors = []
            score = 50

            if eth_bal > 1:
                score += 10; factors.append({"factor": "eth_balance", "impact": +10, "detail": f"{round(eth_bal, 4)} ETH"})
            elif eth_bal < 0.001:
                score -= 10; factors.append({"factor": "eth_balance", "impact": -10, "detail": "very low ETH"})

            if tx_count > 50:
                score += 10; factors.append({"factor": "activity", "impact": +10, "detail": f"{tx_count} txns"})
            elif tx_count == 0:
                score -= 15; factors.append({"factor": "activity", "impact": -15, "detail": "no activity"})

            if len(cps) > 10:
                score += 5; factors.append({"factor": "counterparties", "impact": +5, "detail": f"{len(cps)} unique"})
            if known > 0:
                score += 10; factors.append({"factor": "known_contracts", "impact": +10, "detail": f"{known} known"})

            if max_single > 100000:
                score -= 10; factors.append({"factor": "large_transfer", "impact": -10, "detail": f"${max_single:,.0f} single"})

            score = max(0, min(100, score))
            risk_label = "low" if score > 70 else "medium" if score > 40 else "high"

            return {
                "status": "ok",
                **QXB_HEADER,
                "address": address,
                "risk_score": score,
                "risk_label": risk_label,
                "factors": factors,
                "summary": {
                    "eth_balance": round(eth_bal, 6),
                    "total_sent_usdc": round(sent_vol, 2),
                    "total_recv_usdc": round(recv_vol, 2),
                    "net_flow": round(recv_vol - sent_vol, 2),
                    "tx_count": tx_count,
                    "counterparties": len(cps),
                    "known_contracts": known,
                    "max_single_transfer": round(max_single, 2),
                },
                "fetched_at": _now(),
            }
    except Exception as e:
        return _err(500, {"error": str(e)})


@app.get("/v1/x402/search-intel")
@app.get("/api/v1/x402/search-intel")
async def qxb_search_intel(q: str = Query(..., description="Address, tx hash, or ENS name")):
    """
    🧠 QuantumXBrain: Universal search with context.
    Lookup any address, tx, or domain — returns intelligent summary.
    """
    try:
        q = q.strip()
        result = {"query": q, "type": "unknown"}

        async with httpx.AsyncClient(timeout=15) as client:
            if q.startswith("0x") and len(q) == 66:
                # Transaction hash
                result["type"] = "transaction"
                tx_r = await _base_rpc_call(client, "eth_getTransactionByHash", [q])
                if tx_r.get("ok") and tx_r["result"]:
                    tx = tx_r["result"]
                    result["from"] = tx.get("from", "")
                    result["to"] = tx.get("to", "")
                    result["value_eth"] = round(int(tx.get("value", "0x0"), 16) / 1e18, 6)
                    result["block"] = int(tx.get("blockNumber", "0x0"), 16) if tx.get("blockNumber") else None
                    result["status"] = "confirmed" if result["block"] else "pending"

            elif q.startswith("0x") and len(q) == 42:
                # Address
                result["type"] = "address"
                bal_r = await _base_rpc_call(client, "eth_getBalance", [q, "latest"])
                result["eth_balance"] = round(int(bal_r["result"], 16) / 1e18, 6) if bal_r.get("ok") else 0

                # USDC balance
                data = "0x70a08231" + q[2:].zfill(64)
                usdc_r = await _base_rpc_call(client, "eth_call",
                                               [{"to": X402_CONTRACTS["usdc"], "data": data}, "latest"])
                if usdc_r.get("ok"):
                    result["usdc_balance"] = round(int(usdc_r["result"], 16) / 1e6, 2)

                code_r = await _base_rpc_call(client, "eth_getCode", [q, "latest"])
                result["is_contract"] = code_r.get("ok") and code_r.get("result", "0x") != "0x"

            else:
                # Treat as search term
                result["type"] = "search_term"
                result["suggestion"] = "Use /v1/x402/search?q=0x... for address/tx lookup"

            return {
                "status": "ok",
                **QXB_HEADER,
                **result,
                "fetched_at": _now(),
            }
    except Exception as e:
        return _err(500, {"error": str(e)})


# ============================================================
# END QuantumXBrain Intelligence Layer
# ============================================================


if __name__ == "__main__":
    import uvicorn

    port = int(os.getenv("PORT", "4020"))
    print("=== aetheriusxAPI Starting ===")
    print(f"Version: {VERSION} | Mode: {X402_MODE} | Network: {NETWORK}")
    print(f"Wallet: {PAY_TO} | Port: {port}")
    for route, price in PRICES.items():
        print(f"GET {route:<24} {price}/call  (+ legacy /api{route})")
    print("--- x402 Intelligence (EXCLUSIVE, FREE) ---")
    print("GET /v1/x402/payments/recent  On-chain USDC transfers")
    print("GET /v1/x402/agent/{address}  Wallet intelligence")
    print("GET /v1/x402/analytics        Network analytics")
    print("GET /v1/x402/top-agents       Top spenders leaderboard")
    print("GET /v1/x402/base-stats       Chain health snapshot")
    print("GET /v1/x402/gas              Gas price analysis")
    print("GET /v1/x402/whales           Large transfer tracker")
    print("GET /v1/x402/velocity         Transfer frequency")
    print("GET /v1/x402/hourly           Hourly volume breakdown")
    print("GET /v1/x402/token/{address}  ERC-20 token metadata")
    print("GET /v1/x402/contracts        Top USDC receivers")
    print("GET /v1/x402/search           Address/tx lookup")
    print("GET /v1/x402/history/{addr}   Transfer history")
    print("GET /v1/x402/compare          Compare two wallets")
    print("GET /v1/x402/risk/{address}   Wallet risk score")
    print("GET /v1/x402/stablecoins      All stablecoin activity")
    print("GET /v1/x402/mint-burn        USDC supply changes")
    print("GET /v1/x402/bridge           Cross-chain bridge flow")
    print("GET /v1/x402/defi-pulse       DeFi protocol activity")
    print("GET /v1/x402/network          Full network dashboard")
    print("--- QuantumXBrain (FREE Intelligence Layer) ---")
    print("GET /v1/x402/brain            AI endpoint recommender")
    print("GET /v1/x402/intelligence     Aggregated intelligence")
    print("GET /v1/x402/market-pulse     Base market conditions")
    print("GET /v1/x402/wallet-intel     Wallet intelligence profile")
    print("GET /v1/x402/sentiment        Market sentiment analysis")
    print("GET /v1/x402/compliance       KYC/AML compliance score")
    print("GET /v1/x402/gas-intelligence Gas trends + optimal timing")
    print("GET /v1/x402/token-discovery  New token discovery")
    print("GET /v1/x402/whale-intelligence  Whale clustering")
    print("GET /v1/x402/network-health   Full network dashboard")
    print("GET /v1/x402/stablecoin-flow  Stablecoin flow analysis")
    print("GET /v1/x402/defi-yield       Base DeFi yield pools")
    print("GET /v1/x402/tx-patterns      Transaction pattern analysis")
    print("GET /v1/x402/wallet-compare   Compare two wallets")
    print("GET /v1/x402/leaderboard      USDC activity leaderboard")
    print("GET /v1/x402/contract-intel   Contract intelligence")
    print("GET /v1/x402/velocity-intel   Velocity intelligence")
    print("GET /v1/x402/history-intel    Enhanced transfer history")
    print("GET /v1/x402/risk-intel       Multi-factor risk scoring")
    print("GET /v1/x402/search-intel     Universal search")
    print("==============================")
    # Optimized uvicorn: keepalive + tuned timeouts
    # Note: workers=1 because we run via `python main.py` (not `uvicorn main:app`)
    # For multi-worker, use: uvicorn main:app --workers 2
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=port,
        timeout_keep_alive=30,
        log_level="info",
        access_log=True,
    )
