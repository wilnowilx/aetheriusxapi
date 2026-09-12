from __future__ import annotations

from typing import Any, Dict, List, Optional

import httpx


class VerifiedCatalog:
    """Client for querying the AETHERIUS oracle catalog.

    Connects to an AETHERIUS oracle instance to discover verified x402
    endpoints, check system health, and query reputation data.

    Usage:
        async with VerifiedCatalog(base_url="https://oracle.aetheriusxapi.com") as catalog:
            endpoints = await catalog.discover()
            status = await catalog.get_status()
    """

    def __init__(
        self,
        base_url: str = "https://oracle.aetheriusxapi.com",
        api_key: Optional[str] = None,
    ):
        self.base_url = base_url.rstrip("/")
        self.api_key = api_key
        self._client: Optional[httpx.AsyncClient] = None

    def _get_client(self) -> httpx.AsyncClient:
        if self._client is None or self._client.is_closed:
            headers = {"User-Agent": "aether-oracle/0.1.0"}
            if self.api_key:
                headers["Authorization"] = f"Bearer {self.api_key}"
            self._client = httpx.AsyncClient(
                base_url=self.base_url,
                headers=headers,
                timeout=30.0,
            )
        return self._client

    async def discover(self) -> List[dict]:
        """Discover all verified x402 endpoints.

        Returns list of dicts with keys: route, price, category,
        status, uptime_score, latency_ms.
        """
        client = self._get_client()
        response = await client.get("/v1/oracle/verified")
        response.raise_for_status()
        data = response.json()
        return data.get("verified_endpoints", [])

    async def get_status(self) -> dict:
        """Get oracle system status.

        Returns dict with: service, oracle, status, circuit_breaker,
        anti_replay, collect_first_enabled, system_health, timestamp.
        """
        client = self._get_client()
        response = await client.get("/v1/oracle/status")
        response.raise_for_status()
        return response.json()

    async def get_health(self) -> dict:
        """Get system health summary.

        Returns dict with: total_endpoints, verified_count,
        circuit_breaker_state, avg_latency, uptime_percentage.
        """
        status = await self.get_status()
        return status.get("system_health", {})

    async def close(self):
        """Close the underlying HTTP client."""
        if self._client and not self._client.is_closed:
            await self._client.aclose()

    async def __aenter__(self):
        return self

    async def __aexit__(self, *args):
        await self.close()
