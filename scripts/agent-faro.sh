#!/usr/bin/env bash
# Agent Faro wrapper — cron-safe
# Runs: python3 /opt/aetherapi/agent_faro.py --once
# Logs: /opt/aetherapi/agent_faro.log + stdout (captured by cron)
set -euo pipefail
DIR="$(cd "$(dirname "$0")/.." && pwd)"
if [ -f "/opt/aetherapi/agent_faro.py" ]; then
  DIR="/opt/aetherapi"
fi
API_URL="${AETHERIUS_API_URL:-https://34-156-149-38.sslip.io/aetherapi}"
export AETHERIUS_API_URL="$API_URL"
LOG="$DIR/agent_faro.log"

# Ensure httpx available
if ! python3 -c "import httpx" 2>/dev/null; then
  pip install -q httpx || pip3 install -q httpx || true
fi

exec python3 "$DIR/agent_faro.py" --once >>"$LOG" 2>&1
