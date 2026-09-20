# Apunta el Dashboard de Pages a la API en Vivo

El dashboard puede hospedarse como archivos estáticos en GitHub Pages mientras la API corre en GCP. En esta configuración, el navegador necesita la URL pública del backend:

```text
https://34-156-149-38.sslip.io/aetherapi
```

## Configura la barra de Backend

1. Abre el dashboard de Pages: `https://wilnowilx.github.io/aetheriusxapi/dashboard/`.
2. Encuentra la barra **Backend** en la parte superior del dashboard.
3. Ingresa `https://34-156-149-38.sslip.io/aetherapi` como URL base del backend.
4. Aplica o guarda el valor.
5. Usa **Health**, luego selecciona un endpoint en el explorador.
6. Confirma que las peticiones del dashboard salgan bajo la URL HTTPS del backend, no bajo `wilnowilx.github.io`.

El dashboard entonces llamará rutas como:

```text
https://34-156-149-38.sslip.io/aetherapi/api/v1/health
https://34-156-149-38.sslip.io/aetherapi/v1/telemetry
```

## Por qué importa CORS

El dashboard y la API tienen orígenes distintos:

- Pages: `https://wilnowilx.github.io`
- API: `https://34-156-149-38.sslip.io`

El navegador impone la política de mismo origen. La API debe por tanto permitir el origen de Pages con CORS, incluyendo los encabezados que usa x402. Una configuración CORS fallida suele verse como error de red en el dashboard aunque `curl` llegue a la API sin problema.

El backend debe permitir el origen exacto de producción, por ejemplo:

```text
https://wilnowilx.github.io
```

Evita usar `*` cuando hay credenciales o encabezados de wallet involucrados. Mantén explícitos los métodos y encabezados permitidos, incluyendo `X-PAYMENT` y los encabezados de respuesta x402 relevantes.

## Por qué importa el contenido mixto

GitHub Pages es HTTPS. El navegador bloqueará peticiones de esa página hacia una API HTTP como `http://34.156.149.38/aetherapi`. Usa el endpoint HTTPS en su lugar: `https://34-156-149-38.sslip.io/aetherapi`.

Usa la URL HTTPS con el hostname `sslip.io`:

```text
https://34-156-149-38.sslip.io/aetherapi
```

El hostname mapea la IP y permite al navegador usar HTTPS. El certificado y el proxy inverso en GCP deben ser válidos y estar bien configurados para ese hostname.

## Verificaciones rápidas

Ejecuta esto desde una terminal:

```bash
curl -i "https://wilnowilx.github.io/aetheriusxapi/dashboard/"
curl -i "https://34-156-149-38.sslip.io/aetherapi/api/v1/health"
curl -i -X OPTIONS \
  -H "Origin: https://wilnowilx.github.io" \
  -H "Access-Control-Request-Method: GET" \
  "https://34-156-149-38.sslip.io/aetherapi/api/v1/health"
```

Estado esperado tras el despliegue: las dos primeras deben devolver `200`, y el preflight debe incluir un valor `Access-Control-Allow-Origin` igual al origen de Pages. **Estado 2026-09-03: LIVE** — health HTTPS `200`, preflight `200` con origen coincidente, dashboard `200`, telemetría en vivo. El timeout anterior era un firewall cerrado (ingress GCP + iptables del SO para `tcp:443`, ambos abiertos desde entonces). Si vuelves a ver `000`, revisa esas dos capas primero.
