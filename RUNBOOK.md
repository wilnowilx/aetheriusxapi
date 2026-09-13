# AETHERIUS SYSTEM RECOVERY RUNBOOK

**Version:** 1.0 | **Network:** Base Mainnet (eip155:8453) | **Last Updated:** 2026-09-13
**Primary Endpoint:** `https://34-156-149-38.sslip.io/aetherapi`
**Wallet:** `0x677B483128D0399bCD0A5AB36eE990C0246d7f61`

---

## 🚀 QUICK START — Verify System Live (3 Commands)

Run these in order. All must return `200 OK` or healthy JSON within 10 seconds.

```bash
# 1. Health check — API gateway
curl -sf https://34-156-149-38.sslip.io/aetherapi/health | jq '.status == "healthy"'

# 2. Base RPC connectivity — confirm chain sync
curl -sf -X POST https://34-156-149-38.sslip.io/aetherapi/rpc \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' | jq '.result'

# 3. Anchor verification — confirm latest Base anchor on-chain
curl -sf https://34-156-149-38.sslip.io/aetherapi/anchors/latest | jq '.anchor.blockNumber > 0'
```

**Expected:** All three return truthy. If any fails → proceed to FAILURE SCENARIOS.

---

## 🗺️ DAEMON MAP — What Runs Where

| Service | Host | Port | Process Manager | Dependencies | Health Endpoint |
|---------|------|------|-----------------|--------------|-----------------|
| **aetherapi-gateway** | `34-156-149-38` | 443 (HTTPS) | systemd (`aetherapi-gateway.service`) | nginx, certbot | `/health` |
| **aetherapi-rpc** | `34-156-149-38` | 8545 (internal) | systemd (`aetherapi-rpc.service`) | Erigon/Nethermind | `/health` |
| **aetherapi-anchor-indexer** | `34-156-149-38` | 8080 | systemd (`aetherapi-anchor-indexer.service`) | PostgreSQL, Base RPC | `/health` |
| **aetherapi-cdp-worker** | `34-156-149-38` | 8081 | systemd (`aetherapi-cdp-worker.service`) | Redis, CDP API keys | `/health` |
| **aetherapi-telemetry** | `34-156-149-38` | 9090 | systemd (`aetherapi-telemetry.service`) | Prometheus, Grafana | `/metrics` |
| **aetherapi-nonce-manager** | `34-156-149-38` | 8082 | systemd (`aetherapi-nonce-manager.service`) | Redis, Base RPC | `/health` |
| **aetherapi-circuit-breaker** | `34-156-149-38` | 8083 | systemd (`aetherapi-circuit-breaker.service`) | Redis | `/health` |

### Service Commands (run on `34-156-149-38`)

```bash
# Status all
systemctl status aetherapi-gateway aetherapi-rpc aetherapi-anchor-indexer aetherapi-cdp-worker aetherapi-telemetry aetherapi-nonce-manager aetherapi-circuit-breaker

# Logs (last 100 lines)
journalctl -u aetherapi-gateway -n 100 --no-pager
journalctl -u aetherapi-rpc -n 100 --no-pager
journalctl -u aetherapi-anchor-indexer -n 100 --no-pager
journalctl -u aetherapi-cdp-worker -n 100 --no-pager
journalctl -u aetherapi-nonce-manager -n 100 --no-pager
journalctl -u aetherapi-circuit-breaker -n 100 --no-pager

# Restart single service
systemctl restart aetherapi-gateway
systemctl restart aetherapi-rpc
systemctl restart aetherapi-anchor-indexer
systemctl restart aetherapi-cdp-worker
systemctl restart aetherapi-nonce-manager
systemctl restart aetherapi-circuit-breaker
```

### Port Map (Internal)

