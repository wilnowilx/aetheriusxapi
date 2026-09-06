"""AetheriusX Python SDK — the official client for 80 APIs on Base Mainnet.

Quick start:
    from aetheriusx import AetheriusXClient

    client = AetheriusXClient()  # connects to mainnet by default

    # Free endpoints — no payment needed
    gas = client.x402.gas()
    whales = client.x402.whales()

    # Paid endpoints — auto-handles 402 challenge
    weather = client.data.weather(lat=10.5, lon=-66.9)
    price = client.token.price(token="bitcoin")
"""

from __future__ import annotations

import logging
import os
from typing import Any, Mapping, Optional

import httpx

from .catalog import Catalog, Endpoint, FREE_ENDPOINTS, PAID_ENDPOINTS

logger = logging.getLogger("aetheriusx")

# ─── Defaults ──────────────────────────────────────────────────────────────────

MAINNET_URL = os.environ.get("AETHERIUS_API_URL", "https://34-156-149-38.sslip.io/aetherapi")
LOCAL_URL = "http://127.0.0.1:4020"


# ─── Category sub-clients ──────────────────────────────────────────────────────


class _CategoryClient:
    """Typed methods for a category of endpoints."""

    def __init__(self, parent: "AetheriusXClient", category: str) -> None:
        self._parent = parent
        self._category = category
        self._endpoints = {
            e.route: e
            for e in (*PAID_ENDPOINTS, *FREE_ENDPOINTS)
            if e.category == category
        }

    def _call(
        self,
        route: str,
        params: Mapping[str, Any] | None = None,
        payment: str | None = None,
    ) -> httpx.Response:
        """Call an endpoint with optional payment."""
        return self._parent.paid_get(route, params=params, payment=payment)

    def __getattr__(self, name: str) -> Any:
        """Dynamic method access: client.data.weather(...) maps to /v1/data/weather."""
        # Convert Python method name to route segment
        # Try exact match first
        for route, endpoint in self._endpoints.items():
            # /v1/data/weather -> weather
            segment = route.rsplit("/", 1)[-1].replace("-", "_")
            if segment == name:
                return lambda **kwargs: self._call(route, params=kwargs or None)
            # Handle path params: /v1/x402/agent/{address} -> agent
            if "{" in route:
                base = route.split("{")[0].rsplit("/", 1)[-1].replace("-", "_")
                if base == name:
                    return lambda address=None, **kwargs: self._call(
                        route.replace("{address}", address or ""),
                        params=kwargs or None,
                    )

        raise AttributeError(
            f"'{self._category}' has no endpoint method '{name}'. "
            f"Available: {list(self._endpoints.keys())}"
        )


