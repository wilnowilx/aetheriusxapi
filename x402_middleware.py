"""Simulated x402 payment middleware for local development and testing.

In SIMULATED mode any request carrying an ``X-PAYMENT`` header is treated as
paid and passes through (a ``X-PAYMENT-SETTLED: simulated`` header is added
to the response). Requests without the header receive a standards-compliant
``402 Payment Required`` JSON body describing price, currency, network and
pay-to address — the same shape the real x402 facilitator flow returns.

Set X402_MODE=real (and install the official ``x402`` SDK) to enforce
on-chain USDC verification instead. See main.py.
"""

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse

PAYMENT_HEADER = "X-PAYMENT"
SETTLED_HEADER = "X-PAYMENT-SETTLED"


class SimulatedX402Middleware(BaseHTTPMiddleware):
    """Gate paid routes behind an ``X-PAYMENT`` header (simulated settlement)."""

    def __init__(self, app, prices: dict, pay_to: str, network: str,
                 currency: str = "USDC"):
        super().__init__(app)
        self.prices = prices          # canonical "/v1/..." path -> "$0.01"
        self.pay_to = pay_to
        self.network = network
        self.currency = currency

    def _canonical(self, path: str) -> str | None:
        """Map /v1/... and legacy /api/v1/... to the canonical /v1/... key."""
        for prefix in ("/api/v1/", "/v1/"):
            if path.startswith(prefix):
                return "/v1/" + path[len(prefix):]
        return None

    async def dispatch(self, request, call_next):
        path = request.url.path
        canonical = self._canonical(path)

        # Free route (health, docs, root, or anything not in the price table).
        if canonical is None or canonical not in self.prices:
            return await call_next(request)

        payment = request.headers.get(PAYMENT_HEADER)
        if not payment:
            price = self.prices[canonical]
            return JSONResponse(
                status_code=402,
                content={
                    "error": "Payment required",
                    "amount": price.replace("$", ""),
                    "currency": self.currency,
                    "network": self.network,
                    "pay_to": self.pay_to,
                    "route": canonical,
                    "hint": f"Retry with header '{PAYMENT_HEADER}: <payment-proof>'. "
                            f"Local simulated mode accepts any non-empty value.",
                },
            )

        response = await call_next(request)
        response.headers[SETTLED_HEADER] = "simulated"
        return response