```
443    → nginx → aetherapi-gateway (TLS termination)
8545   → aetherapi-rpc (Base JSON-RPC proxy)
8080   → aetherapi-anchor-indexer (anchor ingestion)
8081   → aetherapi-cdp-worker (Coinbase CDP operations)
8082   → aetherapi-nonce-manager (nonce sequencing)
8083   → aetherapi-circuit-breaker (rate limit / breaker state)
9090   → aetherapi-telemetry (Prometheus metrics)
5432   → PostgreSQL (anchor metadata, telemetry)
6379   → Redis (nonce state, circuit breaker, CDP queue)
```

---

## ⚠️ FAILURE SCENARIOS — Top 5

| # | Scenario | Detection | Impact | Auto-Recovery |
|---|----------|-----------|--------|---------------|
| 1 | **VM Down** | Health checks fail, SSH timeout | Total outage | None — manual intervention |
| 2 | **CDP Down** | `/health` returns `cdp: "degraded"`, worker logs show 429/5xx | No wallet ops, no signing | Circuit breaker opens after 5 failures |
| 3 | **Nonce Collision** | `nonce-manager` logs `DUPLICATE_NONCE`, tx rejected by Base | Stuck transactions, failed sends | Nonce manager re-syncs from chain |
| 4 | **Upstream Rate Limit** | Base RPC returns 429, `circuit-breaker` state `OPEN` | All read/write RPC blocked | Exponential backoff, breaker closes after 60s |
| 5 | **Circuit Breaker Triggered** | `/health` shows `circuit_breaker: "open"` | All downstream calls fail fast | Auto-close after `reset_timeout` (default 60s) |

---

## 🔧 RECOVERY PROCEDURES — Step-by-Step

### SCENARIO 1: VM Down (Complete Host Failure)

**Detection:**
```bash
# From your workstation
ssh -o ConnectTimeout=5 ubuntu@34-156-149-38 "echo ok" || echo "VM UNREACHABLE"
curl -sf --max-time 5 https://34-156-149-38.sslip.io/aetherapi/health || echo "API DOWN"
```

**Recovery:**
```bash
# 1. Check cloud provider console (GCP/AWS/Azure) — verify instance state
# 2. If stopped: start instance
gcloud compute instances start aetherapi-vm --zone=us-central1-a
# OR
aws ec2 start-instances --instance-ids i-xxxxxxxxxxxxxxxxx

# 3. Wait for SSH + cloud-init (2-3 min)
sleep 180

# 4. Verify services auto-started
ssh ubuntu@34-156-149-38 "systemctl is-active aetherapi-gateway aetherapi-rpc aetherapi-anchor-indexer aetherapi-cdp-worker aetherapi-nonce-manager aetherapi-circuit-breaker"

# 5. Run QUICK START verification
curl -sf https://34-156-149-38.sslip.io/aetherapi/health | jq '.status'
curl -sf -X POST https://34-156-149-38.sslip.io/aetherapi/rpc -H "Content-Type: application/json" -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' | jq '.result'
curl -sf https://34-156-149-38.sslip.io/aetherapi/anchors/latest | jq '.anchor.blockNumber'

# 6. If services failed: restart all
ssh ubuntu@34-156-149-38 "sudo systemctl restart aetherapi-gateway aetherapi-rpc aetherapi-anchor-indexer aetherapi-cdp-worker aetherapi-nonce-manager aetherapi-circuit-breaker"

# 7. Post-recovery: verify telemetry
curl -sf https://34-156-149-38.sslip.io:9090/metrics | head -20
```

---

### SCENARIO 2: CDP Down (Coinbase CDP API Unavailable)

**Detection:**
```bash
# Check CDP worker health
curl -sf https://34-156-149-38.sslip.io/aetherapi/cdp/health | jq '.'

# Check logs for CDP errors
ssh ubuntu@34-156-149-38 "journalctl -u aetherapi-cdp-worker -n 50 --no-pager | grep -i 'cdp\\|coinbase\\|429\\|500\\|502\\|503\\|timeout'"
```

