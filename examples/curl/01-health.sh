#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${AETHERIUS_LIVE_URL:-http://34.156.149.38/aetherapi}"
printf 'GET %s/health\n' "$BASE_URL"
curl --fail-with-body --silent --show-error "$BASE_URL/health"
printf '\n'
