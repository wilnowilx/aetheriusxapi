# Point the Pages Dashboard at the Live API

The dashboard can be hosted as static files on GitHub Pages while the API runs on GCP. In this setup, the browser needs the public backend URL:

```text
https://34-156-149-38.sslip.io/aetherapi
```

## Configure the Backend bar

1. Open the Pages dashboard: `https://wilnowilx.github.io/aetheriusxapi/dashboard/`.
2. Find the **Backend** bar at the top of the dashboard.
3. Enter `https://34-156-149-38.sslip.io/aetherapi` as the backend base URL.
4. Apply or save the value.
5. Use **Health**, then select an endpoint in the explorer.
6. Confirm that the dashboard requests appear under the HTTPS backend URL, not under `wilnowilx.github.io`.

The dashboard should then call paths such as:

```text
https://34-156-149-38.sslip.io/aetherapi/health
https://34-156-149-38.sslip.io/aetherapi/v1/telemetry
```

## Why CORS matters

The dashboard and API have different origins:

- Pages: `https://wilnowilx.github.io`
- API: `https://34-156-149-38.sslip.io`

A browser enforces the same-origin policy. The API must therefore allow the Pages origin with CORS, including the headers used by x402. A failed CORS configuration often looks like a network error in the dashboard even though `curl` reaches the API successfully.

The backend should allow the exact production origin, for example:

```text
https://wilnowilx.github.io
```

Avoid using `*` when credentials or wallet-related headers are involved. Keep the allowed methods and headers explicit, including `X-PAYMENT` and the relevant x402 response headers.

## Why mixed content matters

GitHub Pages is HTTPS. A browser will block requests from that page to an HTTP API such as `http://34.156.149.38/aetherapi`. This is mixed content: a secure page trying to load an insecure resource.

Use the HTTPS URL with the `sslip.io` hostname:

```text
https://34-156-149-38.sslip.io/aetherapi
```

The hostname maps the IP address while allowing the browser to use HTTPS. The certificate and reverse proxy on GCP must be valid and correctly configured for this hostname.

## Quick checks

Run these from a terminal:

```bash
curl -i "https://wilnowilx.github.io/aetheriusxapi/dashboard/"
curl -i "https://34-156-149-38.sslip.io/aetherapi/health"
curl -i -X OPTIONS \
  -H "Origin: https://wilnowilx.github.io" \
  -H "Access-Control-Request-Method: GET" \
  "https://34-156-149-38.sslip.io/aetherapi/health"
```

Expected state after deployment: the first two should return `200`, and the preflight should include an `Access-Control-Allow-Origin` value matching the Pages origin. Observed on 2026-09-03: Pages returned `200`, while the HTTPS backend health check and CORS preflight timed out (`curl` status `000`). The dashboard cannot display live data until the reverse proxy, certificate, network access, and CORS policy are active.
