#!/usr/bin/env bash
set -euo pipefail

# Live testnet: this 402 contains the real x402 payment requirements.
# local X-PAYMENT:anything = simulated; live testnet requires real x402 USDC signing (see docs/API.md).
BASE_URL="${AETHERIUS_LIVE_URL:-http://34.156.149.38/aetherapi}"
printf 'GET %s/v1/email/validate?email=user@example.com (without payment)\n' "$BASE_URL"
curl --silent --show-error --write-out '\nHTTP_STATUS:%{http_code}\n' \
  "$BASE_URL/v1/email/validate?email=user@example.com"
