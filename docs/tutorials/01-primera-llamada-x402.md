# Tu Primera Llamada x402

Este tutorial muestra el flujo x402 más pequeño y útil. Harás una petición sin pago, leerás la respuesta `402 Payment Required` y luego reintentarás en local con una cabecera de pago simulada.

## Qué necesitas

- Python 3.10+ y `httpx`, o `curl`.
- Un servidor local corriendo para el último paso:

```bash
uvicorn main:app --port 4020
```

La testnet en vivo está en `http://34.156.149.38/aetherapi`. El servidor local es simulado: cualquier valor no vacío de `X-PAYMENT` se acepta en local. La testnet en vivo requiere firma x402 real en USDC; consulta `docs/API.md`.

## Paso 1: Pide sin pago

Usa el endpoint de validación de email. Su contrato es:

```text
GET /v1/email/validate?email=user@example.com
```

```bash
curl -i "http://34.156.149.38/aetherapi/v1/email/validate?email=user@example.com"
```

Salida observada el 2026-09-03:

```text
HTTP/1.1 402 Payment Required
Content-Type: application/json
payment-required: <base64 encoded x402 requirements>

{}
```

Lo importante es el estado HTTP. La API dice: “Puedo servir esta petición, pero primero aporta una prueba de pago.” La cabecera `payment-required` trae los detalles legibles por máquina, incluyendo monto (`5000` unidades base de USDC), activo, red (`eip155:84532`) y destinatario.

## Paso 2: Reintenta en local con pago simulado

Inicia el modo local y envía la misma petición con `X-PAYMENT`:

```bash
curl -i \
  -H "X-PAYMENT: anything" \
  "http://127.0.0.1:4020/v1/email/validate?email=user@example.com"
```

Salida local observada el 2026-09-03:

```text
HTTP/1.1 200 OK
Content-Type: application/json

{"email":"user@example.com","valid_syntax":true,"has_mx":null,"is_disposable":false,"risk_score":40,"verdict":"risky"}
```

Es una forma de respuesta real del endpoint, no un placeholder. `has_mx: null` y el veredicto `risky` son resultados válidos en el entorno local cuando la consulta MX no está disponible.

## El mismo flujo en Python

```python
import httpx

endpoint = "http://127.0.0.1:4020/v1/email/validate?email=user@example.com"

with httpx.Client() as client:
    first = client.get(endpoint)
    print(first.status_code)  # 402

    # X-PAYMENT:anything en local = simulado.
    # La testnet en vivo requiere firma x402 real en USDC (ver docs/API.md).
    second = client.get(endpoint, headers={"X-PAYMENT": "anything"})
    print(second.status_code)  # 200
    print(second.json())
```

## ¿Qué cambia en producción?

El código de aplicación sigue haciendo una petición HTTP. Un cliente x402 de producción gestiona el requisito de pago, firma una autorización exacta en USDC para la red y el monto solicitados, y reintenta con la prueba de pago resultante. Nunca trates la cabecera local como un pago real ni pongas claves privadas en una petición HTTP.
