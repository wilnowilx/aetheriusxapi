# Como leer el drift de slots de Storage

El slot drift es la diferencia entre el numero de bloque que varias capas RPC observan de forma independiente y casi al mismo tiempo. No es automaticamente un error: mide si los observadores ven el mismo estado de la cadena y aporta la latencia y los fallos necesarios para interpretar el resultado.

## Contrato

```text
GET /v1/storage/drift?chain=base&layers=3
```

- `chain`: identificador de red; usa `base` para el conjunto RPC de Base.
- `layers`: numero de capas RPC independientes a comparar. La implementacion actual usa `2` por defecto y limita el valor al numero de RPC disponibles.
- Precio: `$0.02` por llamada.
- El challenge de pago usa USDC en Base Sepolia (`eip155:84532`) en el servicio live.

Una respuesta exitosa tiene esta forma:

```json
{
  "chain": "base",
  "layers": [
    {"name": "rpc-a", "slot": 50811753, "observed_at": "...", "latency_ms": 186.4, "error": null}
  ],
  "drift": {
    "slot_delta": 0,
    "min_slot": 50811753,
    "max_slot": 50811753,
    "status": "degraded",
    "reporting_layers": 2,
    "failed_layers": ["rpc-c"]
  },
  "data_source": "public-rpc",
  "fetched_at": "..."
}
```

La estructura se basa en la respuesta local reproducida abajo; los valores con `...` estan abreviados intencionalmente en este ejemplo estructural.

## Challenge live: HTTP 402

Sin una prueba de pago, la testnet live devolvio esta respuesta el 2026-09-03:

```text
HTTP/1.1 402 Payment Required
Content-Type: application/json
payment-required: eyJ4NDAyVmVyc2lvbiI6MiwiZXJyb3IiOiJQYXltZW50IHJlcXVpcmVkIiwicmVzb3VyY2UiOnsidXJsIjoiaHR0cDovLzM0LjE1Ni4xNDkuMzgvdjEvc3RvcmFnZS9kcmlmdD9sYXllcnM9MyIsImRlc2NyaXB0aW9uIjoiQ3Jvc3MtUlBDIHNsb3QgZHJpZnQgLSB3aGljaCBibG9jayBudW1iZXIgZWFjaCBsYXllciBzZWVzIiwibWltZVR5cGUiOiJhcHBsaWNhdGlvbi9qc29uIn0sImFjY2VwdHMiOlt7InNjaGVtZSI6ImV4YWN0IiwibmV0d29yayI6ImVpcDE1NTo4NDUzMiIsImFtb3VudCI6IjIwMDAwIiwicGF5VG8iOiIweDY3N0I0ODMxMjhEMDM5OWJDRDBBNUFCMzZlRTk5MEMwMjQ2ZDdmNjEiLCJtYXhUaW1lb3V0U2Vjb25kcyI6MzAwLCJleHRyYSI6eyJuYW1lIjoiVVNEQyIsInZlcnNpb24iOiIyIn19XX0=

{}
```

La respuesta live es un challenge x402 real, no un resultado pagado. El cliente debe decodificar los requisitos, firmar la autorizacion exacta y reintentar con la prueba resultante.

## Flujo local completo

El servidor local acepta cualquier valor no vacio en `X-PAYMENT` cuando esta en modo simulado. Esto no es un pago onchain.

```bash
curl -i "http://127.0.0.1:4020/v1/storage/drift?chain=base&layers=3"
curl -H "X-PAYMENT: anything" "http://127.0.0.1:4020/v1/storage/drift?chain=base&layers=3"
```

Challenge local observado:

```text
HTTP/1.1 402 Payment Required
{"error":"Payment required","amount":"0.02","currency":"USDC","network":"eip155:84532","pay_to":"0x677B483128D0399bCD0A5AB36eE990C0246d7f61","route":"/v1/storage/drift","hint":"Retry with header 'X-PAYMENT: <payment-proof>'. Local simulated mode accepts any non-empty value."}
```

Respuesta local pagada observada:

```json
{
  "chain": "base",
  "layers": [
    {"name":"mainnet.base.org","slot":50811753,"latency_ms":186.4,"error":null},
    {"name":"base-mainnet.public.blastapi.io","slot":50811753,"latency_ms":169.8,"error":null},
    {"name":"base.llamarpc.com","slot":null,"latency_ms":136.0,"error":"HTTP 403"}
  ],
  "drift": {
    "slot_delta": 0,
    "min_slot": 50811753,
    "max_slot": 50811753,
    "status": "degraded",
    "reporting_layers": 2,
    "failed_layers": ["base.llamarpc.com"]
  },
  "data_source":"public-rpc"
}
```

## Como leer el estado

La respuesta reproducida es `degraded`: dos capas informaron el mismo slot, pero una capa configurada fallo con HTTP 403. Las observaciones validas siguen siendo utiles, pero el resultado esta incompleto y no debe tratarse como una comparacion de tres capas completa.

Esta ejecucion no reprodujo `converged` ni `diverged`, asi que este tutorial no incluye outputs inventados para esos estados. En produccion, usa juntos los campos `status`, `slot_delta`, `reporting_layers` y `failed_layers`; no deduzcas la salud solo a partir de `slot_delta`.

El contrato publico y las convenciones de error estandar siguen documentados en `docs/API.md`.