**Recovery:**
```bash
# 1. Verify CDP API status page: https://status.coinbase.com/
# 2. Check API keys are valid (rotate if compromised)
ssh ubuntu@34-156-149-38 "cat /etc/aetherapi/cdp.env | grep -E 'CDP_API_KEY|CDP_API_SECRET'"

# 3. Restart CDP worker (clears connection pools)
ssh ubuntu@34-156-149-38 "sudo systemctl restart aetherapi-cdp-worker"

# 4. Wait for healthy
sleep 10
curl -sf https://34-156-149-38.sslip.io/aetherapi/cdp/health | jq '.status == "healthy"'

# 5. If still failing: check circuit breaker state
curl -sf https://34-156-149-38.sslip.io:8083/health | jq '.circuit_breaker'

# 6. Force close breaker if stuck open
ssh ubuntu@34-156-149-38 "curl -X POST http://localhost:8083/admin/breaker/reset"

# 7. Verify wallet operations work
curl -sf -X POST https://34-156-149-38.sslip.io/aetherapi/wallet/balance \
  -H "Content-Type: application/json" \
  -d '{"address":"0x677B483128D0399bCD0A5AB36eE990C0246d7f61"}' | jq '.'
```

---

### SCENARIO 3: Nonce Collision (Duplicate/Stuck Nonce)

**Detection:**
```bash
# Check nonce manager health
curl -sf https://34-156-149-38.sslip.io:8082/health | jq '.'

# Check logs for collision
ssh ubuntu@34-156-149-38 "journalctl -u aetherapi-nonce-manager -n 100 --no-pager | grep -i 'duplicate\\|collision\\|stuck\\|gap'"

# Verify on-chain nonce for wallet
curl -sf -X POST https://34-156-149-38.sslip.io/aetherapi/rpc \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_getTransactionCount","params":["0x677B483128D0399bCD0A5AB36eE990C0246d7f61","latest"],"id":1}' | jq '.result'
```

**Recovery:**
```bash
# 1. Get current on-chain nonce (source of truth)
ONCHAIN_NONCE=$(curl -sf -X POST https://34-156-149-38.sslip.io/aetherapi/rpc \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_getTransactionCount","params":["0x677B483128D0399bCD0A5AB36eE990C0246d7f61","latest"],"id":1}' | jq -r '.result' | xargs printf "%d\n")

echo "On-chain nonce: $ONCHAIN_NONCE"

# 2. Force nonce manager resync to on-chain value
ssh ubuntu@34-156-149-38 "curl -X POST http://localhost:8082/admin/nonce/resync -H 'Content-Type: application/json' -d '{\"address\":\"0x677B483128D0399bCD0A5AB36eE990C0246d7f61\",\"nonce\":'$ONCHAIN_NONCE'}'"

# 3. Restart nonce manager to clear any in-memory state
ssh ubuntu@34-156-149-38 "sudo systemctl restart aetherapi-nonce-manager"

# 4. Verify resync
sleep 5
curl -sf https://34-156-149-38.sslip.io:8082/nonce/0x677B483128D0399bCD0A5AB36eE990C0246d7f61 | jq '.nonce == '$ONCHAIN_NONCE

# 5. Test transaction submission
curl -sf -X POST https://34-156-149-38.sslip.io/aetherapi/tx/send \
  -H "Content-Type: application/json" \
  -d '{"from":"0x677B483128D0399bCD0A5AB36eE990C0246d7f61","to":"0x0000000000000000000000000000000000000000","value":"0x0","data":"0x"}' | jq '.txHash'
```

---

### SCENARIO 4: Upstream Rate Limit (Base RPC 429)

**Detection:**
```bash
# Check RPC health
curl -sf https://34-156-149-38.sslip.io/aetherapi/rpc/health | jq '.'

# Check circuit breaker state
curl -sf https://34-156-149-38.sslip.io:8083/health | jq '.circuit_breaker'

# Check logs for 429
ssh ubuntu@34-156-149-38 "journalctl -u aetherapi-rpc -n 100 --no-pager | grep -i '429\\|rate.limit\\|too.many.requests'"
```

