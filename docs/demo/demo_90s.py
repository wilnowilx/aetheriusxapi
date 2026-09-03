"""AETHERIUS 90-second live demo — the EXACT path a client integrates.

Same calls as docs/API.md, executed through sdks/python (the client SDK).
Co-created: automaton runs, human records.

Run (CMD):
    set AETHERIUS_DEMO_KEY=<testnet key>
    set DEMO_STEP=1
    python docs\\demo\\demo_90s.py

Modes: DEMO_STEP=1 pauses per scene ([ENTER] next, [Q] quit). Unset = auto.
No keys in repo, ever. Local X-PAYMENT:anything is simulated; live networks
settle real USDC (watch the balance drop).
"""

import json
import os
import sys
import time

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)),
                                "..", "..", "sdks", "python"))

import requests as req
from web3 import Web3

from aetheriusx import AetheriusXClient

BASE = "http://34.156.149.38/aetherapi"
NETWORK = "eip155:84532"
KEY = os.getenv("AETHERIUS_DEMO_KEY", "")
if len(KEY) < 32:
    sys.exit("Set AETHERIUS_DEMO_KEY env var with your testnet wallet key.")

T0 = time.monotonic()

# Scene mode: DEMO_STEP=1 waits per scene. [ENTER] = next, [Q] = quit.
STEP = os.getenv("DEMO_STEP", "") not in ("", "0", "false")


def beat(n, total, title):
    print(f"\n{'=' * 56}"
          f"\n  t+{int(time.monotonic() - T0):3d}s  [{n}/{total}] {title}"
          f"\n{'=' * 56}", flush=True)


def pause(s=2.5):
    if STEP:
        try:
            ans = input("  -- [ENTER] next scene · [Q]uit -- ").strip().lower()
            if ans in ("q", "quit", "exit"):
                print("Demo stopped. See you next take!")
                raise SystemExit(0)
        except EOFError:
            pass
    else:
        time.sleep(s)


sdk = AetheriusXClient(base_url=BASE)
w3 = Web3(Web3.HTTPProvider("https://sepolia.base.org"))
acct = w3.eth.account.from_key(KEY)
plain = req.Session()

USDC_SEPOLIA = "0x036CbD53842c5426634e7929541eC2318f3dCF7e"
ERC20_ABI = [{"constant": True, "inputs": [{"name": "_o", "type": "address"}],
              "name": "balanceOf", "outputs": [{"name": "", "type": "uint256"}],
              "type": "function"}]
usdc = w3.eth.contract(address=w3.to_checksum_address(USDC_SEPOLIA),
                       abi=ERC20_ABI)


def usdc_bal():
    try:
        return usdc.functions.balanceOf(acct.address).call() / 1e6
    except Exception:
        return None


SCAN = f"https://sepolia.basescan.org/address/{acct.address}"
ROUTE = "/v1/email/validate"
PARAMS = {"email": "agent@gmail.com"}

beat(1, 6, "HOOK — agents can't hold credit cards. How do they pay for APIs?")
print("AETHERIUS: where AI agents pay per call in USDC on Base.", flush=True)
print(f"Agent wallet: {acct.address}", flush=True)
print(f"Verify yourself: {SCAN}", flush=True)
pause()

beat(2, 6, "DISCOVERY — live catalog via the SDK")
h = sdk.health()
eps = h["endpoints"]
print(f"Service {h['version']} on {h['network']}", flush=True)
print(f"Live endpoints: {len(eps)}", flush=True)
route, price = sdk.discover_cheapest()
print(f"Cheapest: {route} at ${price}/call", flush=True)
print(f"Demoing {ROUTE} at {eps[ROUTE].split(' - ')[0]} (client's choice).",
      flush=True)
pause()

beat(3, 6, "CHALLENGE — no payment, no data (402)")
r = plain.get(f"{BASE}{ROUTE}", params=PARAMS, timeout=30)
print(f"HTTP {r.status_code} — empty body. No proof, you don't exist.",
      flush=True)
print(f"Catalog price: {eps[ROUTE].split(' - ')[0]} USDC.", flush=True)
pause()

beat(4, 6, "SETTLEMENT — real USDC, real data (200)")
b0 = usdc_bal()
print(f"USDC balance before: {b0}", flush=True)
r = sdk.paid_get_x402(ROUTE, PARAMS, signer=acct)
print(f"HTTP {r.status_code}", flush=True)
print(json.dumps(r.json(), indent=2, ensure_ascii=False), flush=True)
b1 = usdc_bal()
if b0 is not None and b1 is not None:
    print(f"USDC balance after: {b1} (spent: ${b0 - b1:.4f})", flush=True)
    print("That discount IS the proof. Real money, not simulated.", flush=True)
pause()

beat(5, 6, "LIVE PROOF — telemetry moved because of us")
t = plain.get(f"{BASE}/v1/telemetry", timeout=30).json()["totals"]
print(f"Calls: {t['calls']} | Paid: {t['ok_200']} | "
      f"Settled USDC: ${t['volume_usdc']}", flush=True)
pause()

beat(6, 6, "CTA")
print("AETHERIUS — https://wilnowilx.github.io/aetheriusxapi/", flush=True)
print(f"Verifiable txs: {SCAN}", flush=True)
print(f"Done in t+{int(time.monotonic() - T0)}s with real USDC on Base Sepolia.",
      flush=True)
