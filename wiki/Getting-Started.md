# Getting Started (maintainer path)

> Scope: running the full stack locally for development. For the 5-minute
> agent quickstart, see `README → Quick Start`. For endpoint shapes, see
> `docs/API.md`. This page is the *maintainer* setup: exact tools, commands,
> and the errors everyone hits once.

**Status:** Active · **Owner:** maintainers · **Review:** on toolchain change.

## Prerequisites

- Python ≥ 3.10, Node ≥ 18, Git, Docker (optional but recommended)
- No API keys needed for any upstream (OpenStreetMap, CoinGecko free,
  DefiLlama, Open-Meteo, Frankfurter — all keyless by design)

## Backend (FastAPI, port 4020)

```bash
git clone https://github.com/wilnowilx/aetheriusxapi.git
cd aetheriusxapi
pip install -r requirements.txt
uvicorn main:app --reload --port 4020
# open http://127.0.0.1:4020/dashboard/
```

Verify: `GET /health` → 200, no headers. `GET /v1/telemetry` → counters shape.
Paid route without `X-PAYMENT` → **402** with x402 body. Same route with
`X-PAYMENT: <anything-non-empty>` (simulated mode) → **200** + data.

## Frontend (React 19 + R3F, Vite)

```bash
cd frontend && npm install && npm run dev     # dev server
npm run build                                  # → dist/
cp dist/assets/* ../assets/ && cp dist/index.html ../index.html   # Pages deploy
```

## Tests

```bash
pytest -q
```

39 tests: deterministic gates (402 shape, 400s, legacy prefix, settlement
header, telemetry accounting, TOCTOU anti-replay) + live-shape checks
(tolerant to upstream outages — they assert *our stack executed*, not the
upstream's mood).

## Common local errors

| Symptom | Cause → Fix |
|---|---|
| `ModuleNotFoundError: fastapi` | venv inactive or deps missing → `pip install -r requirements.txt` |
| `pytest` collection error | same as above — install dev deps first |
| Port 4020 in use | another uvicorn → `lsof -i :4020`, kill, retry |
| Landing shows loader forever | `assets/` bundles stale → rebuild per Frontend section |
| 402 on a FREE route (`/v1/x402/*`) | regression — free routes must bypass middleware; open an issue |
| CoinGecko 429s locally | datacenter-IP throttling, expected → multi-source fallbacks engage; not a bug in our code |