**Recovery:**
```bash
# 1. Check Base RPC provider status (Alchemy/QuickNode/Infura dashboard)
# 2. Verify we're not exceeding plan limits

# 3. Force circuit breaker closed (if stuck open)
ssh ubuntu@34-156-149-38 "curl -X POST http://localhost:8083/admin/breaker/close"

# 4. Restart RPC proxy to reset connection pools
ssh ubuntu@34-156-149-38 "sudo systemctl restart aetherapi-rpc"

# 5. Wait for backoff to clear
sleep 30

# 6. Verify RPC responsive
curl -sf -X POST https://34-156-149-38.sslip.io/aetherapi/rpc \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' | jq '.result'

# 7. Check breaker state = closed
curl -sf https://34-156-149-38.sslip.io:8083/health | jq '.circuit_breaker.state == "closed"'
```

---

### SCENARIO 5: Circuit Breaker Triggered (Downstream Protection Active)

**Detection:**
```bash
# Check breaker state
curl -sf https://34-156-149-38.sslip.io:8083/health | jq '.circuit_breaker'

# Check which service tripped it
curl -sf https://34-156-149-38.sslip.io:8083/admin/breaker/status | jq '.'
```

**Recovery:**
```bash
# 1. Identify root cause from breaker status output
#    - "rpc": Base RPC failing
#    - "cdp": CDP API failing
#    - "anchor": Indexer failing

# 2. Fix root cause first (see Scenarios 2, 3, 4 above)

# 3. Then force close breaker
ssh ubuntu@34-156-149-38 "curl -X POST http://localhost:8083/admin/breaker/close"

# 4. Verify closed
curl -sf https://34-156-149-38.sslip.io:8083/health | jq '.circuit_breaker.state == "closed"'

# 5. Run full health check
curl -sf https://34-156-149-38.sslip.io/aetherapi/health | jq '.status == "healthy"'
```

---

## ⚓ ANCHOR VERIFICATION — Verify Base Anchors On-Chain

Anchors are Merkle roots committed to Base Mainnet. Verify integrity:

```bash
# 1. Get latest anchor from API
ANCHOR=$(curl -sf https://34-156-149-38.sslip.io/aetherapi/anchors/latest | jq -r '.anchor')
echo "$ANCHOR" | jq '.'

# 2. Extract fields
BLOCK_NUM=$(echo "$ANCHOR" | jq -r '.blockNumber')
TX_HASH=$(echo "$ANCHOR" | jq -r '.transactionHash')
MERKLE_ROOT=$(echo "$ANCHOR" | jq -r '.merkleRoot')
BLOCK_TIMESTAMP=$(echo "$ANCHOR" | jq -r '.timestamp')

echo "Block: $BLOCK_NUM"
echo "Tx: $TX_HASH"
echo "Merkle Root: $MERKLE_ROOT"
echo "Timestamp: $BLOCK_TIMESTAMP"

# 3. Verify on BaseScan (manual) or via RPC
# RPC verification:
curl -sf -X POST https://34-156-149-38.sslip.io/aetherapi/rpc \
  -H "Content-Type: application/json" \
  -d "{\"jsonrpc\":\"2.0\",\"method\":\"eth_getTransactionByHash\",\"params\":[\"$TX_HASH\"],\"id\":1}" | jq '.result'

# 4. Verify block exists and is finalized (2+ confirmations)
LATEST_BLOCK=$(curl -sf -X POST https://34-156-149-38.sslip.io/aetherapi/rpc \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' | jq -r '.result' | xargs printf "%d\n")

CONFIRMATIONS=$((LATEST_BLOCK - BLOCK_NUM))
echo "Confirmations: $CONFIRMATIONS"

if [ $CONFIRMATIONS -ge 2 ]; then
  echo "✅ Anchor verified: $CONFIRMATIONS confirmations"
else
  echo "⚠️ Anchor not yet finalized: only $CONFIRMATIONS confirmations"
fi

# 5. Verify merkle root matches stored data (if you have the data)
#    Requires access to the original dataset that was anchored
```

