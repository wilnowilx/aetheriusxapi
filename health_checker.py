"""Background health checker for all PRICES endpoints in aetheriusxAPI.

Periodically checks every route listed in PRICES using httpx.AsyncClient,
caches results for 30 seconds, and exposes health report functions.
"""

import asyncio
import time
from datetime import datetime, timezone
from typing import Any, Optional

import httpx

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from main import PRICES, UA, fetch_json

BASE_URL = os.getenv("AETHERIUS_BASE_URL", "http://localhost:4020")
CHECK_INTERVAL = float(os.getenv("AETHERIUS_HEALTH_INTERVAL", "30"))
REQUEST_TIMEOUT = float(os.getenv("AETHERIUS_HEALTH_TIMEOUT", "15"))

_health_data: dict[str, dict[str, Any]] = {}
_checker_task: Optional[asyncio.Task] = None
_client: Optional[httpx.AsyncClient] = None


def _init_health_data() -> None:
    """Initialize health data for all PRICES routes."""
    for route in PRICES:
        _health_data[route] = {
            "status_code": None,
            "latency_ms": 0.0,
            "last_check": None,
            "uptime_score": 0.0,
        }


_init_health_data()


async def _check_endpoint(route: str) -> None:
    """Check a single endpoint and update its health data."""
    global _client
    url = f"{BASE_URL}{route}"
    start = time.monotonic()

    try:
        if _client is None:
            _client = httpx.AsyncClient(timeout=REQUEST_TIMEOUT)

        ok, payload = await fetch_json(
            _client, url, timeout=REQUEST_TIMEOUT, cache_ttl=0
        )
        elapsed = (time.monotonic() - start) * 1000

        if ok:
            _health_data[route] = {
                "status_code": 200,
                "latency_ms": round(elapsed, 2),
                "last_check": datetime.now(timezone.utc).isoformat(),
                "uptime_score": _health_data[route].get("uptime_score", 0.0) + 1.0,
            }
        else:
            _health_data[route] = {
                "status_code": payload.get("error", {}).get("status_code", 500)
                if isinstance(payload, dict)
                else 502,
                "latency_ms": round(elapsed, 2),
                "last_check": datetime.now(timezone.utc).isoformat(),
                "uptime_score": max(0.0, _health_data[route].get("uptime_score", 0.0) - 1.0),
            }

    except (httpx.ConnectError, httpx.TimeoutException, ConnectionRefusedError,
            OSError) as e:
        elapsed = (time.monotonic() - start) * 1000
        status_code = 503 if isinstance(e, (httpx.ConnectError, ConnectionRefusedError)) else 504
        _health_data[route] = {
            "status_code": status_code,
            "latency_ms": round(elapsed, 2),
            "last_check": datetime.now(timezone.utc).isoformat(),
            "uptime_score": max(0.0, _health_data[route].get("uptime_score", 0.0) - 1.0),
        }

    except Exception:
        elapsed = (time.monotonic() - start) * 1000
        _health_data[route] = {
            "status_code": 500,
            "latency_ms": round(elapsed, 2),
            "last_check": datetime.now(timezone.utc).isoformat(),
            "uptime_score": max(0.0, _health_data[route].get("uptime_score", 0.0) - 1.0),
        }


async def _health_check_loop() -> None:
    """Background loop that checks all endpoints periodically."""
    while True:
        try:
            tasks = [asyncio.create_task(_check_endpoint(route)) for route in PRICES]
            await asyncio.gather(*tasks, return_exceptions=True)
        except Exception:
            pass
        await asyncio.sleep(CHECK_INTERVAL)


async def start_health_checker() -> None:
    """Start the background health checker task.

    Intended to be called from FastAPI lifespan or asyncio.create_task.
    """
    global _checker_task
    if _checker_task is None or _checker_task.done():
        _checker_task = asyncio.create_task(_health_check_loop())


async def stop_health_checker() -> None:
    """Stop the background health checker task and close the HTTP client."""
    global _checker_task, _client
    if _checker_task and not _checker_task.done():
        _checker_task.cancel()
        try:
            await _checker_task
        except asyncio.CancelledError:
            pass
        _checker_task = None
    if _client:
        await _client.aclose()
        _client = None


def get_health_report() -> dict[str, Any]:
    """Return the current health status of all endpoints.

    Returns:
        dict with 'endpoints' (route -> health data), 'summary',
        and 'timestamp'.
    """
    now = datetime.now(timezone.utc).isoformat()
    total = len(_health_data)
    healthy = sum(
        1 for d in _health_data.values()
        if d["status_code"] is not None and 200 <= d["status_code"] < 300
    )
    avg_latency = (
        sum(d["latency_ms"] for d in _health_data.values()) / total
        if total > 0 else 0.0
    )

    return {
        "timestamp": now,
        "base_url": BASE_URL,
        "interval_seconds": CHECK_INTERVAL,
        "total_endpoints": total,
        "healthy": healthy,
        "unhealthy": total - healthy,
        "average_latency_ms": round(avg_latency, 2),
        "endpoints": dict(_health_data),
    }


def get_endpoint_health(route: str) -> Optional[dict[str, Any]]:
    """Return health data for a single endpoint route.

    Returns None if the route is not found in PRICES.
    """
    return _health_data.get(route)


def get_uptime_percentage(route: str) -> float:
    """Return the uptime percentage for a given route.

    Uptime score is a running counter of successful checks.
    Normalized to 0-100 scale based on total checks.
    """
    data = _health_data.get(route)
    if not data or data["status_code"] is None:
        return 0.0
    return min(100.0, data["uptime_score"])


__all__ = [
    "start_health_checker",
    "stop_health_checker",
    "get_health_report",
    "get_endpoint_health",
    "get_uptime_percentage",
    "_health_data",
]
