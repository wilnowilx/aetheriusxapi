"""Local MVP API with deterministic data and simulated x402 payments."""

from datetime import UTC, datetime
import re
from typing import Any
from urllib.parse import urlparse

from fastapi import FastAPI, HTTPException, Query
from fastapi.staticfiles import StaticFiles
from starlette.responses import FileResponse, RedirectResponse

from x402_middleware import SimulatedX402Middleware

app = FastAPI(
    title="AetheriusX API",
    description="Local MVP with simulated USDC payments on Base.",
    version="0.1.0",
)

PRICES = {
    "GET /v1/maps/search": "0.01",
    "GET /v1/maps/reviews": "0.02",
    "GET /v1/maps/nearby": "0.015",
    "GET /v1/token/analyze": "0.02",
    "GET /v1/token/holders": "0.03",
    "GET /v1/token/price": "0.005",
    "GET /v1/web/scrape": "0.01",
    "GET /v1/web/screenshot": "0.025",
    "GET /v1/email/validate": "0.005",
    "GET /v1/data/weather": "0.008",
}
app.add_middleware(SimulatedX402Middleware, routes=PRICES)
app.mount("/dashboard", StaticFiles(directory="dashboard", html=True), name="dashboard")


@app.get("/", include_in_schema=False)
def root() -> RedirectResponse:
    return RedirectResponse(url="/dashboard/", status_code=307)


@app.get("/landing", include_in_schema=False)
def landing() -> FileResponse:
    return FileResponse("index.html", media_type="text/html")


def _require_url(value: str) -> str:
    parsed = urlparse(value)
    if parsed.scheme not in {"http", "https"} or not parsed.netloc:
        raise HTTPException(status_code=400, detail="url must be a valid HTTP or HTTPS URL")
    return value


def _require_contract(address: str) -> str:
    if not re.fullmatch(r"0x[a-fA-F0-9]{40}", address):
        raise HTTPException(status_code=400, detail="address must be a valid EVM contract address")
    return address


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "mode": "simulated"}


@app.get("/v1/maps/search")
def maps_search(q: str = Query(min_length=1), location: str = "Mexico") -> dict[str, Any]:
    normalized_location = location.strip() or "Mexico"
    return {
        "query": q,
        "location": normalized_location,
        "count": 2,
        "results": [
            {
                "name": f"Cafeteria Central {normalized_location}",
                "address": f"Av. Reforma 123, {normalized_location}",
                "phone": "+52 55 5555 0142",
                "website": "https://example.com/cafeteria-central",
                "lat": 19.432608,
                "lon": -99.133209,
            },
            {
                "name": f"Mercado de {q.title()}",
                "address": f"Calle Juarez 45, {normalized_location}",
                "phone": "+52 55 5555 0187",
                "website": "https://example.com/mercado",
                "lat": 19.427025,
                "lon": -99.127571,
            },
        ],
    }


@app.get("/v1/maps/reviews")
def maps_reviews(place_name: str = Query(min_length=1)) -> dict[str, Any]:
    return {
        "query": place_name,
        "count": 1,
        "results": [
            {
                "name": f"{place_name}, Mexico City, CDMX, Mexico",
                "lat": "19.432608",
                "lon": "-99.133209",
                "type": "place",
                "importance": 0.82,
            }
        ],
    }


@app.get("/v1/maps/nearby")
def maps_nearby(
    lat: float = Query(ge=-90, le=90),
    lon: float = Query(ge=-180, le=180),
    radius: int = Query(1000, ge=1, le=50000),
    category: str | None = None,
) -> dict[str, Any]:
    return {
        "center": {"lat": lat, "lon": lon},
        "radius": radius,
        "category": category or "all",
        "count": 2,
        "results": [
            {"name": "Plaza de la Constitucion", "category": "square", "distance_m": 240, "lat": lat + 0.0011, "lon": lon - 0.0008},
            {"name": "Biblioteca Publica Central", "category": "library", "distance_m": 680, "lat": lat - 0.0024, "lon": lon + 0.0017},
        ],
    }