**Automated verification script** (save as `verify-anchor.sh`):
```bash
#!/bin/bash
set -euo pipefail
API="https://34-156-149-38.sslip.io/aetherapi"
ANCHOR=$(curl -sf "$API/anchors/latest" | jq -r '.anchor')
BLOCK_NUM=$(echo "$ANCHOR" | jq -r '.blockNumber')
TX_HASH=$(echo "$ANCHOR" | jq -r '.transactionHash')
MERKLE_ROOT=$(echo "$ANCHOR" | jq -r '.merkleRoot')

LATEST=$(curl -sf -X POST "$API/rpc" -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' | jq -r '.result' | xargs printf "%d\n")

CONF=$((LATEST - BLOCK_NUM))
TX=$(curl -sf -X POST "$API/rpc" -H "Content-Type: application/json" \
  -d "{\"jsonrpc\":\"2.0\",\"method\":\"eth_getTransactionByHash\",\"params\":[\"$TX_HASH\"],\"id\":1}" | jq -r '.result')

if [ "$CONF" -ge 2 ] && [ "$TX" != "null" ]; then
  echo "✅ Anchor VERIFIED: block=$BLOCK_NUM, tx=$TX_HASH, conf=$CONF"
  exit 0
else
  echo "❌ Anchor FAILED: block=$BLOCK_NUM, tx=$TX_HASH, conf=$CONF"
  exit 1
fi
```

---

## 📞 CONTACTS / ESCALATION

| Role | Contact | When to Escalate |
|------|---------|------------------|
| **Primary On-Call** | Telegram: `@aetherius_oncall` | Any SEV-1 (total outage > 5 min) |
| **Secondary On-Call** | Telegram: `@aetherius_backup` | Primary unresponsive > 10 min |
| **Engineering Lead** | GitHub: `@aetherius-lead` | Architecture decisions, rollback approval |
| **Security/Incident** | Telegram: `@aetherius_security` | Suspected exploit, key compromise, unusual wallet activity |
| **Wallet Ops** | Wallet: `0x677B483128D0399bCD0A5AB36eE990C0246d7f61` | Fund recovery, emergency withdrawal |

### Escalation Timeline

```
T+0min    → Incident detected (alert fires)
T+2min    → Primary on-call acknowledged
T+5min    → SEV-1 declared if unresolved → Page secondary
T+10min   → Engineering lead engaged
T+15min   → Security engaged if wallet/key involvement suspected
T+30min   → External support (Base, CDP, cloud provider) engaged
```

### Emergency Commands (Run by On-Call Only)

```bash
# Emergency wallet sweep (move funds to cold storage)
# REQUIRES: Hardware wallet, multi-sig approval
# DO NOT RUN WITHOUT SECURITY TEAM APPROVAL
# cast send --rpc-url https://34-156-149-38.sslip.io/aetherapi/rpc \
#   --private-key $COLD_STORAGE_KEY \
#   0x677B483128D0399bCD0A5AB36eE990C0246d7f61 \
#   "sweep(uint256)" 0

# Emergency circuit breaker override (nuclear option)
ssh ubuntu@34-156-149-38 "curl -X POST http://localhost:8083/admin/breaker/force-close-all"

# Emergency service kill (stop all aetherapi services)
ssh ubuntu@34-156-149-38 "sudo systemctl stop aetherapi-gateway aetherapi-rpc aetherapi-anchor-indexer aetherapi-cdp-worker aetherapi-nonce-manager aetherapi-circuit-breaker"
```

---

## 🔄 ROLLBACK PROCEDURE — Git Tag + Systemd Restart

