"""Small synchronous client for the AetheriusX HTTP API."""

from __future__ import annotations

from decimal import Decimal, InvalidOperation
import re
from typing import Any, Mapping

import httpx


class AetheriusXClient:
    """Discover and call AetheriusX endpoints over HTTP.

    ``payment`` is supplied by the caller so this client never handles private
    keys. A local value such as ``anything`` is accepted only by simulated mode.
    Live testnet requires a real x402 USDC payment proof.
    """

    def __init__(self, base_url: str = "http://127.0.0.1:4020", *, timeout: float = 10.0) -> None:
        self.base_url = base_url.rstrip("/")
        self._client = httpx.Client(timeout=timeout)

    def __enter__(self) -> "AetheriusXClient":
        return self

    def __exit__(self, exc_type: Any, exc_value: Any, traceback: Any) -> None:
        self.close()

    def close(self) -> None:
        self._client.close()

    def health(self) -> dict[str, Any]:
        """Return the service health document, including its endpoint catalog."""
        response = self._client.get(f"{self.base_url}/health")
        response.raise_for_status()
        return response.json()

    def discover_cheapest(self) -> tuple[str, Decimal]:
        """Return the cheapest catalogued paid route and its USD price."""
        catalog = self.health().get("endpoints", {})
        candidates: list[tuple[Decimal, str]] = []
        for route, description in catalog.items():
            match = re.search(r"\$(\d+(?:\.\d+)?)/call", str(description))
            if not match:
                continue
            try:
                candidates.append((Decimal(match.group(1)), route))
            except InvalidOperation:
                continue
        if not candidates:
            raise RuntimeError("The health response advertises no paid endpoints")
        price, route = min(candidates)
        return route, price

    def paid_get(
        self,
        route: str,
        params: Mapping[str, Any] | None = None,
        payment: str | None = None,
    ) -> httpx.Response:
        """Request a route, retrying its 402 challenge with ``payment``.

        The first request is deliberately sent without payment. If the server
        responds with 402, the method retries once. The caller must provide the
        resulting x402 proof; ``X-PAYMENT: anything`` is local simulation only.
        """
        if not route.startswith("/"):
            raise ValueError("route must start with '/'")
        url = f"{self.base_url}{route}"
        response = self._client.get(url, params=params)
        if response.status_code != 402:
            return response
        if not payment:
            raise ValueError("payment is required after the 402 challenge")
        return self._client.get(url, params=params, headers={"X-PAYMENT": payment})
