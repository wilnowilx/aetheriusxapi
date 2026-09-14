"""
DonateX Verification API
Verifies USDC donations on Base using AETHERIUS x402 Intelligence (free endpoints).

GET /donatex/api/verify?wallet=0x...&tx=0x...
GET /donatex/api/recent?wallet=0x...&limit=10

MIT License — AETHERIUS x402 API Marketplace
"""
from fastapi import APIRouter, Query
from fastapi.responses import JSONResponse
import httpx
import time

router = APIRouter(prefix="/donatex/api", tags=["donatex"])

# ── CONFIG ─────────────────────────────────────────────────────────
USDC_BASE = "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913"
USDC_DECIMALS = 6
BASESCAN_API = "https://api.basescan.org/api"
AETHERIUS_WALLET = "0x677B483128D0399bCD0A5AB36eE990C246d7f61"

# ── VERIFY SINGLE TRANSACTION ─────────────────────────────────────
@router.get("/verify")
async def verify_donation(
    tx: str = Query(..., description="Transaction hash"),
    wallet: str = Query(None, description="Expected recipient wallet (optional)")
):
    """Verify a USDC donation transaction on Base."""
    try:
        async with httpx.AsyncClient(timeout=15) as client:
            # Get transaction receipt
            resp = await client.get(BASESCAN_API, params={
                "module": "proxy",
                "action": "eth_getTransactionReceipt",
                "txhash": tx,
            })
            data = resp.json()

            if not data.get("result"):
                return JSONResponse({
                    "verified": False,
                    "error": "Transaction not found"
                }, status_code=404)

            receipt = data["result"]

            # Check if successful
            if receipt.get("status") != "0x1":
                return JSONResponse({
                    "verified": False,
                    "error": "Transaction failed"
                }, status_code=400)

            # Check logs for USDC transfer
            usdc_logs = [
                log for log in receipt.get("logs", [])
                if log.get("address", "").lower() == USDC_BASE.lower()
            ]

            if not usdc_logs:
                return JSONResponse({
                    "verified": False,
                    "error": "No USDC transfer found in transaction"
                })

            # Parse transfer
            log = usdc_logs[0]
            topics = log.get("topics", [])
            if len(topics) < 3:
                return JSONResponse({
                    "verified": False,
                    "error": "Invalid transfer log"
                })

            from_addr = "0x" + topics[1][-40:]
            to_addr = "0x" + topics[2][-40:]
            amount_raw = int(log.get("data", "0x0"), 16)
            amount_usdc = amount_raw / (10 ** USDC_DECIMALS)

            # Verify recipient matches if provided
            recipient_ok = True
            if wallet:
                recipient_ok = to_addr.lower() == wallet.lower()

            return {
                "verified": True,
                "tx": tx,
                "from": from_addr,
                "to": to_addr,
                "amount_usdc": amount_usdc,
                "amount_raw": str(amount_raw),
                "block": int(receipt.get("blockNumber", "0x0"), 16),
                "chain": "base",
                "currency": "USDC",
                "recipient_matches_wallet": recipient_ok,
            }

    except Exception as e:
        return JSONResponse({
            "verified": False,
            "error": str(e)
        }, status_code=500)


# ── RECENT DONATIONS ───────────────────────────────────────────────
@router.get("/recent")
async def recent_donations(
    wallet: str = Query(..., description="Wallet address to check"),
    limit: int = Query(10, ge=1, le=50, description="Number of results"),
):
    """Get recent USDC donations for a wallet on Base."""
    try:
        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.get(BASESCAN_API, params={
                "module": "account",
                "action": "tokentx",
                "contractaddress": USDC_BASE,
                "address": wallet,
                "page": 1,
                "offset": limit,
                "sort": "desc",
            })
            data = resp.json()

            if data.get("status") != "1":
                return {
                    "wallet": wallet,
                    "donations": [],
                    "total_usdc": 0,
                    "count": 0,
                }

            donations = []
            total = 0
            for tx in data.get("result", []):
                amount = float(tx.get("value", 0)) / (10 ** USDC_DECIMALS)
                donor = tx.get("from", "").lower()
                is_incoming = tx.get("to", "").lower() == wallet.lower()

                if is_incoming:
                    donations.append({
                        "tx": tx.get("hash"),
                        "from": donor,
                        "amount_usdc": round(amount, 2),
                        "block": int(tx.get("blockNumber", "0x0"), 16),
                        "timestamp": int(tx.get("timeStamp", 0)),
                        "explorer": f"https://basescan.org/tx/{tx.get('hash')}",
                    })
                    total += amount

            return {
                "wallet": wallet,
                "donations": donations,
                "total_usdc": round(total, 2),
                "count": len(donations),
            }

    except Exception as e:
        return JSONResponse({
            "wallet": wallet,
            "donations": [],
            "total_usdc": 0,
            "count": 0,
            "error": str(e),
        }, status_code=500)


# ── DONATEX STATS ──────────────────────────────────────────────────
@router.get("/stats")
async def donatex_stats(wallet: str = Query(AETHERIUS_WALLET)):
    """Get aggregate donation stats for a wallet."""
    try:
        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.get(BASESCAN_API, params={
                "module": "account",
                "action": "tokentx",
                "contractaddress": USDC_BASE,
                "address": wallet,
                "page": 1,
                "offset": 100,
                "sort": "desc",
            })
            data = resp.json()

            if data.get("status") != "1":
                return {"wallet": wallet, "total_usdc": 0, "donation_count": 0}

            total = 0
            count = 0
            unique_donors = set()
            for tx in data.get("result", []):
                if tx.get("to", "").lower() == wallet.lower():
                    amount = float(tx.get("value", 0)) / (10 ** USDC_DECIMALS)
                    total += amount
                    count += 1
                    unique_donors.add(tx.get("from", "").lower())

            return {
                "wallet": wallet,
                "total_usdc": round(total, 2),
                "donation_count": count,
                "unique_donors": len(unique_donors),
                "network": "base",
            }

    except Exception as e:
        return JSONResponse({
            "wallet": wallet,
            "total_usdc": 0,
            "donation_count": 0,
            "error": str(e),
        }, status_code=500)