Use when a bad deploy causes regression. Rolls back code AND restarts services.

```bash
# 1. SSH to production
ssh ubuntu@34-156-149-38

# 2. List recent tags (find known-good version)
git tag -l "v*" --sort=-v:refname | head -10

# 3. Identify target tag (e.g., v1.2.3)
TARGET_TAG="v1.2.3"  # CHANGE THIS

# 4. Fetch and checkout
git fetch origin --tags
git checkout "$TARGET_TAG"

# 5. Rebuild (if using compiled language) or ensure dependencies
# For Go/Rust:
# make build
# For Node/Python:
# npm ci / pip install -r requirements.txt

# 6. Run database migrations (if any) — DOWN migrations only if needed
# ./migrate down  # CAREFUL: only if schema changed

# 7. Restart ALL services in dependency order
sudo systemctl restart postgresql redis
sleep 5
sudo systemctl restart aetherapi-rpc
sleep 3
sudo systemctl restart aetherapi-anchor-indexer aetherapi-nonce-manager aetherapi-circuit-breaker
sleep 3
sudo systemctl restart aetherapi-cdp-worker
sleep 3
sudo systemctl restart aetherapi-gateway
sleep 3
sudo systemctl restart aetherapi-telemetry

# 8. Verify rollback
curl -sf https://34-156-149-38.sslip.io/aetherapi/health | jq '.version == "'$TARGET_TAG'"'
curl -sf https://34-156-149-38.sslip.io/aetherapi/health | jq '.status == "healthy"'

# 9. Run QUICK START verification
curl -sf https://34-156-149-38.sslip.io/aetherapi/health | jq '.status'
curl -sf -X POST https://34-156-149-38.sslip.io/aetherapi/rpc -H "Content-Type: application/json" -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' | jq '.result'
curl -sf https://34-156-149-38.sslip.io/aetherapi/anchors/latest | jq '.anchor.blockNumber > 0'

# 10. Tag rollback for audit
git tag "rollback-$(date +%Y%m%d-%H%M%S)-from-$TARGET_TAG"
git push origin "rollback-$(date +%Y%m%d-%H%M%S)-from-$TARGET_TAG"
```

### Rollback Verification Checklist

- [ ] All 7 services `active (running)`
- [ ] `/health` returns `{"status":"healthy","version":"<target_tag>"}`
- [ ] RPC returns current block number
- [ ] Anchor indexer shows latest block > 0
- [ ] CDP worker shows `healthy`
- [ ] Nonce manager returns correct on-chain nonce
- [ ] Circuit breaker state = `closed`
- [ ] Telemetry metrics flowing to Grafana
- [ ] Wallet balance query works

---

## 📋 APPENDIX — Useful One-Liners

```bash
# Full system status one-liner
ssh ubuntu@34-156-149-38 "systemctl list-units 'aetherapi*' --state=active --no-legend | awk '{print \$1, \$3, \$4}'"

# Tail all aetherapi logs
ssh ubuntu@34-156-149-38 "journalctl -u 'aetherapi*' -f --no-pager"

# Check disk space
ssh ubuntu@34-156-149-38 "df -h /"

# Check memory
ssh ubuntu@34-156-149-38 "free -h"

# Check Base sync status
curl -sf -X POST https://34-156-149-38.sslip.io/aetherapi/rpc -H "Content-Type: application/json" -d '{"jsonrpc":"2.0","method":"eth_syncing","params":[],"id":1}' | jq '.result'

# Force anchor indexer catch-up
ssh ubuntu@34-156-149-38 "curl -X POST http://localhost:8080/admin/indexer/catchup"

# View current config
ssh ubuntu@34-156-149-38 "cat /etc/aetherapi/*.env 2>/dev/null | grep -v '^#' | grep -v '^$'"
```

---

**END OF RUNBOOK**

*Keep this file in repo root. Update on every deploy. Test quarterly.*