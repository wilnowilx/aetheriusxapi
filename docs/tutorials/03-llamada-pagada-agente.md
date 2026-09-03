# Un agente realiza su primera llamada pagada

Este tutorial construye un agente Python pequeno que descubre el catalogo desde `/health`, elige el endpoint de pago mas barato, envia una peticion, recibe el desafio `402 Payment Required`, reintenta con una cabecera de pago y registra el volumen de la llamada.

## Que hace el agente

1. Llama a `/health` sin pago. Este endpoint es gratuito.
2. Lee el objeto `endpoints` y extrae precios como `$0.005/call`.
3. Elige la ruta mas barata. En el catalogo actual es `/v1/email/validate`.
4. Llama a esa ruta sin pago y recibe `402`.
5. Reintenta con `X-PAYMENT: anything` en modo local simulado.
6. Registra el precio elegido y el volumen acumulado de esta ejecucion.

> `X-PAYMENT:anything` local es simulado. La testnet real requiere firma x402 real en USDC; consulta `docs/API.md`.

## Ejecutarlo

Inicia el servidor local en otra terminal:

```bash
uvicorn main:app --port 4020
```

Instala `httpx` desde los requisitos del proyecto y ejecuta el agente:

```bash
python3 examples/python/01-first-call.py
```

El ejemplo usa `http://127.0.0.1:4020` por defecto. Define `AETHERIUS_LOCAL_URL` para usar otra URL base local.

## Codigo del agente

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
        "address": "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA4b4eE",
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
        raise RuntimeError("No hay un endpoint de pago compatible anunciado por /health")
    price, route = min(candidates)
    return route, price


with httpx.Client(timeout=10) as client:
    health = client.get(f"{BASE_URL}/health")
    health.raise_for_status()
    catalog = health.json()["endpoints"]
    route, price = choose_cheapest_paid_endpoint(catalog)
    url = f"{BASE_URL}{route}"
    print(f"descubiertos: {len(catalog)} endpoints")
    print(f"seleccionado: {route} a ${price}/call")

    challenge = client.get(url, params=PARAMETERS[route])
    print(f"desafio: HTTP {challenge.status_code}")
    if challenge.status_code != 402:
        raise RuntimeError(f"Se esperaba HTTP 402, se obtuvo {challenge.status_code}")

    # X-PAYMENT:anything local = simulado.
    # La testnet real requiere firma x402 real en USDC (consulta docs/API.md).
    paid = client.get(
        url,
        params=PARAMETERS[route],
        headers={"X-PAYMENT": "anything"},
    )
    paid.raise_for_status()
    volume_usdc = price
    print(f"reintento pagado: HTTP {paid.status_code}")
    print(f"volumen de esta ejecucion: ${volume_usdc} USDC")
    print(paid.json())
```

## Salida observada

Contra el servidor local simulado el 2026-09-03:

```text
descubiertos: 10 endpoints
seleccionado: /v1/email/validate a $0.005/call
desafio: HTTP 402
reintento pagado: HTTP 200
volumen de esta ejecucion: $0.005 USDC
{'email': 'user@example.com', 'valid_syntax': True, 'has_mx': None, 'is_disposable': False, 'risk_score': 40, 'verdict': 'risky'}
```

El volumen local es un valor contable de la llamada simulada. No es una liquidacion onchain. En produccion, el agente debe decodificar los requisitos de pago, firmar la autorizacion x402 exacta con su wallet, reintentar con la prueba resultante y reconciliar el volumen liquidado mediante la telemetria o el recibo del servidor.
