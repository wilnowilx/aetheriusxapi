# Dashboard — aetheriusxAPI Control Room

Vanilla HTML/CSS/JS. No build step, no dependencies.

## Run

```bash
uvicorn main:app --reload --port 4020
# open http://127.0.0.1:4020/dashboard/
```

FastAPI mounts this folder via `StaticFiles(directory="dashboard", html=True)`.

## What it does

- **Health panel** — live data from `GET /health` (service, version, mode, network, wallet, endpoint count).
- **API Catalog** — all 11 paid endpoints with prices from `/health`.
- **Explorer** — param forms per endpoint. `Execute (pay)` sends `X-PAYMENT: dashboard-demo`
  (simulated settlement locally, real USDC on the live server). `Show 402` calls without
  the header and renders the payment challenge.
- **Live Metrics** — REAL server telemetry polled every 10s from `/v1/telemetry`:
  uptime, totals, settled USDC volume, wallets seen, latency bars, event feed.
- **Wallet** — memory-only demo connect. Real x402 signing lands with the production client.
- **Storage Drift** — probes `GET /v1/storage/drift`; shows planned payload until Phase 2 ships it.
- **Activity** — client-side log of explorer calls.

## Files

| File | Purpose |
|------|---------|
| `index.html` | Structure |
| `styles.css` | Dark theme (matches landing brand) |
| `app.js` | All logic, same-origin fetch |

## Notes

- Same-origin relative URLs (`../health`, `../v1/...`) work locally and behind nginx (`/aetherapi/`).
- Never stores keys. Never invents server data — demo labels where applicable.
