# Ejemplos ejecutables 402 -> 200

Estos ejemplos usan el endpoint de validacion de email porque su contrato es pequeno y facil de inspeccionar:

```text
GET /v1/email/validate?email=user@example.com
```

## Etiquetas honestas de red

- `01-health.sh` llama a la URL real de testnet y es gratuito.
- `02-challenge.sh` llama a testnet sin pago y muestra los requisitos reales del `402`.
- `03-paid-local.sh`, Python y JavaScript llaman a uvicorn local. Su cabecera `X-PAYMENT: anything` es simulada y no mueve dinero.
- La testnet requiere firma x402 real en USDC. Consulta `docs/API.md`. No trates la cabecera local como una prueba de pago.

La URL real por defecto es `http://34.156.149.38/aetherapi`. Puedes cambiarla con `AETHERIUS_LIVE_URL`. Los ejemplos locales usan por defecto `http://127.0.0.1:4020`; puedes cambiarlo con `AETHERIUS_LOCAL_URL`.

## Ejecutarlos

Inicia el modo local en otra terminal:

```bash
uvicorn main:app --port 4020
```

Despues ejecuta:

```bash
bash examples/curl/01-health.sh
bash examples/curl/02-challenge.sh
bash examples/curl/03-paid-local.sh
python3 examples/python/01-first-call.py
node examples/javascript/01-first-call.mjs
```

Se requiere Node.js 18 o posterior. Python usa `httpx`, instalado mediante `requirements.txt`.

## Salidas observadas

Capturadas el 2026-09-03 contra testnet real y uvicorn local. Los timestamps y valores de telemetria pueden cambiar.

### Health en testnet real

```json
GET http://34.156.149.38/aetherapi/health
{"status":"alive","service":"aetheriusxAPI","version":"2.0.0","mode":"real","network":"eip155:84532","currency":"USDC","wallet":"0x677B483128D0399bCD0A5AB36eE990C0246d7f61","timestamp":"2026-09-03T03:46:55.721723+00:00","endpoints":{ "/v1/maps/search":"$0.01/call - Business search via OpenStreetMap - names, addresses, phones, coords", "/v1/email/validate":"$0.005/call - Email validation - syntax, MX, disposable, risk score", "/v1/data/weather":"$0.008/call - Current weather by coordinates via Open-Meteo"}}
```

### Challenge de pago en testnet real

```text
GET http://34.156.149.38/aetherapi/v1/email/validate?email=user@example.com (without payment)
{}
HTTP_STATUS:402
```

### Reintento local pagado (simulado)

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
