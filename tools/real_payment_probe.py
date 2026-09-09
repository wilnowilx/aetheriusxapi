#!/usr/bin/env python3
"""Real-loop E2E probe — canary route against staging (X402_MODE=real).

v1 (no funds needed): validates the official 402 PaymentRequired shape +
route table + telemetry accounting. Exits non-zero on any mismatch.
v2 (needs TEST_PKEY funded with ~$0.05 USDC on Base): completes payment via
the official x402 client flow and asserts 200 + settlement + volume delta.

Usage:
  python3 tools/real_payment_probe.py --base https://HOST:PORT/aetherapi [--pay]

Env (.env.test, gitignored): TEST_PKEY, TEST_ADDR — dust-only test key.
NEVER point this at main funds. NEVER commit keys.
"""
import argparse
import json
import sys
import urllib.error
import urllib.request

CANARY = "/v1/data/uuid"


def _req(base, path, headers=None):
    r = urllib.request.Request(base + path, headers=headers or {})
    try:
        with urllib.request.urlopen(r, timeout=30) as resp:
            return resp.status, dict(resp.headers), resp.read().decode()
    except urllib.error.HTTPError as e:
        return e.code, dict(e.headers), e.read().decode()


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--base", required=True)
    ap.add_argument("--pay", action="store_true", help="v2: complete payment (needs funds)")
    args = ap.parse_args()

    # 1. Canary without payment MUST 402 with PaymentRequired shape.
    # Official SDK v2 puts it in the `payment-required` header (base64 JSON).
    import base64

    code, headers, body = _req(args.base, CANARY)
    print(f"[1] no-payment -> {code}")
    if code != 402:
        print(f"FAIL: expected 402, got {code}: {body[:300]}")
        return 1
    b64 = headers.get("payment-required") or headers.get("Payment-Required") or ""
    if not b64:
        print(f"FAIL: 402 without payment-required header: {body[:300]}")
        return 1
    chal = json.loads(base64.b64decode(b64).decode())
    accepts = chal.get("accepts", [])
    net = accepts[0].get("network", "") if accepts else ""
    amt = accepts[0].get("amount", "") if accepts else ""
    pay = accepts[0].get("payTo", "") if accepts else ""
    print(f"[2] x402v{chal.get('x402Version')} network={net} amount={amt} payTo={pay[:10]}...")
    if net != "eip155:84532":
        print(f"FAIL: expected Base Sepolia eip155:84532, got {net}")
        return 1

    # 2. Free route still 200 (canary must not break free tier).
    code2, _, _ = _req(args.base, "/v1/x402/base-stats")
    print(f"[3] free route -> {code2}")
    if code2 != 200:
        print("FAIL: free route broken in real mode")
        return 1

    # 3. Telemetry alive.
    code3, _, tb = _req(args.base, "/v1/telemetry")
    print(f"[4] telemetry -> {code3}")
    if code3 != 200:
        print("FAIL: telemetry down")
        return 1

    print("v1 PASS: official 402 shape + free tier + telemetry OK")
    if not args.pay:
        print("(v2 payment completion needs --pay with funded TEST_PKEY)")
        return 0

    # v2 placeholder enforced: refuses to run until implemented against SDK.
    print("v2 not yet implemented — needs official client flow + funded key")
    return 2


if __name__ == "__main__":
    sys.exit(main())
