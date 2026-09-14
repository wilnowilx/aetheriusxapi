# AetheriusX Python SDK

Small synchronous client for discovering and calling AetheriusX APIs.

## Install

From the repository root:

```bash
pip install -e ./sdks/python
```

## Usage

```python
from aetheriusx import AetheriusXClient

with AetheriusXClient("http://127.0.0.1:4020") as client:
    health = client.health()
    route, price = client.discover_cheapest()
    print(f"{route} costs ${price}/call")

    response = client.paid_get(
        route,
        params={"email": "user@example.com"},
        payment="anything",
    )
    print(response.status_code, response.json())
```

`paid_get()` first sends the request without payment, observes `402 Payment Required`, then retries with the supplied `X-PAYMENT` value. A local `X-PAYMENT:anything` header is simulated only. Live testnet requires real x402 USDC signing; see `docs/API.md`.

## Observed local output

With `uvicorn main:app --port 4020` running on 2026-09-03:

```text
10
/v1/email/validate 0.005
402
200
{'email': 'user@example.com', 'valid_syntax': True, 'has_mx': None, 'is_disposable': False, 'risk_score': 40, 'verdict': 'risky'}
```

A minimal demo that produces this output:

```python
from aetheriusx import AetheriusXClient

with AetheriusXClient() as client:
    print(len(client.health()["endpoints"]))
    route, price = client.discover_cheapest()
    print(route, price)
    first = client._client.get(f"{client.base_url}{route}", params={"email": "user@example.com"})
    print(first.status_code)
    paid = client.paid_get(route, {"email": "user@example.com"}, "anything")
    print(paid.status_code)
    print(paid.json())
```

The private `_client` line is only a compact output reproducer. Application code should use `paid_get()` and not depend on private attributes.
