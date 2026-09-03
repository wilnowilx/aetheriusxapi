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

    def paid_get_x402(self, route, params=None, signer=None,
                      network="eip155:84532",
                      rpc_url="https://sepolia.base.org"):
        """Real x402 USDC payment flow (same path as docs/API.md).

        signer: an eth-account LocalAccount — signs LOCALLY, keys never leave
        your machine. Requires ``web3`` + ``x402`` packages.
        Local ``X-PAYMENT:anything`` is simulated; live networks need a real
        signature settling on-chain.
        """
        if not route.startswith("/"):
            raise ValueError("route must start with '/'")
        if signer is None:
            raise ValueError("signer is required for real x402 payment")
        try:
            from web3 import Web3
            from x402.mechanisms.evm.exact import ExactEvmClientScheme
            from x402.mechanisms.evm.exact.client import _wrap_if_local_account
            from x402.client import (
                x402ClientConfig,
                x402ClientSync,
                SchemeRegistration,
            )
            from x402.http.clients.requests import wrapRequestsWithPayment
        except ImportError as e:
            raise RuntimeError("x402 extras missing: pip install web3 x402") from e
        import requests as req

        _w3 = Web3(Web3.HTTPProvider(rpc_url))  # noqa: F841 (ensures RPC live)
        scheme = ExactEvmClientScheme(signer=_wrap_if_local_account(signer))
        cfg = x402ClientConfig(
            schemes=[SchemeRegistration(network=network, client=scheme)])
        session = wrapRequestsWithPayment(
            session=req.Session(), client=x402ClientSync.from_config(cfg))
        return session.get(f"{self.base_url}{route}",
                           params=params or {}, timeout=self.timeout)
