# Runbooks (2 a.m. pages)

> Scope: safe steps only — checks, links, commands, rollback. No history
> lessons, no secrets. If a step needs a credential, it names the vault/secret,
> never the value.

**Status:** Active · **Owner:** maintainers · **Review:** monthly + after any
incident where responders asked *"where is this documented?"*

Conventions: `LIVE=https://34-156-149-38.sslip.io/aetherapi`.
Service unit: `aetherapi.service`. All VM commands run as the deploy user
with sudo where marked.

## R1 — API down / 5xx

1. Check: `curl -sk $LIVE/health` → expect 200 + version.
2. Check: `curl -sk $LIVE/v1/telemetry` → expect counters shape.
3. On VM: `sudo systemctl status aetherapi` → if failed,
   `sudo journalctl -u aetherapi -n 100 --no-pager` (read the traceback first).
4. Restart: `sudo systemctl restart aetherapi` → wait 10s → repeat step 1.
5. If nginx-level: `sudo systemctl status nginx` → `sudo nginx -t` →
   `sudo systemctl reload nginx`.
6. Still down → R2 rollback (previous known-good files), then escalate.

## R2 — Deploy / rollback

1. Backend: sync reviewed files per `docs/DEPLOY.md`, then
   `sudo systemctl restart aetherapi`.
2. Frontend: `cd frontend && npm run build`, copy `dist/` bundles to Pages
   paths, push `main`, wait for Pages build.
3. Verify (all three, in order): `/health` 200 · free route
   (`/v1/x402/base-stats`) 200 · paid route without payment **402**.
4. Rollback = re-push previous commit for frontend; restore previous backend
   files + restart. Verify step 3 again.

## R3 — TLS / certs

1. Check expiry from outside (browser padlock or SSL checker endpoint).
2. On VM: `sudo certbot renew --dry-run` → real renew only if < 30 days.
3. `sudo systemctl reload nginx` → verify `https://` + security headers.

## R4 — Abuse / traffic spike

1. `sudo fail2ban-client status` → banned IPs per jail (`sshd`,
   `nginx-http-auth`, `nginx-limit-req`, `nginx-botsearch`).
2. Unban only with cause: `sudo fail2ban-client set <jail> unbanip <ip>`.
3. Rate limiting lives in nginx (30 req/s zone) — sustained 503s mean tune
   the zone, not disable it.

## R5 — Telemetry looks wrong

- `totals.calls` flat at 0 → service restarted recently (counters are
  SQLite-persisted; check `uptime_s`) or traffic truly zero.
- `errors` climbing → correlate with `journalctl` timestamps first.
- `avg_latency_ms` spike → usually upstream throttling (429s), not our code —
  confirm via direct upstream check before changing anything.
- `wallets_seen: 0` with `challenges_402 > 0` → agents hitting 402 but not
  settling; expected in simulated mode, investigate only if sudden change.
