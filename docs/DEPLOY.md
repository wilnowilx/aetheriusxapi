# DEPLOY — resurrect aetheriusxAPI anywhere (VM-death survival guide)

If the GCP VM dies, everything needed to rebirth the stack lives in this repo.
Time to live on a fresh Ubuntu/Debian VPS: ~15 minutes.

## Option A — Docker (fastest, any host)

```bash
git clone https://github.com/wilnowilx/aetheriusxapi.git && cd aetheriusxapi
docker build -t aetheriusxapi .
docker run -d --name aetherapi --restart always -p 4020:4020 \
  -e X402_MODE=simulated \
  -v aetherdata:/app/data \
  aetheriusxapi
```

Simulated mode needs no keys. For real USDC verification (`X402_MODE=real`),
install the `x402` SDK into the image and set `AETHERIUS_NETWORK` + facilitator env.

## Option B — systemd (production, mirrors sentinel-v4)

```bash
sudo apt install -y python3-venv nginx certbot python3-certbot-nginx
git clone https://github.com/wilnowilx/aetheriusxapi.git /opt/aetherapi
cd /opt/aetherapi && python3 -m venv venv && venv/bin/pip install -r requirements.txt
```

`/etc/systemd/system/aetherapi.service`:

```ini
[Unit]
Description=AetherAPI - Crypto-native API marketplace
After=network.target

[Service]
Type=simple
User=<your-user>
WorkingDirectory=/opt/aetherapi
ExecStart=/opt/aetherapi/venv/bin/python main.py
Restart=always
RestartSec=5
Environment=PYTHONUNBUFFERED=1
Environment=X402_MODE=real
Environment=AETHERIUS_DB_PATH=/opt/aetherapi/telemetry.db

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload && sudo systemctl enable --now aetherapi
```

## Nginx + TLS

Proxy `/aetherapi/` → `127.0.0.1:4020/` with `proxy_read_timeout 90s`.
For HTTPS without a domain, use `<ip-with-dashes>.sslip.io` + certbot:

```bash
sudo certbot certonly --nginx -d <dashes-ip>.sslip.io --agree-tos -m you@mail.com
```

Add a `443 ssl` server block with those certs (see `docs/VM-ACCESS.md`).
Open firewall ingress `tcp:443` (GCP rule) **and** OS `iptables -I INPUT -p tcp
--dport 443 -j ACCEPT` + `netfilter-persistent save` (both layers blocked us once).

## Env reference

| Var | Default | Purpose |
|-----|---------|---------|
| `X402_MODE` | `simulated` | `real` = on-chain USDC verify (needs x402 SDK) |
| `AETHERIUS_NETWORK` | `eip155:84532` | Base Sepolia; mainnet `eip155:8453` |
| `AETHERIUS_WALLET` | team wallet | USDC destination |
| `AETHERIUS_DB_PATH` | unset (memory) | SQLite telemetry persistence |
| `ETHERSCAN_API_KEY` | unset | unlocks `/v1/token/holders` |
| `CORS_ORIGINS` | Pages + localhost | comma-separated browser origins |
| `PORT` | `4020` | listen port |

## Telemetry continuity

`telemetry.db` holds cumulative counters/volume. Back it up before migrations:
`sqlite3 /opt/aetherapi/telemetry.db .backup backup.db`.
Public snapshots for grants: `GET /v1/telemetry` → save to `docs/metrics/`.
