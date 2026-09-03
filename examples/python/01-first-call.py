"""Demonstrate x402's 402 challenge followed by a local simulated retry."""

import os

import httpx

BASE_URL = os.getenv("AETHERIUS_LOCAL_URL", "http://127.0.0.1:4020")
ENDPOINT = f"{BASE_URL}/v1/email/validate?email=user@example.com"

# local X-PAYMENT:anything = simulated; live testnet requires real x402 USDC signing (see docs/API.md).
# Standard-library fallback: replace httpx with urllib.request if httpx is unavailable.
with httpx.Client(timeout=10) as client:
    challenge = client.get(ENDPOINT)
    print(f"first request: HTTP {challenge.status_code}")
    print(challenge.json())

    paid = client.get(ENDPOINT, headers={"X-PAYMENT": "anything"})
    print(f"paid retry: HTTP {paid.status_code}")
    print(paid.json())
