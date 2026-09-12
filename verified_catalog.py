"""Real-time endpoint health verification and verified catalog.

Provides:
- _endpoint_health: global dict tracking health of each route
- verify_all_endpoints(): probes all PRICES routes and updates health
- get_verified_catalog(): returns only verified routes sorted by uptime
- get_system_health(): aggregate system health metrics
"""

import asyncio
import os
import time
import httpx

_prices: dict[str, str] = {}
_base_url: str = os.getenv("AETHERIUS_BASE_URL", "http://localhost:8000")

_endpoint_health: dict[str, dict] = {}

_uptime_history: dict[str, list[float]] = {}


def set_base_url(url: str) -> None:
    """Override the base URL used for health verification probes."""
    global _base_url
    _base_url = url.rstrip("/")


def set_prices(prices: dict[str, str]) -> None:
    """Set the routes/prices map (called by main.py on startup)."""
    global _prices
    _prices = prices
    for route in _prices:
        if route not in _endpoint_health:
            _endpoint_health[route] = {
                "route": route,
                "status_code": 0,
                "latency_ms": 0.0,
                "last_check": 0.0,
                "uptime_score": 0.0,
                "verified": False,
            }
            _uptime_history[route] = []


def _route_category(route: str) -> str:
    """Classify a route into a category."""
    parts = route.strip("/").split("/")
    if len(parts) >= 2:
        return parts[1]
    return "general"


async def verify_all_endpoints() -> list[str]:
    """Probe all PRICES routes concurrently with a semaphore, record health.
    Uses short timeouts to avoid blocking the event loop.
    Skips self-probing if _base_url points to localhost (prevents event loop deadlock).
    Set AETHERIUS_BASE_URL to an external URL to enable self-verification."""
    # Don't self-probe: if the oracle runs in the same process, skip HTTP verification
    # to avoid saturating the event loop. Use set_base_url() with an external URL to enable.
    if _base_url.startswith("http://localhost") or _base_url.startswith("http://127.0.0.1"):
        for route in _prices:
            if route not in _endpoint_health:
                _endpoint_health[route] = {
                    "route": route,
                    "status_code": 0,
                    "latency_ms": 0.0,
                    "last_check": 0.0,
                    "uptime_score": 0.0,
                    "verified": False,
                }
                _uptime_history.setdefault(route, [])
        return []

    verified: list[str] = []
    timeout = httpx.Timeout(3.0)
    sem = asyncio.Semaphore(10)  # max 10 concurrent probes

    async def _probe(client: httpx.AsyncClient, route: str):
        async with sem:
            url = f"{_base_url}{route}"
            t0 = time.perf_counter()
            try:
                r = await client.get(url)
                elapsed = (time.perf_counter() - t0) * 1000
                status_code = r.status_code
                _endpoint_health[route] = {
                    "route": route,
                    "status_code": status_code,
                    "latency_ms": round(elapsed, 2),
                    "last_check": time.time(),
                    "uptime_score": _compute_uptime_score(route, status_code == 200),
                    "verified": status_code == 200,
                }
                _uptime_history.setdefault(route, []).append(
                    1.0 if status_code == 200 else 0.0
                )
                if len(_uptime_history[route]) > 100:
                    _uptime_history[route] = _uptime_history[route][-100:]
                return route if status_code == 200 else None
            except Exception:
                elapsed = (time.perf_counter() - t0) * 1000
                _endpoint_health[route] = {
                    "route": route,
                    "status_code": 0,
                    "latency_ms": round(elapsed, 2),
                    "last_check": time.time(),
                    "uptime_score": _compute_uptime_score(route, False),
                    "verified": False,
                }
                _uptime_history.setdefault(route, []).append(0.0)
                if len(_uptime_history[route]) > 100:
                    _uptime_history[route] = _uptime_history[route][-100:]
                return None

    async with httpx.AsyncClient(timeout=timeout) as client:
        tasks = [_probe(client, route) for route in _prices]
        results = await asyncio.gather(*tasks, return_exceptions=True)
        for r in results:
            if isinstance(r, str):
                verified.append(r)

    return verified


def _compute_uptime_score(route: str, success: bool) -> float:
    """Compute uptime score (0-1) based on recent history."""
    history = _uptime_history.get(route, [])
    if not history:
        return 0.0
    return sum(history) / len(history)


def get_verified_catalog() -> list[dict]:
    """Return list of dicts: {route, price, category, status, uptime_score, latency_ms}
    Only includes routes where verified=True, sorted by uptime_score descending."""
    result: list[dict] = []
    for route, health in _endpoint_health.items():
        if health["verified"]:
            result.append({
                "route": route,
                "price": _prices.get(route, "$0"),
                "category": _route_category(route),
                "status": "verified",
                "uptime_score": health["uptime_score"],
                "latency_ms": health["latency_ms"],
            })
    result.sort(key=lambda x: x["uptime_score"], reverse=True)
    return result


def get_system_health() -> dict:
    """Return: {total_endpoints, verified_count, circuit_breaker_state,
    avg_latency, uptime_percentage}."""
    total = len(_prices)
    verified_count = sum(1 for h in _endpoint_health.values() if h["verified"])
    latencies = [h["latency_ms"] for h in _endpoint_health.values() if h["latency_ms"] > 0]
    avg_latency = round(sum(latencies) / len(latencies), 2) if latencies else 0.0
    uptime_scores = [h["uptime_score"] for h in _endpoint_health.values()]
    uptime_percentage = round(sum(uptime_scores) / len(uptime_scores), 4) if uptime_scores else 0.0

    try:
        from x402_middleware import _circuit_breaker
        cb_state = _circuit_breaker.state
    except Exception:
        cb_state = "unknown"

    return {
        "total_endpoints": total,
        "verified_count": verified_count,
        "circuit_breaker_state": cb_state,
        "avg_latency": avg_latency,
        "uptime_percentage": uptime_percentage,
    }


class VerifiedCatalog:
    """Wrapper providing access to all catalog and health functions."""

    @staticmethod
    async def verify_all_endpoints() -> list[str]:
        return await verify_all_endpoints()

    @staticmethod
    def get_verified_catalog() -> list[dict]:
        return get_verified_catalog()

    @staticmethod
    def get_system_health() -> dict:
        return get_system_health()

    @staticmethod
    def set_prices(prices: dict[str, str]) -> None:
        set_prices(prices)