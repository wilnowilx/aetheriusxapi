# VM Access — sentinel-v4 (SAFE version, no secrets)

> ⛔ NEVER commit private keys, wallet keys, API secrets or `.env` files.
> This repo is PUBLIC. Bots harvest committed keys in minutes.
> The checklist at the bottom of this file is enforced by `.gitignore`.

## What Copilot / any contributor can see WITHOUT ssh (preferred)

Everything observable is already public HTTP — no credentials needed:

| What | URL |
|------|-----|
| Live API docs (OpenAPI/Swagger) | `http://34.156.149.38/aetherapi/docs` |
| Health (version, mode, prices) | `http://34.156.149.38/aetherapi/api/v1/health` |
| Real telemetry (uptime, volume, events) | `http://34.156.149.38/aetherapi/v1/telemetry` |
| Dashboard | `http://34.156.149.38/aetherapi/dashboard/` |
| Landing | https://wilnowilx.github.io/aetheriusxapi/ |

## HTTPS (for GitHub Pages → VM live calls)

Browsers block HTTPS pages calling HTTP APIs (mixed content). The VM has a
valid Let's Encrypt cert for `34-156-149-38.sslip.io` (nginx `aetherapi-ssl.conf`):

- `https://34-156-149-38.sslip.io/aetherapi/api/v1/health`
- `https://34-156-149-38.sslip.io/aetherapi/dashboard/` ← set this as the
  dashboard Backend URL when served from GitHub Pages.

**Requires GCP firewall ingress tcp:443** (VPC → Firewall → allow `0.0.0.0/0`).
Without it, external HTTPS times out (TLS itself is verified working via loopback).
CORS already allows `https://wilnowilx.github.io` (see `CORS_ORIGINS` in `main.py`).

Contract source of truth: `docs/API.md` + `main.py` + `telemetry.py` in this repo.

## SSH access (maintainers only, via Codespaces secret)

Separation of duties: **Opencode** owns backend/VM/deploy. **Copilot** owns
frontend/docs. SSH is only needed for deploy-level work.

1. Repo owner adds the VM private key as a Codespaces secret:
   GitHub → repo Settings → Secrets → Codespaces → New secret
   Name: `SENTINEL_SSH_KEY` (paste the private key content there — it stays
   encrypted and NEVER touches git).
2. In the Codespace, materialize it once per session:
   ```bash
   mkdir -p ~/.ssh && chmod 700 ~/.ssh
   printenv SENTINEL_SSH_KEY > ~/.ssh/sentinel-v4 && chmod 600 ~/.ssh/sentinel-v4
   ```
3. Add this host block to `~/.ssh/config` (values from the maintainer, never committed):
   ```
   Host sentinel-v4
       HostName <vm-ip-from-maintainer>
       User <vm-user-from-maintainer>
       IdentityFile ~/.ssh/sentinel-v4
       StrictHostKeyChecking accept-new
   ```
4. Connect: `ssh sentinel-v4`. Service: `sudo systemctl status aetherapi`.
   App dir: `/opt/aetherapi`. Deploy = pull this repo + copy `main.py`,
   `telemetry.py`, `x402_middleware.py`, `dashboard/` + `systemctl restart`.

## NEVER commit

- `~/.ssh/*`, `*.pem`, `id_rsa`, `id_ed25519` (any private key)
- Wallet private keys, seed phrases
- Coinbase CDP API secrets, exchange API secrets
- `.env` files, `*_SECRET*`, `*_TOKEN*` values
- Service-account JSONs (`*-key.json`)

If a secret ever lands in git history: rotate it immediately (key committed =
key compromised), then purge history. Prevention (`.gitignore`) is not cleanup.
