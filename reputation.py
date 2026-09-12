"""Reputation scoring system for aetheriusxAPI endpoints.

Tracks per-endpoint metrics (call success, latency, settlement outcomes)
and computes a weighted reputation score used to identify reliable
endpoints for agent clients.

Now integrates with AgentCreditVelocity to penalize endpoints that
serve high-risk agents (settlement window abuse risk).
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
            # Agent risk tracking
            "high_risk_agents": 0,      # calls from agents with risk > 50
            "blocked_agents": 0,         # calls from blocked agents
            "total_agent_risk": 0.0,     # cumulative risk scores
            "agent_risk_samples": 0,     # number of risk-scored calls
        }
    return _endpoint_metrics[route]


def record_call(route: str, success: bool, latency_ms: float,
                 agent_risk: float | None = None) -> None:
    """Record a call event for the given route.

    Args:
        route: The canonical endpoint route (e.g. "/v1/crypto/dominance").
        success: Whether the call succeeded (2xx response).
        latency_ms: Response latency in milliseconds.
        agent_risk: Optional risk score (0-100) of the calling agent.
                    If provided, endpoint risk profile is updated.
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

    # Track agent risk exposure
    if agent_risk is not None:
        m["total_agent_risk"] += agent_risk
        m["agent_risk_samples"] += 1
        if agent_risk >= 70:
            m["high_risk_agents"] += 1
        if agent_risk >= 90:
            m["blocked_agents"] += 1


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
        latency_score, agent_trust_score, total_score, verified,
        sample_size, high_risk_pct, blocked_pct.
    """
    m = _endpoint_metrics.get(route)
    if m is None:
        return {
            "route": route,
            "uptime_score": 0.0,
            "settlement_score": 0.0,
            "latency_score": 0.0,
            "agent_trust_score": 0.0,
            "total_score": 0.0,
            "verified": False,
            "sample_size": 0,
            "high_risk_pct": 0.0,
            "blocked_pct": 0.0,
        }

    total_calls = m["total_calls"]
    successful_calls = m["successful_calls"]
    total_success_settlements = m["settlement_success"] + m["settlement_failures"]

    uptime_score = successful_calls / max(total_calls, 1)
    settlement_score = m["settlement_success"] / max(total_success_settlements, 1)

    avg_latency = m["total_latency_ms"] / max(total_calls, 1)
    latency_score = max(0.0, 1.0 - avg_latency / 1000.0)

    # Agent trust: endpoints serving mostly risky agents get penalized.
    # If no risk data available, default to 1.0 (neutral).
    if m["agent_risk_samples"] > 0:
        avg_agent_risk = m["total_agent_risk"] / m["agent_risk_samples"]
        # Invert: low risk → high trust score
        agent_trust_score = max(0.0, 1.0 - avg_agent_risk / 100.0)
    else:
        agent_trust_score = 1.0

    high_risk_pct = m["high_risk_agents"] / max(total_calls, 1)
    blocked_pct = m["blocked_agents"] / max(total_calls, 1)

    # Weighted total: uptime 30%, settlement 30%, latency 15%, agent trust 25%
    total_score = (
        uptime_score * 0.30
        + settlement_score * 0.30
        + latency_score * 0.15
        + agent_trust_score * 0.25
    )

    # Hard penalty: if >5% calls from blocked agents, cap score at 0.3
    if blocked_pct > 0.05:
        total_score = min(total_score, 0.3)

    return {
        "route": route,
        "uptime_score": round(uptime_score, 4),
        "settlement_score": round(settlement_score, 4),
        "latency_score": round(latency_score, 4),
        "agent_trust_score": round(agent_trust_score, 4),
        "total_score": round(total_score, 4),
        "verified": total_score >= 0.8,
        "sample_size": total_calls,
        "high_risk_pct": round(high_risk_pct, 4),
        "blocked_pct": round(blocked_pct, 4),
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
