"""Reputation scoring system for aetheriusxAPI endpoints.

Tracks per-endpoint metrics (call success, latency, settlement outcomes)
and computes a weighted reputation score used to identify reliable
endpoints for agent clients.
"""

import time
from collections import deque

_endpoint_metrics: dict[str, dict] = {}


def _get_metrics(route: str) -> dict:
    """Lazily initialise and return the metrics dict for a route."""
    global _endpoint_metrics
    if route not in _endpoint_metrics:
        _endpoint_metrics[route] = {
            "total_calls": 0,
            "successful_calls": 0,
            "total_latency_ms": 0.0,
            "errors": 0,
            "last_hour_calls": deque(maxlen=60),
            "settlement_success": 0,
            "settlement_failures": 0,
        }
    return _endpoint_metrics[route]


def record_call(route: str, success: bool, latency_ms: float) -> None:
    """Record a call event for the given route.

    Args:
        route: The canonical endpoint route (e.g. "/v1/crypto/dominance").
        success: Whether the call succeeded (2xx response).
        latency_ms: Response latency in milliseconds.
    """
    m = _get_metrics(route)
    m["total_calls"] += 1
    if success:
        m["successful_calls"] += 1
    else:
        m["errors"] += 1
    m["total_latency_ms"] += latency_ms
    now = time.monotonic()
    m["last_hour_calls"].append(now)


def record_settlement(route: str, success: bool) -> None:
    """Record a settlement event for the given route.

    Args:
        route: The canonical endpoint route.
        success: Whether settlement succeeded.
    """
    m = _get_metrics(route)
    if success:
        m["settlement_success"] += 1
    else:
        m["settlement_failures"] += 1


def get_reputation(route: str) -> dict:
    """Compute and return the reputation score for a route.

    Returns:
        dict with keys: route, uptime_score, settlement_score,
        latency_score, total_score, verified, sample_size.
    """
    m = _endpoint_metrics.get(route)
    if m is None:
        return {
            "route": route,
            "uptime_score": 0.0,
            "settlement_score": 0.0,
            "latency_score": 0.0,
            "total_score": 0.0,
            "verified": False,
            "sample_size": 0,
        }

    total_calls = m["total_calls"]
    successful_calls = m["successful_calls"]
    total_success_settlements = m["settlement_success"] + m["settlement_failures"]

    uptime_score = successful_calls / max(total_calls, 1)
    settlement_score = m["settlement_success"] / max(total_success_settlements, 1)

    avg_latency = m["total_latency_ms"] / max(total_calls, 1)
    latency_score = max(0.0, 1.0 - avg_latency / 1000.0)

    total_score = uptime_score * 0.4 + settlement_score * 0.4 + latency_score * 0.2

    return {
        "route": route,
        "uptime_score": round(uptime_score, 4),
        "settlement_score": round(settlement_score, 4),
        "latency_score": round(latency_score, 4),
        "total_score": round(total_score, 4),
        "verified": total_score >= 0.8,
        "sample_size": total_calls,
    }


def get_top_verified(n: int = 20) -> list[dict]:
    """Return the top verified endpoints sorted by total_score descending.

    Args:
        n: Maximum number of endpoints to return.
    """
    verified = [
        get_reputation(route)
        for route in _endpoint_metrics
        if get_reputation(route)["verified"]
    ]
    verified.sort(key=lambda x: x["total_score"], reverse=True)
    return verified[:n]


def get_verified_endpoints() -> list[dict]:
    """Return all verified endpoints sorted by total_score descending."""
    return get_top_verified(n=len(_endpoint_metrics))


def reset_metrics() -> None:
    """Clear all endpoint metrics. Primarily for testing."""
    global _endpoint_metrics
    _endpoint_metrics = {}
