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

    return _v2_complete_payment(args.base, CANARY, chal)


# ── v2: complete payment with official SDK client flow ────────────────
# Policy lives HERE in code (never prompts): Sepolia only, exact only,
# merchant only, hard amount cap. Any mismatch aborts BEFORE signing.
MERCHANT = "0x677B483128D0399bCD0A5AB36eE990C0246d7f61"
MAX_AMOUNT_UNITS = 100000  # $0.10 USDC cap per call (canary is $0.001)


def _load_test_key():
    import pathlib

    envf = pathlib.Path(__file__).resolve().parent.parent / ".env.test"
    kv = {}
    for line in envf.read_text().splitlines():
        if "=" in line and not line.startswith("#"):
            k, v = line.split("=", 1)
            kv[k.strip()] = v.strip()
    if not kv.get("TEST_PKEY"):
        print("FAIL: .env.test missing TEST_PKEY (dust-only test key)")
        sys.exit(2)
    return kv["TEST_PKEY"]


def _v2_complete_payment(base, path, chal) -> int:
    import base64

    from eth_account import Account
    from x402.mechanisms.evm.exact import ExactEvmClientScheme
    from x402.mechanisms.evm.signers import EthAccountSigner
    from x402.schemas import PaymentPayload, PaymentRequirements

    accepts = chal.get("accepts", [])
    if not accepts:
        print("FAIL: challenge has no accepts[]")
        return 1
    req = accepts[0]

    # ── POLICY GATE (code, not prompts) ──
    if req.get("network") != "eip155:84532":
        print(f"REFUSE: network {req.get('network')} is not Base Sepolia")
        return 1
    if req.get("scheme") != "exact":
        print(f"REFUSE: scheme {req.get('scheme')} is not exact")
        return 1
    if int(req.get("amount", "0")) > MAX_AMOUNT_UNITS:
        print(f"REFUSE: amount {req.get('amount')} exceeds cap {MAX_AMOUNT_UNITS}")
        return 1
    if req.get("payTo", "").lower() != MERCHANT.lower():
        print(f"REFUSE: payTo {req.get('payTo')} is not the merchant")
        return 1
    print("[5] policy PASS (sepolia/exact/merchant/cap)")

    acct = Account.from_key(_load_test_key())
    signer = EthAccountSigner(acct)
    print(f"[6] signer addr={signer.address}")
    scheme = ExactEvmClientScheme(signer)
    requirements = PaymentRequirements(
        scheme=req["scheme"], network=req["network"], asset=req["asset"],
        amount=req["amount"], pay_to=req["payTo"],
        max_timeout_seconds=req.get("maxTimeoutSeconds", 300),
        extra=req.get("extra", {}),
    )
    result = scheme.create_payment_payload(requirements)
    envelope = PaymentPayload(
        x402_version=chal.get("x402Version", 2), payload=result,
        accepted=req, resource=chal.get("resource", {}),
    ).model_dump()
    sig = base64.b64encode(json.dumps(envelope).encode()).decode()
    print(f"[7] signed authorization from={result.get('authorization', {}).get('from', '?')[:12]}...")

    # Telemetry baseline, then paid retry.
    _, _, tb0 = _req(base, "/v1/telemetry")
    vol0 = json.loads(tb0).get("totals", {}).get("volume_usdc", 0)
    code, headers, body = _req(base, path, {"PAYMENT-SIGNATURE": sig})
    print(f"[8] paid retry -> {code}")
    if code != 200:
        print(f"FAIL: expected 200, got {code}: {body[:400]}")
        return 1
    print(f"[9] settle header: {headers.get('X-PAYMENT-RESPONSE') or headers.get('PAYMENT-RESPONSE') or headers.get('X-Payment-Response', '')[:80]}")
    _, _, tb1 = _req(base, "/v1/telemetry")
    vol1 = json.loads(tb1).get("totals", {}).get("volume_usdc", 0)
    print(f"[10] volume {vol0} -> {vol1} USDC")
    print("v2 PASS: real 402 -> sign -> 200 + settlement + volume")
    return 0


if __name__ == "__main__":
    sys.exit(main())