class _X402Intelligence:
    """Convenience client for the 20 FREE x402 Intelligence endpoints."""

    def __init__(self, parent: "AetheriusXClient") -> None:
        self._parent = parent
        self._endpoints = {e.route: e for e in FREE_ENDPOINTS}

    def _get(self, route: str, params: Mapping[str, Any] | None = None) -> httpx.Response:
        """Free endpoints don't need payment headers."""
        url = f"{self._parent.base_url}{route}"
        return self._parent._client.get(url, params=params)

    # ── Core ────────────────────────────────────────────────────────────────

    def payments_recent(self, **kwargs: Any) -> dict:
        """Recent USDC transfers on Base Mainnet."""
        r = self._get("/v1/x402/payments/recent", kwargs or None)
        r.raise_for_status()
        return r.json()

    def agent(self, address: str) -> dict:
        """Wallet spending intelligence."""
        r = self._get(f"/v1/x402/agent/{address}")
        r.raise_for_status()
        return r.json()

    def analytics(self, **kwargs: Any) -> dict:
        """Network health & USDC transfer trends."""
        r = self._get("/v1/x402/analytics", kwargs or None)
        r.raise_for_status()
        return r.json()

    def top_agents(self, **kwargs: Any) -> dict:
        """Top USDC spenders leaderboard."""
        r = self._get("/v1/x402/top-agents", kwargs or None)
        r.raise_for_status()
        return r.json()

    # ── Chain & Gas ─────────────────────────────────────────────────────────

    def base_stats(self) -> dict:
        """Chain health snapshot (block, gas, chain ID)."""
        r = self._get("/v1/x402/base-stats")
        r.raise_for_status()
        return r.json()

    def gas(self) -> dict:
        """Gas price analysis & cost estimates."""
        r = self._get("/v1/x402/gas")
        r.raise_for_status()
        return r.json()

    def network(self) -> dict:
        """Full network health dashboard."""
        r = self._get("/v1/x402/network")
        r.raise_for_status()
        return r.json()

    # ── Activity ────────────────────────────────────────────────────────────

    def whales(self, **kwargs: Any) -> dict:
        """Large USDC transfer tracker (>$10K)."""
        r = self._get("/v1/x402/whales", kwargs or None)
        r.raise_for_status()
        return r.json()

    def velocity(self, **kwargs: Any) -> dict:
        """Transfer frequency per hour (24h)."""
        r = self._get("/v1/x402/velocity", kwargs or None)
        r.raise_for_status()
        return r.json()

    def hourly(self, **kwargs: Any) -> dict:
        """Hourly volume breakdown."""
        r = self._get("/v1/x402/hourly", kwargs or None)
        r.raise_for_status()
        return r.json()

    def mint_burn(self, **kwargs: Any) -> dict:
        """USDC supply changes (mint/burn)."""
        r = self._get("/v1/x402/mint-burn", kwargs or None)
        r.raise_for_status()
        return r.json()

    def bridge(self, **kwargs: Any) -> dict:
        """Cross-chain bridge activity."""
        r = self._get("/v1/x402/bridge", kwargs or None)
        r.raise_for_status()
        return r.json()

    # ── Wallet ──────────────────────────────────────────────────────────────

    def search(self, q: str) -> dict:
        """Address or transaction lookup."""
        r = self._get("/v1/x402/search", {"q": q})
        r.raise_for_status()
        return r.json()

    def history(self, address: str) -> dict:
        """Transfer history for any wallet."""
        r = self._get(f"/v1/x402/history/{address}")
        r.raise_for_status()
        return r.json()

    def compare(self, a: str, b: str) -> dict:
        """Compare two wallets side-by-side."""
        r = self._get("/v1/x402/compare", {"a": a, "b": b})
        r.raise_for_status()
        return r.json()

    def risk(self, address: str) -> dict:
        """Wallet risk score (0-100)."""
        r = self._get(f"/v1/x402/risk/{address}")
        r.raise_for_status()
        return r.json()

    # ── Market ──────────────────────────────────────────────────────────────

    def token(self, address: str) -> dict:
        """ERC-20 token metadata (any token)."""
        r = self._get(f"/v1/x402/token/{address}")
        r.raise_for_status()
        return r.json()

    def contracts(self, **kwargs: Any) -> dict:
        """Top USDC-receiving contracts."""
        r = self._get("/v1/x402/contracts", kwargs or None)
        r.raise_for_status()
        return r.json()

    def stablecoins(self, **kwargs: Any) -> dict:
        """All stablecoin activity (USDC/USDT/DAI)."""
        r = self._get("/v1/x402/stablecoins", kwargs or None)
        r.raise_for_status()
        return r.json()

    def defi_pulse(self, **kwargs: Any) -> dict:
        """DeFi protocol activity on Base."""
        r = self._get("/v1/x402/defi-pulse", kwargs or None)
        r.raise_for_status()
        return r.json()


# ─── Main client ───────────────────────────────────────────────────────────────


