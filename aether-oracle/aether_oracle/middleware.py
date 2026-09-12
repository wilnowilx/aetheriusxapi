from __future__ import annotations

import time
import uuid
from typing import Any, Callable, Dict, Optional, Set

from starlette.applications import Starlette
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response


class AetherMiddleware(BaseHTTPMiddleware):
    def __init__(
        self,
        app: Starlette,
        prices: Dict[str, float],
        pay_to: str,
        network: str,
        currency: str,
        collect_first: bool = False,
        circuit_breaker_threshold: int = 5,
        circuit_breaker_reset: float = 60.0,
    ):
        self.app = app
        self.prices = prices
        self.pay_to = pay_to
        self.network = network
        self.currency = currency
        self.collect_first = collect_first
        self.circuit_breaker_threshold = circuit_breaker_threshold
        self.circuit_breaker_reset = circuit_breaker_reset

        self._nonces: Set[str] = set()
        self._circuit_open = False
        self._failure_count = 0
        self._last_failure_time = 0.0
        self._stats = {
            "total_requests": 0,
            "successful_requests": 0,
            "failed_requests": 0,
            "rejected_requests": 0,
            "duplicate_nonces": 0,
        }

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        self._stats["total_requests"] += 1

        if self._circuit_open:
            elapsed = time.time() - self._last_failure_time
            if elapsed < self.circuit_breaker_reset:
                self._stats["rejected_requests"] += 1
                return Response(status_code=503, json={"error": "Service unavailable (circuit open)"})
            self._circuit_open = False
            self._failure_count = 0

        nonce = request.headers.get("X-Nonce")
        paid = request.headers.get("X-Payment")

        paid_routes = self._get_paid_routes(request)

        if paid_routes and not paid:
            self._stats["rejected_requests"] += 1
            return Response(status_code=402, json={"error": "Payment required"})

        if nonce:
            if nonce in self._nonces:
                self._stats["duplicate_nonces"] += 1
                self._stats["rejected_requests"] += 1
                return Response(status_code=409, json={"error": "Duplicate nonce"})
            self._nonces.add(nonce)
            self._cleanup_nonces()

        response = await call_next(request)

        if response.status_code < 400:
            self._stats["successful_requests"] += 1
            self._failure_count = 0
            response.headers["X-Payment-Settled"] = "true"
        else:
            self._stats["failed_requests"] += 1
            self._failure_count += 1
            self._last_failure_time = time.time()
            if self._failure_count >= self.circuit_breaker_threshold:
                self._circuit_open = True

        return response

    def _get_paid_routes(self, request: Request) -> bool:
        return bool(request.url.path.startswith("/api/"))

    def _cleanup_nonces(self):
        if len(self._nonces) > 10000:
            self._nonces = set(list(self._nonces)[-5000:])

    def stats(self) -> Dict[str, Any]:
        return dict(self._stats)
