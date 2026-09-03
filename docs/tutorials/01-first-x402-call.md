# Your First x402 API Call

This tutorial shows the smallest useful x402 flow. You will make one request without payment, read the `402 Payment Required` response, then retry locally with a simulated payment header.

## What you need

- Python 3.10+ and `httpx`, or `curl`.
- A running local server for the final step:

```bash
uvicorn main:app --port 4020
```

The live testnet is available at `http://34.156.149.38/aetherapi`. The local server is simulated: any non-empty `X-PAYMENT` value is accepted locally. Live testnet requires real x402 USDC signing; see `docs/API.md`.

## Step 1: Ask without payment

Use the email validation endpoint. Its contract is:

```text
GET /v1/email/validate?email=user@example.com
```

```bash
curl -i "http://34.156.149.38/aetherapi/v1/email/validate?email=user@example.com"
```

Observed output on 2026-09-03:

```text
HTTP/1.1 402 Payment Required
Content-Type: application/json
payment-required: <base64 encoded x402 requirements>

{}
```

The important part is the HTTP status. The API is saying: “I can serve this request, but first provide a payment proof.” The `payment-required` header contains the machine-readable details, including the amount (`5000` USDC base units), asset, network (`eip155:84532`), and recipient.

## Step 2: Retry locally with a simulated payment

Start local mode, then send the same request with `X-PAYMENT`:

```bash
curl -i \
  -H "X-PAYMENT: anything" \
  "http://127.0.0.1:4020/v1/email/validate?email=user@example.com"
```

Observed local output on 2026-09-03:

```text
HTTP/1.1 200 OK
Content-Type: application/json

{"email":"user@example.com","valid_syntax":true,"has_mx":null,"is_disposable":false,"risk_score":40,"verdict":"risky"}
```

This is a real response shape from the endpoint, not a string placeholder. `has_mx: null` and the `risky` verdict are valid outcomes in the local environment when MX lookup is unavailable.

## The same flow in Python

```python
import httpx

endpoint = "http://127.0.0.1:4020/v1/email/validate?email=user@example.com"

with httpx.Client() as client:
    first = client.get(endpoint)
    print(first.status_code)  # 402

    # Local X-PAYMENT:anything = simulated.
    # Live testnet requires real x402 USDC signing (see docs/API.md).
    second = client.get(endpoint, headers={"X-PAYMENT": "anything"})
    print(second.status_code)  # 200
    print(second.json())
```

## What changes in production?

The application code still makes an HTTP request. A production x402 client handles the payment requirement, signs an exact USDC authorization for the requested network and amount, and retries with the resulting payment proof. Never treat the local header as a real payment or put private keys in an API request.