class AetheriusXClient:
    """The official AetheriusX API client.

    Supports 80 endpoints (60 paid + 20 free x402 Intelligence).
    Connects to Base Mainnet by default.

    Usage:
        from aetheriusx import AetheriusXClient

        client = AetheriusXClient()

        # Free x402 Intelligence — no payment needed
        stats = client.x402.base_stats()
        whales = client.x402.whales()

        # Paid endpoints — auto-handles 402 challenge
        weather = client.data.weather(lat=10.5, lon=-66.9)

        # Or use the generic call
        result = client.paid_get("/v1/data/weather", params={"lat": 10.5, "lon": 66.9}, payment="anything")
    """

    def __init__(
        self,
        base_url: str = MAINNET_URL,
        *,
        timeout: float = 30.0,
        payment: str | None = None,
    ) -> None:
        """
        Args:
            base_url: API base URL. Defaults to mainnet.
            timeout: HTTP timeout in seconds.
            payment: Default payment header value for paid endpoints.
                     Set to "anything" for local simulated mode.
        """
        self.base_url = base_url.rstrip("/")
        self.default_payment = payment
        self._client = httpx.Client(timeout=timeout)
        self.catalog = Catalog()

        # Sub-clients
        self.x402 = _X402Intelligence(self)
        self.maps = _CategoryClient(self, "maps")
        self.token = _CategoryClient(self, "token")
        self.web = _CategoryClient(self, "web")
        self.email = _CategoryClient(self, "email")
        self.data = _CategoryClient(self, "data")
        self.storage = _CategoryClient(self, "storage")
        self.defi = _CategoryClient(self, "defi")
        self.forex = _CategoryClient(self, "forex")
        self.news = _CategoryClient(self, "news")
        self.crypto = _CategoryClient(self, "crypto")

    def __enter__(self) -> "AetheriusXClient":
        return self

    def __exit__(self, *args: Any) -> None:
        self.close()

    def close(self) -> None:
        self._client.close()

    # ── Core methods ────────────────────────────────────────────────────────

    def health(self) -> dict:
        """Return the service health + full endpoint catalog."""
        r = self._client.get(f"{self.base_url}/health")
        r.raise_for_status()
        return r.json()

    def discover_cheapest(self) -> tuple[str, float]:
        """Return (route, price_usd) for the cheapest paid endpoint."""
        cheapest = min(self.catalog.paid, key=lambda e: e.cost_usd)
        return cheapest.route, cheapest.cost_usd

    def discover_most_expensive(self) -> tuple[str, float]:
        """Return (route, price_usd) for the most expensive paid endpoint."""
        most = max(self.catalog.paid, key=lambda e: e.cost_usd)
        return most.route, most.cost_usd

    def discover_free(self) -> list[str]:
        """Return all free endpoint routes."""
        return [e.route for e in self.catalog.free]

    def paid_get(
        self,
        route: str,
        params: Mapping[str, Any] | None = None,
        payment: str | None = None,
    ) -> httpx.Response:
        """Request a route, auto-handling the 402 challenge.

        First request is sent without payment. If 402 is returned,
        retries with the payment header. Free endpoints skip payment entirely.

        Args:
            route: API route (e.g. "/v1/data/weather").
            params: Query parameters.
            payment: Payment proof. Falls back to self.default_payment.
        """
        if not route.startswith("/"):
            raise ValueError("route must start with '/'")

        # Check if endpoint is free
        endpoint = self.catalog.find(route)
        if endpoint and endpoint.is_free:
            url = f"{self.base_url}{route}"
            return self._client.get(url, params=params)

        url = f"{self.base_url}{route}"

        # First attempt — no payment
        response = self._client.get(url, params=params)

        if response.status_code != 402:
            return response

        # 402 challenge — retry with payment
        pay = payment or self.default_payment
        if not pay:
            raise ValueError(
                f"Endpoint {route} requires payment. "
                f"Pass payment='anything' for local simulated mode, "
                f"or set payment in the client constructor."
            )

        return self._client.get(url, params=params, headers={"X-PAYMENT": pay})

    def get(self, route: str, **kwargs: Any) -> dict:
        """Generic GET request. Returns parsed JSON."""
        payment = kwargs.pop("payment", self.default_payment)
        params = kwargs if kwargs else None
        r = self.paid_get(route, params=params, payment=payment)
        r.raise_for_status()
        return r.json()
