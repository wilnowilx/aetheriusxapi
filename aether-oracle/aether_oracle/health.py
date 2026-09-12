from __future__ import annotations

import time
from typing import Any, Dict, List, Optional

import httpx


class HealthChecker:
    """Standalone health checker for x402 endpoints.

    Checks if endpoints are alive and tracks latency/uptime over time.
    """

    def __init__(self, timeout: float = 5.0):
        self.timeout = timeout
        self._latency_data: Dict[str, List[float]] = {}
        self._uptime_data: Dict[str, Dict[str, int]] = {}

    async def check_all(self, endpoints: List[str]) -> List[dict]:
        """Check all endpoints and return health results."""
        results = []
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            for endpoint in endpoints:
                try:
                    start = time.monotonic()
                    response = await client.get(endpoint)
                    elapsed = time.monotonic() - start
                    self._record_latency(endpoint, elapsed)
                    self._record_uptime(endpoint, True)
                    results.append({
                        "endpoint": endpoint,
                        "status": "healthy",
                        "status_code": response.status_code,
                        "latency": round(elapsed, 4),
                    })
                except Exception:
                    self._record_uptime(endpoint, False)
                    results.append({
                        "endpoint": endpoint,
                        "status": "unhealthy",
                        "status_code": None,
                        "latency": None,
                    })
        return results

    async def get_uptime(self, route: str) -> float:
        """Get uptime percentage for a route."""
        data = self._uptime_data.get(route)
        if not data or (data["total"] == 0):
            return 0.0
        return round(data["healthy"] / data["total"] * 100, 2)

    async def get_latency_p95(self, route: str) -> Optional[float]:
        """Get p95 latency for a route."""
        data = self._latency_data.get(route, [])
        if not data:
            return None
        sorted_data = sorted(data)
        index = int(len(sorted_data) * 0.95)
        return round(sorted_data[min(index, len(sorted_data) - 1)], 4)

    def _record_latency(self, route: str, latency: float):
        if route not in self._latency_data:
            self._latency_data[route] = []
        self._latency_data[route].append(latency)
        if len(self._latency_data[route]) > 1000:
            self._latency_data[route] = self._latency_data[route][-500:]

    def _record_uptime(self, route: str, healthy: bool):
        if route not in self._uptime_data:
            self._uptime_data[route] = {"healthy": 0, "total": 0}
        self._uptime_data[route]["total"] += 1
        if healthy:
            self._uptime_data[route]["healthy"] += 1