@app.get("/v1/token/analyze")
def token_analyze(address: str, chain: str = "ethereum") -> dict[str, Any]:
    contract = _require_contract(address)
    return {
        "address": contract,
        "chain": chain,
        "analyzed_at": datetime.now(UTC).isoformat().replace("+00:00", "Z"),
        "checks": {"verified": True, "has_abi": True, "mintable": False, "honeypot": False},
        "risk_score": 18,
        "risk_level": "low",
    }


@app.get("/v1/token/holders")
def token_holders(address: str, chain: str = "ethereum") -> dict[str, Any]:
    contract = _require_contract(address)
    return {
        "address": contract,
        "chain": chain,
        "holder_count": 18420,
        "top_holders": [
            {"rank": 1, "address": "0x1111111111111111111111111111111111111111", "balance": "1850000", "share_percent": 18.5},
            {"rank": 2, "address": "0x2222222222222222222222222222222222222222", "balance": "920000", "share_percent": 9.2},
            {"rank": 3, "address": "0x3333333333333333333333333333333333333333", "balance": "610000", "share_percent": 6.1},
        ],
    }


@app.get("/v1/token/price")
def token_price(address: str, chain: str = "ethereum") -> dict[str, Any]:
    contract = _require_contract(address)
    return {"address": contract, "chain": chain, "symbol": "AETH", "price_usd": 2.3845, "change_24h": 2.3, "volume_24h_usd": 1842500.0}


@app.get("/v1/web/scrape")
def web_scrape(url: str) -> dict[str, Any]:
    target = _require_url(url)
    return {
        "url": target,
        "status": 200,
        "title": "Example Domain",
        "text_preview": "This domain is for use in illustrative examples in documents.",
        "links_count": 1,
        "links": ["https://www.iana.org/domains/example"],
        "content_length": 1256,
    }


@app.get("/v1/web/screenshot")
def web_screenshot(
    url: str,
    width: int = Query(1280, ge=320, le=3840),
    height: int = Query(720, ge=240, le=2160),
) -> dict[str, Any]:
    target = _require_url(url)
    return {"url": target, "status": 200, "width": width, "height": height, "format": "png", "content_type": "image/png", "available": False}


@app.get("/v1/email/validate")
def email_validate(email: str) -> dict[str, Any]:
    valid_syntax = bool(re.fullmatch(r"[^@\s]+@[^@\s]+\.[^@\s]+", email))
    domain = email.rsplit("@", 1)[-1].lower() if "@" in email else ""
    disposable_domains = {"mailinator.com", "10minutemail.com", "tempmail.com"}
    is_disposable = domain in disposable_domains
    has_mx = valid_syntax and domain not in {"invalid", "localhost"}
    risk_score = 70 if is_disposable else (10 if valid_syntax and has_mx else 90)
    verdict = "disposable" if is_disposable else ("valid" if valid_syntax and has_mx else "invalid")
    return {"email": email, "valid_syntax": valid_syntax, "has_mx": has_mx, "is_disposable": is_disposable, "risk_score": risk_score, "verdict": verdict}


@app.get("/v1/data/weather")
def weather(lat: float = Query(ge=-90, le=90), lon: float = Query(ge=-180, le=180)) -> dict[str, Any]:
    return {
        "location": {"lat": lat, "lon": lon},
        "timezone": "America/Mexico_City",
        "current": {"temperature_c": 22.4, "feels_like_c": 22.0, "condition": "partly_cloudy", "humidity_percent": 48, "wind_kph": 12.6},
        "forecast": [
            {"date": "2026-09-03", "high_c": 24.1, "low_c": 14.8, "precipitation_probability": 20},
            {"date": "2026-09-04", "high_c": 23.7, "low_c": 15.2, "precipitation_probability": 35},
        ],
    }
