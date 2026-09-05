# 🚀 MAINNET DEPLOY — MANUAL COMMANDS

## How to deploy:

### Option 1: Google Cloud Console (Recommended)
1. Go to: https://console.cloud.google.com/compute/instances
2. Click on **sentinel-v4** → Click **SSH** (opens browser terminal)
3. Copy and paste the commands below

### Option 2: Fix SSH first
```bash
# Generate new SSH key
ssh-keygen -t ed25519 -f ~/.ssh/id_ed25519 -N ""

# Show public key
cat ~/.ssh/id_ed25519.pub

# Add to Google Cloud VM:
# Console > Compute Engine > VM instances > sentinel-v4 > Edit > SSH Keys > Add
```

---

## DEPLOY COMMANDS (copy-paste to SSH):

```bash
# Step 1: Navigate to project
cd /opt/aetherapi

# Step 2: Install x402 SDK
pip3 install x402

# Step 3: Update systemd service for mainnet
sudo tee /etc/systemd/system/aetherapi.service > /dev/null << 'EOF'
[Unit]
Description=aetheriusxAPI - Crypto-native API marketplace (MAINNET)
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/opt/aetherapi
Environment=X402_MODE=real
Environment=AETHERIUS_NETWORK=eip155:8453
Environment=AETHERIUS_WALLET=0x677B483128D0399bCD0A5AB36eE990C0246d7f61
Environment=ETHERSCAN_API_KEY=24RDI25PE7AGVZ12XGGU959T3JA7IE29ME
Environment=PORT=4020
Environment=PYTHONUNBUFFERED=1
Environment=CORS_ORIGINS=https://wilnowilx.github.io,http://127.0.0.1:4020,http://localhost:4020
ExecStart=/usr/bin/python3 -m uvicorn main:app --host 0.0.0.0 --port 4020
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

# Step 4: Restart service
sudo systemctl daemon-reload
sudo systemctl restart aetherapi

# Step 5: Wait and verify
sleep 5
curl http://localhost:4020/health
```

---

## VERIFY MAINNET:

```bash
# Check if mode is "real"
curl -s http://localhost:4020/health | grep '"mode"'

# Should show: "mode": "real"

# Check full health
curl http://localhost:4020/health | python3 -m json.tool
```

---

## TROUBLESHOOT:

```bash
# View service logs
sudo journalctl -u aetherapi -f

# Check service status
sudo systemctl status aetherapi

# Restart if needed
sudo systemctl restart aetherapi
```

---

## EXPECTED RESULT:

```json
{
  "status": "alive",
  "service": "aetheriusxAPI",
  "version": "2.0.0",
  "mode": "real",
  "network": "eip155:8453",
  "currency": "USDC",
  "wallet": "0x677B483128D0399bCD0A5AB36eE990C0246d7f61"
}
```

---

## LIVE ENDPOINTS (after deploy):

- Health: http://34.156.149.38/aetherapi/health
- Telemetry: http://34.156.149.38/aetherapi/v1/telemetry
- Dashboard: https://wilnowilx.github.io/aetheriusxapi/dashboard/
- API Docs: http://34.156.149.38/aetherapi/docs
