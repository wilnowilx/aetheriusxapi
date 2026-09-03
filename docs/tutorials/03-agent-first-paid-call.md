# An Agent Makes Its First Paid API Call

This tutorial builds a small Python agent that discovers the API catalog from `/health`, chooses the cheapest paid endpoint, sends a request, handles the `402 Payment Required` challenge, retries with a payment header, and records the request volume.

## What the agent does

1. Calls `/health` without payment. This endpoint is free.
2. Reads the `endpoints` object and extracts prices such as `$0.005/call`.
3. Selects the cheapest route. In the current catalog this is `/v1/email/validate`.
4. Calls that route without payment and receives `402`.
5. Retries with `X-PAYMENT: anything` in local simulated mode.
6. Logs the selected price and cumulative volume for this run.

> Local `X-PAYMENT:anything` is simulated. Live testnet requires real x402 USDC signing; see `docs/API.md`.

## Run it

Start the local server in another terminal:

```bash
uvicorn main:app --port 4020
```

Install `httpx` from the project requirements and run the agent:

```bash
python3 examples/python/01-first-call.py
```

The example uses `http://127.0.0.1:4020` by default. Set `AETHERIUS_LOCAL_URL` to use another local base URL.

## Agent code

```python
from decimal import Decimal
import os
import re

import httpx

BASE_URL = os.getenv("AETHERIUS_LOCAL_URL", "http://127.0.0.1:4020").rstrip("/")
PARAMETERS = {
    "/v1/email/validate": {"email": "user@example.com"},
    "/v1/data/weather": {"lat": "19.43", "lon": "-99.13"},
    "/v1/token/price": {
        "address": "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913",
        "chain": "base",
    },
}


def price_from_description(description: str) -> Decimal | None:
    match = re.search(r"\$(\d+(?:\.\d+)?)/call", description)
    return Decimal(match.group(1)) if match else None


def choose_cheapest_paid_endpoint(catalog: dict[str, str]) -> tuple[str, Decimal]:
    candidates = []
    for route, description in catalog.items():
        price = price_from_description(description)
        if price is not None and route in PARAMETERS:
            candidates.append((price, route))
    if not candidates:
        raise RuntimeError("No compatible paid endpoint was advertised by /health")
    price, route = min(candidates)
    return route, price


with httpx.Client(timeout=10) as client:
    health = client.get(f"{BASE_URL}/health")
    health.raise_for_status()
    catalog = health.json()["endpoints"]
    route, price = choose_cheapest_paid_endpoint(catalog)
    url = f"{BASE_URL}{route}"
    print(f"discovered: {len(catalog)} endpoints")
    print(f"selected: {route} at ${price}/call")

    challenge = client.get(url, params=PARAMETERS[route])
    print(f"challenge: HTTP {challenge.status_code}")
    if challenge.status_code != 402:
        raise RuntimeError(f"Expected HTTP 402, got {challenge.status_code}")

    # Local X-PAYMENT:anything = simulated.
    # Live testnet requires real x402 USDC signing (see docs/API.md).
    paid = client.get(
        url,
        params=PARAMETERS[route],
        headers={"X-PAYMENT": "anything"},
    )
    paid.raise_for_status()
    volume_usdc = price
    print(f"paid retry: HTTP {paid.status_code}")
    print(f"volume this run: ${volume_usdc} USDC")
    print(paid.json())
```

## Observed output

Against the local simulated server on 2026-09-03:

```text
discovered: 10 endpoints
selected: /v1/email/validate at $0.005/call
challenge: HTTP 402
paid retry: HTTP 200
volume this run: $0.005 USDC
{'email': 'user@example.com', 'valid_syntax': True, 'has_mx': None, 'is_disposable': False, 'risk_score': 40, 'verdict': 'risky'}
```

The local volume is an accounting value for the simulated call. It is not an on-chain settlement. In production, the agent must decode the payment requirements, sign the exact x402 authorization with its wallet, retry with the resulting proof, and use the server telemetry or receipt to reconcile settled volume.
