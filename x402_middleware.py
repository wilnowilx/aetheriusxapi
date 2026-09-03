"""Simulated x402 middleware for local development."""

from collections.abc import Iterable
from decimal import Decimal, InvalidOperation
import json
from typing import Any

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse, Response


class SimulatedX402Middleware(BaseHTTPMiddleware):
    """Require a local payment proof and expose x402-shaped 402 responses."""

    def __init__(self, app: Any, routes: dict[str, str]) -> None:
        super().__init__(app)
        self.routes = {key.upper(): value for key, value in routes.items()}

    async def dispatch(self, request: Request, call_next: Any) -> Response:
        route_key = f"{request.method} {request.url.path}".upper()
        price = self.routes.get(route_key)
        if price is None:
            return await call_next(request)

        payment = request.headers.get("X-PAYMENT", "").strip()
        if not payment:
            return JSONResponse(
                status_code=402,
                content={
                    "error": "Payment required",
                    "amount": price,
                    "currency": "USDC",
                    "network": "eip155:8453",
                    "pay_to": "0x0000000000000000000000000000000000000001",
                    "mode": "simulated",
                    "payment_header": "X-PAYMENT",
                },
                headers={"X-PAYMENT-REQUIRED": "true"},
            )

        if not _is_valid_simulated_payment(payment, price):
            return JSONResponse(
                status_code=402,
                content={"error": "Invalid simulated payment", "mode": "simulated"},
            )

        response = await call_next(request)
        response.headers["X-PAYMENT-RESPONSE"] = json.dumps(
            {"status": "settled", "mode": "simulated", "amount": price}
        )
        return response


def _is_valid_simulated_payment(payment: str, price: str) -> bool:
    """Accept an explicit local proof, optionally encoded as JSON."""
    if payment in {"simulated", "simulated-payment", "test-payment"}:
        return True
    try:
        payload = json.loads(payment)
    except json.JSONDecodeError:
        return False
    if not isinstance(payload, dict) or payload.get("scheme") != "simulated":
        return False
    try:
        return Decimal(str(payload.get("amount"))) >= Decimal(price)
    except (InvalidOperation, TypeError):
        return False
