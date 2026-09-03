"""AETHERIUS 90-second live demo — co-created: automaton runs, human records.

One command, real testnet USDC. Screen-record while it runs, then stitch
your hook/CTA cards around it in any free editor (OBS + CapCut/VN/DaVinci,
all without watermark).

Run:
    AETHERIUS_DEMO_KEY=<testnet-wallet-key> python docs/demo/demo_90s.py

Needs: pip install httpx requests web3 x402. Key NEVER hardcoded, env only.
Beats follow docs/tutorials/03-agent-first-paid-call.md (discover, challenge,
pay, verify on telemetry).
"""

import json
import os
import sys
import time

import requests as req
from web3 import Web3
from x402.mechanisms.evm.exact import ExactEvmClientScheme
from x402.mechanisms.evm.exact.client import _wrap_if_local_account
from x402.client import (
    x402ClientConfig,
    x402ClientSync,
    SchemeRegistration,
)
from x402.http.clients.requests import wrapRequestsWithPayment

BASE = "http://34.156.149.38/aetherapi"
NETWORK = "eip155:84532"
KEY = os.getenv("AETHERIUS_DEMO_KEY", "")
if len(KEY) < 32:
    sys.exit("Set AETHERIUS_DEMO_KEY env var with your testnet wallet key.")

T0 = time.monotonic()


def beat(n, total, title):
    print(f"\n{'=' * 56}"
          f"\n  t+{int(time.monotonic() - T0):3d}s  [{n}/{total}] {title}"
          f"\n{'=' * 56}", flush=True)


def pause(s=2.5):
    time.sleep(s)


w3 = Web3(Web3.HTTPProvider("https://sepolia.base.org"))
acct = w3.eth.account.from_key(KEY)
evm = ExactEvmClientScheme(signer=_wrap_if_local_account(acct))
cfg = x402ClientConfig(
    schemes=[SchemeRegistration(network=NETWORK, client=evm)])
http = wrapRequestsWithPayment(session=req.Session(),
                               client=x402ClientSync.from_config(cfg))
plain = req.Session()

beat(1, 6, "HOOK — agentes sin tarjeta, como pagan APIs?")
print("AETHERIUS: donde los agentes IA pagan por llamada en USDC sobre Base.",
      flush=True)
pause()

beat(2, 6, "PRUEBA — catalogo vivo")
h = plain.get(f"{BASE}/api/v1/health", timeout=30).json()
eps = h["endpoints"]
print(f"Servicio {h['service']} v{h['version']} en {h['network']}", flush=True)
print(f"Endpoints en vivo: {len(eps)}", flush=True)
cheapest = min(eps.items(),
               key=lambda kv: float(kv[1].split("$")[1].split("/")[0]))
print(f"Mas barato: {cheapest[0]} a {cheapest[1].split(' - ')[0]}", flush=True)
pause()

beat(3, 6, "CONFLICTO — sin pago no hay datos (402)")
r = plain.get(f"{BASE}/v1/email/validate",
              params={"email": "agent@gmail.com"}, timeout=30)
print(f"HTTP {r.status_code} — {r.json()}", flush=True)
pause()

beat(4, 6, "RESOLUCION — pago real USDC y datos reales (200)")
r = http.get(f"{BASE}/api/v1/email/validate",
             params={"email": "agent@gmail.com"}, timeout=120)
print(f"HTTP {r.status_code} — {json.dumps(r.json())[:200]}", flush=True)
pause()

beat(5, 6, "PRUEBA VIVA — la telemetria se movio por nosotros")
t = plain.get(f"{BASE}/v1/telemetry", timeout=30).json()["totals"]
print(f"Llamadas: {t['calls']} | Pagadas: {t['ok_200']} | "
      f"USDC liquidado: ${t['volume_usdc']}", flush=True)
pause()

beat(6, 6, "CTA")
print("AETHERIUS — https://wilnowilx.github.io/aetheriusxapi/", flush=True)
print(f"Demo completado en t+{int(time.monotonic() - T0)}s "
      f"con USDC real en Base Sepolia.", flush=True)
