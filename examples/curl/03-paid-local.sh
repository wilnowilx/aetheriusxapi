#!/usr/bin/env bash
set -euo pipefail

# local X-PAYMENT:anything = simulated; live testnet requires real x402 USDC signing (see docs/API.md).
BASE_URL="${AETHERIUS_LOCAL_URL:-http://127.0.0.1:4020}"
printf 'GET %s/v1/email/validate?email=user@example.com (simulated payment)\n' "$BASE_URL"
curl --fail-with-body --silent --show-error --write-out '\nHTTP_STATUS:%{http_code}\n' \
  -H 'X-PAYMENT: anything' \
  "$BASE_URL/v1/email/validate?email=user@example.com"
