# Runnable 402 -> 200 examples

These examples use the email validation endpoint because its contract is small and easy to inspect:

```text
GET /v1/email/validate?email=user@example.com
```

## Honest network labels

- `01-health.sh` calls the live testnet URL and is free.
- `02-challenge.sh` calls live testnet without payment and shows the real `402` requirements.
- `03-paid-local.sh`, Python, and JavaScript call local uvicorn. Their `X-PAYMENT: anything` header is simulated and does not move money.
- Live testnet requires real x402 USDC signing (see `docs/API.md`). Do not treat the local header as a payment proof.

The live URL defaults to `http://34.156.149.38/aetherapi`. Override it with `AETHERIUS_LIVE_URL`. Local examples default to `http://127.0.0.1:4020`; override with `AETHERIUS_LOCAL_URL`.

## Run them

Start local mode in another terminal:

```bash
uvicorn main:app --port 4020
```

Then run:

```bash
bash examples/curl/01-health.sh
bash examples/curl/02-challenge.sh
bash examples/curl/03-paid-local.sh
python3 examples/python/01-first-call.py
node examples/javascript/01-first-call.mjs
```

Node.js 18 or newer is required. Python uses `httpx`, installed by `requirements.txt`.

## Observed outputs

Captured on 2026-09-03 against the live testnet and local uvicorn. Timestamps and live telemetry values can change.

### Health (live testnet)

```json
GET http://34.156.149.38/aetherapi/health
{"status":"alive","service":"aetheriusxAPI","version":"2.0.0","mode":"real","network":"eip155:84532","currency":"USDC","wallet":"0x677B483128D0399bCD0A5AB36eE990C0246d7f61","timestamp":"2026-09-03T03:46:55.721723+00:00","endpoints":{ "/v1/maps/search":"$0.01/call - Business search via OpenStreetMap - names, addresses, phones, coords", "/v1/email/validate":"$0.005/call - Email validation - syntax, MX, disposable, risk score", "/v1/data/weather":"$0.008/call - Current weather by coordinates via Open-Meteo"}}
```

### Payment challenge (live testnet)

```text
GET http://34.156.149.38/aetherapi/v1/email/validate?email=user@example.com (without payment)
{}
HTTP_STATUS:402
```

### Paid local retry (simulated)

```text
GET http://127.0.0.1:4020/v1/email/validate?email=user@example.com (simulated payment)
{"email":"user@example.com","valid_syntax":true,"has_mx":null,"is_disposable":false,"risk_score":40,"verdict":"risky"}
HTTP_STATUS:200
```

### Python

```text
first request: HTTP 402
{'error': 'Payment required', 'amount': '0.005', 'currency': 'USDC', 'network': 'eip155:84532', 'pay_to': '0x677B483128D0399bCD0A5AB36eE990C0246d7f61', 'route': '/v1/email/validate', 'hint': "Retry with header 'X-PAYMENT: <payment-proof>'. Local simulated mode accepts any non-empty value."}
paid retry: HTTP 200
{'email': 'user@example.com', 'valid_syntax': True, 'has_mx': None, 'is_disposable': False, 'risk_score': 40, 'verdict': 'risky'}
```

### JavaScript

```text
first request: HTTP 402
{
	error: 'Payment required',
	amount: '0.005',
	currency: 'USDC',
	network: 'eip155:84532',
	pay_to: '0x677B483128D0399bCD0A5AB36eE990C0246d7f61',
	route: '/v1/email/validate',
	hint: "Retry with header 'X-PAYMENT: <payment-proof>'. Local simulated mode accepts any non-empty value."
}
paid retry: HTTP 200
{
	email: 'user@example.com',
	valid_syntax: true,
	has_mx: null,
	is_disposable: false,
	risk_score: 40,
	verdict: 'risky'
}
```
