"""aetheriusxAPI test suite.

Deterministic gates (no network needed):
  - /health is free (200, no payment header)
  - all 40 paid endpoints return 402 without X-PAYMENT, with x402 body shape
  - invalid email is rejected deterministically (no MX lookup reached)
  - missing params return docs-compliant 400
  - legacy /api/v1/* prefix behaves identically
  - paid responses carry the X-PAYMENT-SETTLED header

Live-shape checks (need network; tolerant of upstream outages):
  - paid requests return 200 with expected keys, OR a JSON {"error": ...}
    proving our stack executed end-to-end.
"""

import pytest
from fastapi.testclient import TestClient

from main import app, PRICES
from x402_middleware import _nonce_cache

client = TestClient(app)
PAID = {"X-PAYMENT": "simulated-payment"}


@pytest.fixture(autouse=True)
def _clear_nonce_cache():
    """Reset the anti-replay nonce cache before each test.

    Each test sends the same proof string; without clearing, the second
    request in any test would be blocked as a duplicate (409).
    """
    _nonce_cache._seen.clear()
    yield
    _nonce_cache._seen.clear()


def test_health_free():
    r = client.get("/health")
    assert r.status_code == 200
    body = r.json()
    assert body["status"] == "alive"
    assert body["service"] == "aetheriusxAPI"
    assert len(body["endpoints"]) >= 40  # 40 paid + free x402


@pytest.mark.parametrize("route", sorted(PRICES))
def test_paid_endpoints_require_payment(route):
    # Minimal query params so routing (not validation) is what we test.
    params = {
        "/v1/maps/search": {"q": "cafe"},
        "/v1/maps/reviews": {"place_name": "Zocalo"},
        "/v1/maps/nearby": {"lat": 19.43, "lon": -99.13},
        "/v1/token/analyze": {"address": "0x0000000000000000000000000000000000000000"},
        "/v1/token/holders": {"address": "0x0000000000000000000000000000000000000000"},
        "/v1/token/price": {"address": "0x0000000000000000000000000000000000000000"},
        "/v1/web/scrape": {"url": "https://example.com"},
        "/v1/web/screenshot": {"url": "https://example.com"},
        "/v1/email/validate": {"email": "user@example.com"},
        "/v1/data/weather": {"lat": 19.43, "lon": -99.13},
        "/v1/storage/drift": {"chain": "base", "layers": 1},
        "/v1/defi/yields": {"limit": 2},
        "/v1/defi/stablecoins": {"limit": 2},
        "/v1/defi/fees": {"limit": 2},
        "/v1/defi/tvl": {"limit": 2},
        "/v1/forex/rates": {"base": "USD"},
        "/v1/news/hackernews": {"kind": "top", "limit": 2},
        "/v1/data/forecast": {"lat": 19.43, "lon": -99.13},
        "/v1/data/airquality": {"lat": 19.43, "lon": -99.13},
        "/v1/data/define": {"word": "test"},
        "/v1/defi/protocols": {"limit": 2},
        "/v1/defi/dexs": {"limit": 2},
        "/v1/defi/stablecoinchains": {"limit": 2},
        "/v1/token/prices": {"addresses": "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913"},
        "/v1/token/gas": {},
        "/v1/maps/reverse": {"lat": 19.43, "lon": -99.13},
        "/v1/forex/history": {"start": "2026-01-01", "end": "2026-01-02"},
        "/v1/news/hn-item": {"id": 1},
        "/v1/news/hn-user": {"username": "pg"},
        "/v1/web/geoip": {"ip": "8.8.8.8"},
        "/v1/data/elevation": {"lat": 19.43, "lon": -99.13},
        "/v1/data/words": {"word": "test"},
        "/v1/maps/geocode": {"q": "Paris"},
        "/v1/token/global": {},
        "/v1/token/balance": {"address": "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045"},
        "/v1/token/transactions": {"address": "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045"},
        "/v1/defi/stablecoin-history": {"chain": "ethereum"},
        "/v1/forex/convert": {"to": "MXN"},
        "/v1/news/hn-feed": {"kind": "ask"},
        "/v1/web/dns": {"name": "example.com"},
        "/v1/crypto/market": {},
        "/v1/crypto/fear-greed": {"limit": 2},
        "/v1/crypto/trending": {},
        "/v1/crypto/ohlcv": {},
        "/v1/crypto/dominance": {},
        "/v1/token/nft": {"contract": "0x0000000000000000000000000000000000000000"},
        "/v1/data/ip": {},
        "/v1/data/ua": {"user_agent": "Mozilla/5.0"},
        "/v1/data/hash": {"text": "hello"},
        "/v1/data/uuid": {},
        "/v1/data/qrcode": {"text": "test"},
        "/v1/data/translate": {"text": "hello", "target": "es"},
        "/v1/data/summarize": {"text": "Test sentence. Another sentence."},
        "/v1/data/define": {"word": "test"},
        "/v1/data/words": {"word": "test"},
        "/v1/data/elevation": {"lat": 19.43, "lon": -99.13},
        "/v1/news/reddit": {"subreddit": "cryptocurrency", "limit": 2},
        "/v1/news/devto": {"limit": 2},
        "/v1/defi/impermanent-loss": {"entry_price": 100, "current_price": 150},
        "/v1/defi/staking-apy": {},
        "/v1/maps/geocode": {"q": "Paris"},
        "/v1/token/global": {},
        "/v1/token/balance": {"address": "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045"},
        "/v1/token/transactions": {"address": "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045"},
        "/v1/defi/stablecoin-history": {"chain": "ethereum"},
        "/v1/forex/convert": {"to": "MXN"},
    }
    r = client.get(route, params=params.get(route, {}))
    assert r.status_code == 402
    body = r.json()
    assert body["error"] == "Payment required"
    assert body["currency"] == "USDC"
    assert "pay_to" in body and body["pay_to"].startswith("0x")
    assert "network" in body


def test_invalid_email_deterministic():
    r = client.get("/v1/email/validate", params={"email": "not-an-email"},
                   headers=PAID)
    assert r.status_code == 200
    body = r.json()
    assert body["valid_syntax"] is False
    assert body["verdict"] == "invalid_syntax"
    assert body["risk_score"] == 100


def test_missing_param_returns_400():
    r = client.get("/v1/maps/search", headers=PAID)  # no q
    assert r.status_code == 400
    assert "Missing required parameter" in r.json()["error"]


def test_legacy_prefix_alias():
    r = client.get("/api/v1/email/validate", params={"email": "not-an-email"},
                   headers=PAID)
    assert r.status_code == 200
    assert r.json()["verdict"] == "invalid_syntax"


def test_settlement_header_on_paid():
    r = client.get("/health")
    assert "X-PAYMENT-SETTLED" not in r.headers  # free route: no header
    r = client.get("/v1/email/validate", params={"email": "not-an-email"},
                   headers={"X-PAYMENT": "settlement-test-free"})
    assert r.headers.get("X-PAYMENT-SETTLED") == "simulated"


def test_screenshot_shape():
    r = client.get("/v1/web/screenshot",
                   params={"url": "https://example.com"},
                   headers=PAID)
    assert r.status_code == 200
    body = r.json()
    assert "screenshot_url" in body and body["url"] == "https://example.com"


def assert_live_or_upstream_error(resp, required_keys):
    """200 + keys, or a JSON error proving our stack ran (upstream down)."""
    if resp.status_code == 200:
        body = resp.json()
        assert ("error" in body
                or all(k in body for k in required_keys)), body
    else:
        assert resp.status_code in (404, 500, 501, 502)
        assert "error" in resp.json()


def test_error_branches_return_json():
    # Regression: error paths must build valid JSON bodies (Starlette
    # JSONResponse takes content first; status_code is keyword-only).
    # NOTE: distinct proofs per request — the anti-replay cache 409s
    # a reused proof even inside one test (that's the feature working).
    r = client.get("/v1/token/price",
                   params={"address": "0xabc", "chain": "solana"},
                   headers={"X-PAYMENT": "err-branch-1"})
    assert r.status_code in (200, 404, 500, 502)
    assert "error" in r.json() or "price_usd" in r.json()

    r = client.get("/v1/token/holders",
                   params={"address": "0xabc"},
                   headers={"X-PAYMENT": "err-branch-2"})
    assert r.status_code in (200, 501, 502)
    assert "error" in r.json() or "holders" in r.json()

    r = client.get("/v1/web/scrape",
                   params={"url": "http://invalid.invalid"},
                   headers={"X-PAYMENT": "err-branch-3"})
    # 403 = SSRF guard (unresolvable host); 500/502 = upstream fetch failure
    assert r.status_code in (200, 403, 500, 502)
    assert "error" in r.json() or "title" in r.json()


def test_drift_rejects_unknown_chain():
    r = client.get("/v1/storage/drift", params={"chain": "solana"},
                   headers=PAID)
    assert r.status_code == 400
    assert "Unsupported chain" in r.json()["error"]


def test_drift_live_shape():
    r = client.get("/v1/storage/drift",
                   params={"chain": "base", "layers": 2}, headers=PAID)
    assert_live_or_upstream_error(r, ["layers", "drift"])


def test_dashboard_served():
    import os
    if not os.path.isdir(os.path.join(os.path.dirname(__file__), "..", "dashboard")):
        pytest.skip("dashboard folder not present")
    r = client.get("/dashboard/")
    assert r.status_code == 200
    assert "text/html" in r.headers["content-type"]
    assert "control room" in r.text.lower()
    r = client.get("/dashboard/app.js")
    assert r.status_code == 200


def test_telemetry_persists_sqlite(tmp_path):
    from telemetry import Tracker
    db = str(tmp_path / "t.db")
    t1 = Tracker(prices={"/v1/email/validate": "$0.005"}, db_path=db)
    t1.record("/v1/email/validate", 200, 10.0, wallet="0xabc")
    t1.record("/v1/email/validate", 402, 5.0)
    t2 = Tracker(prices={"/v1/email/validate": "$0.005"}, db_path=db)
    snap = t2.snapshot()
    assert snap["totals"]["calls"] == 2
    assert snap["totals"]["volume_usdc"] == 0.005
    assert snap["wallets_seen"] == 1
    assert snap["per_endpoint"]["/v1/email/validate"]["n402"] == 1


def test_telemetry_free_and_shape():
    r = client.get("/v1/telemetry")
    assert r.status_code == 200
    body = r.json()
    assert body["service"] == "aetheriusxAPI"
    assert body["uptime_s"] >= 0
    for k in ("calls", "ok_200", "challenges_402", "errors",
              "volume_usdc", "avg_latency_ms"):
        assert k in body["totals"], k
    assert "per_endpoint" in body
    assert "recent_events" in body
    assert "wallets_seen" in body


def test_telemetry_records_paid_call_and_volume():
    before = client.get("/v1/telemetry").json()
    r = client.get("/v1/email/validate", params={"email": "not-an-email"},
                   headers=PAID)
    assert r.status_code == 200
    after = client.get("/v1/telemetry").json()
    # telemetry probe itself is never counted
    assert after["totals"]["calls"] == before["totals"]["calls"] + 1
    ep0 = before["per_endpoint"].get("/v1/email/validate", {"ok_200": 0})
    assert after["per_endpoint"]["/v1/email/validate"]["ok_200"] == ep0["ok_200"] + 1
    delta = round(after["totals"]["volume_usdc"] - before["totals"]["volume_usdc"], 4)
    assert delta == 0.005  # email/validate price


def test_telemetry_counts_402_and_wallets():
    import uuid
    w = "0x" + uuid.uuid4().hex[:40]
    before = client.get("/v1/telemetry").json()
    r = client.get("/v1/maps/search", params={"q": "cafe"})
    assert r.status_code == 402
    client.get("/v1/maps/search", params={"q": "cafe"},
               headers={**PAID, "X-Wallet": w})
    after = client.get("/v1/telemetry").json()
    assert after["totals"]["challenges_402"] >= before["totals"]["challenges_402"] + 1
    assert after["wallets_seen"] == before["wallets_seen"] + 1


def test_cors_allows_pages_origin():
    r = client.options(
        "/v1/email/validate",
        headers={"Origin": "https://wilnowilx.github.io",
                 "Access-Control-Request-Method": "GET"})
    assert r.status_code == 200
    assert r.headers.get("access-control-allow-origin") == "https://wilnowilx.github.io"
    r = client.get("/health", headers={"Origin": "https://wilnowilx.github.io"})
    assert r.headers.get("access-control-allow-origin") == "https://wilnowilx.github.io"


def test_dashboard_backend_setting_present():
    r = client.get("/dashboard/")
    assert r.status_code == 200
    assert 'id="backendUrl"' in r.text
    assert 'id="backendGear"' in r.text
    assert "fx.js" in r.text
    js = client.get("/dashboard/app.js")
    assert js.status_code == 200
    assert "aex_base" in js.text and "api(" in js.text


def test_dashboard_os_mode_present():
    js = client.get("/dashboard/app.js")
    assert js.status_code == 200
    assert "wintitle" in js.text and "osdock" in js.text
    css = client.get("/dashboard/styles.css")
    assert css.status_code == 200
    assert "#osdock" in css.text
    assert "VM_BASE" in js.text and "getJSON" in js.text


def test_drift_sample_free():
    r = client.get("/v1/storage/drift/sample", params={"chain": "base"})
    assert r.status_code in (200, 502)
    body = r.json()
    assert ("slot" in body and "paid_route" in body) or "error" in body
    fx = client.get("/dashboard/fx.js")
    assert fx.status_code == 200
    assert "aex-fx" in fx.text


def test_live_email_valid_shape():
    r = client.get("/v1/email/validate", params={"email": "user@gmail.com"},
                   headers=PAID)
    assert_live_or_upstream_error(r, ["valid_syntax", "verdict"])


def test_live_weather_shape():
    r = client.get("/v1/data/weather",
                   params={"lat": 19.43, "lon": -99.13}, headers=PAID)
    assert_live_or_upstream_error(r, ["current", "data_source"])


# ─── QuantumXBrain — Enhanced Intelligence (FREE, no payment header needed) ───

QXB_ROUTES = [
    ("/v1/x402/brain", {}),
    ("/v1/x402/brain", {"intent": "defi"}),
    ("/v1/x402/intelligence", {}),
    ("/v1/x402/market-pulse", {}),
    ("/v1/x402/sentiment", {}),
    ("/v1/x402/gas-intelligence", {}),
    ("/v1/x402/token-discovery", {}),
    ("/v1/x402/whale-intelligence", {}),
    ("/v1/x402/network-health", {}),
    ("/v1/x402/stablecoin-flow", {}),
    ("/v1/x402/defi-yield", {}),
    ("/v1/x402/tx-patterns", {}),
    ("/v1/x402/leaderboard", {}),
    ("/v1/x402/velocity-intel", {}),
    ("/v1/x402/search-intel", {"q": "0x0000000000000000000000000000000000000000"}),
    ("/v1/x402/compliance", {"address": "0x0000000000000000000000000000000000000000"}),
    ("/v1/x402/wallet-intel/0x0000000000000000000000000000000000000000", {}),
    ("/v1/x402/contract-intel/0x0000000000000000000000000000000000000000", {}),
    ("/v1/x402/history-intel/0x0000000000000000000000000000000000000000", {}),
    ("/v1/x402/risk-intel/0x0000000000000000000000000000000000000000", {}),
    ("/v1/x402/wallet-compare", {
        "a": "0x677B483128D0399bCD0A5AB36eE990C0246d7f61",
        "b": "0xAc7dA127f89B9caD90241B73d63f2DE8Dbc0d68B",
    }),
]


@pytest.mark.parametrize("route,params", QXB_ROUTES)
def test_quantumxbrain_free_no_payment(route, params):
    """QuantumXBrain endpoints are FREE — no X-PAYMENT header needed."""
    r = client.get(route, params=params)
    assert r.status_code == 200, f"{route} returned {r.status_code}: {r.text[:200]}"
    body = r.json()
    assert body.get("status") == "ok", f"{route} status not ok: {body}"


@pytest.mark.parametrize("route,params", QXB_ROUTES)
def test_quantumxbrain_fingerprint_header(route, params):
    """Every QuantumXBrain response carries AETHERIUS fingerprint."""
    r = client.get(route, params=params)
    fp = r.headers.get("x-aetherius-fingerprint", "")
    assert "quantumxbrain-v1" in fp, f"{route} missing fingerprint header"
    assert r.headers.get("x-powered-by", "") == "AETHERIUS QuantumXBrain"


def test_brain_intent_recommendations():
    """Brain endpoint returns recommendations for known intents."""
    for intent in ("defi", "wallet", "gas", "market", "security", "token"):
        r = client.get("/v1/x402/brain", params={"intent": intent})
        body = r.json()
        assert body.get("intent") == intent
        recs = body.get("recommendations", [])
        assert len(recs) >= 2, f"Brain intent={intent} returned <2 recs"


def test_market_pulse_chain_fields():
    """Market pulse must include chain info + signal."""
    r = client.get("/v1/x402/market-pulse")
    body = r.json()
    assert "chain" in body
    assert body["chain"]["chain_id"] == 8453
    assert "signal" in body
    assert "label" in body["signal"]
    assert "gas" in body
    assert "market" in body


def test_sentiment_fields():
    """Sentiment must include composite_score + fear_greed_index."""
    r = client.get("/v1/x402/sentiment")
    body = r.json()
    assert "composite_score" in body
    assert "fear_greed_index" in body
    assert "overall_sentiment" in body
    assert isinstance(body["composite_score"], (int, float))


def test_wallet_intel_fields():
    """Wallet intel returns structured wallet profile."""
    addr = "0x677B483128D0399bCD0A5AB36eE990C0246d7f61"
    r = client.get(f"/v1/x402/wallet-intel/{addr}")
    body = r.json()
    assert body.get("status") == "ok"
    assert "address" in body
    assert "eth_balance" in body


def test_risk_intel_score_range():
    """Risk score must be 0-100."""
    addr = "0x677B483128D0399bCD0A5AB36eE990C0246d7f61"
    r = client.get(f"/v1/x402/risk-intel/{addr}")
    body = r.json()
    assert "factors" in body
    assert "risk_score" in body
    assert 0 <= body["risk_score"] <= 100


def test_search_intel_query():
    """Search intel returns status and type."""
    r = client.get("/v1/x402/search-intel", params={"q": "0x0000"})
    body = r.json()
    assert body.get("status") == "ok"
    assert "type" in body


def test_wallet_compare_two_wallets():
    """Wallet compare returns both wallets."""
    a = "0x677B483128D0399bCD0A5AB36eE990C0246d7f61"
    b = "0xAc7dA127f89B9caD90241B73d63f2DE8Dbc0d68B"
    r = client.get("/v1/x402/wallet-compare", params={"a": a, "b": b})
    body = r.json()
    assert body.get("status") == "ok"
    assert "wallet_a" in body or "comparison" in body


# ─── TOCTOU Anti-Replay Protection ─────────────────────────────────────────

class TestAntiReplay:
    """Verify that payment proofs can only be used once (TOCTOU protection)."""

    def test_first_request_passes(self):
        """First request with a proof should succeed (200)."""
        r = client.get("/v1/email/validate",
                       params={"email": "test@test.com"},
                       headers={"X-PAYMENT": "unique-proof-aaa"})
        assert r.status_code == 200

    def test_duplicate_proof_rejected_409(self):
        """Same proof used twice → 409 Conflict on second request."""
        proof = "unique-proof-bbb"
        headers = {"X-PAYMENT": proof}

        # First request: succeeds
        r1 = client.get("/v1/email/validate",
                        params={"email": "test@test.com"},
                        headers=headers)
        assert r1.status_code == 200

        # Second request with same proof: blocked
        r2 = client.get("/v1/email/validate",
                        params={"email": "test@test.com"},
                        headers=headers)
        assert r2.status_code == 409
        body = r2.json()
        assert body["error"] == "Payment proof already used"
        assert "nonce" in body

    def test_different_proofs_both_pass(self):
        """Two different proofs should both succeed."""
        r1 = client.get("/v1/email/validate",
                        params={"email": "a@test.com"},
                        headers={"X-PAYMENT": "proof-ccc"})
        assert r1.status_code == 200

        r2 = client.get("/v1/email/validate",
                        params={"email": "b@test.com"},
                        headers={"X-PAYMENT": "proof-ddd"})
        assert r2.status_code == 200

    def test_different_routes_same_proof_blocked(self):
        """Same proof on different routes → 409 on second route."""
        proof = "unique-proof-eee"

        r1 = client.get("/v1/email/validate",
                        params={"email": "test@test.com"},
                        headers={"X-PAYMENT": proof})
        assert r1.status_code == 200

        r2 = client.get("/v1/data/weather",
                        params={"lat": 19.43, "lon": -99.13},
                        headers={"X-PAYMENT": proof})
        assert r2.status_code == 409

    def test_proof_whitespace_normalization(self):
        """Proofs with different whitespace are treated as same (normalized)."""
        r1 = client.get("/v1/email/validate",
                        params={"email": "test@test.com"},
                        headers={"X-PAYMENT": "  proof-fff  "})
        assert r1.status_code == 200

        r2 = client.get("/v1/email/validate",
                        params={"email": "test@test.com"},
                        headers={"X-PAYMENT": "proof-fff"})
        assert r2.status_code == 409

    def test_409_body_shape(self):
        """409 response has correct x402-style body."""
        proof = "unique-proof-ggg"
        client.get("/v1/email/validate",
                   params={"email": "test@test.com"},
                   headers={"X-PAYMENT": proof})

        r = client.get("/v1/email/validate",
                       params={"email": "test@test.com"},
                       headers={"X-PAYMENT": proof})
        assert r.status_code == 409
        body = r.json()
        assert "error" in body
        assert "detail" in body
        assert "nonce" in body
        assert "hint" in body

    def test_no_payment_still_returns_402(self):
        """Missing proof still returns 402 (not affected by anti-replay)."""
        r = client.get("/v1/email/validate",
                       params={"email": "test@test.com"})
        assert r.status_code == 402
        assert r.json()["error"] == "Payment required"

    def test_free_routes_unaffected(self):
        """Free routes bypass anti-replay entirely."""
        r1 = client.get("/health")
        assert r1.status_code == 200

        r2 = client.get("/health")
        assert r2.status_code == 200

    def test_nonce_cache_stats(self):
        """Nonce cache tracks active nonces correctly."""
        from x402_middleware import _nonce_cache
        _nonce_cache._seen.clear()

        client.get("/v1/email/validate",
                   params={"email": "test@test.com"},
                   headers={"X-PAYMENT": "stats-test-1"})
        stats = _nonce_cache.stats()
        assert stats["active_nonces"] == 1

        client.get("/v1/email/validate",
                   params={"email": "test@test.com"},
                   headers={"X-PAYMENT": "stats-test-2"})
        stats = _nonce_cache.stats()
        assert stats["active_nonces"] == 2


# === SSRF guard (no network needed for blocked cases) ===
def test_ssrf_blocks_private_targets():
    from main import _is_public_url
    for bad in ["http://127.0.0.1:4020/health",
                "http://10.0.0.5/", "http://169.254.169.254/latest/meta-data/",
                "http://0.0.0.0/", "http://[::1]/",
                "ftp://example.com/", "file:///etc/passwd"]:
        assert _is_public_url(bad) is False, bad


def test_ssrf_blocks_metadata_hostname():
    from main import _is_public_url
    import socket
    orig = socket.getaddrinfo
    # metadata host resolves link-local no matter the network
    socket.getaddrinfo = lambda *a, **k: [(2, 1, 6, "", ("169.254.169.254", 0))]
    try:
        assert _is_public_url("http://metadata.google.internal/") is False
    finally:
        socket.getaddrinfo = orig


def test_scrape_endpoint_rejects_loopback():
    r = client.get("/v1/data/weather", params={"lat": "1", "lon": "1"},
                   headers={"X-PAYMENT": "ssrf-test-loopback"})
    assert r.status_code == 200  # sanity: paid path works
    r = client.get("/v1/web/scrape", params={"url": "http://127.0.0.1:9/"},
                   headers={"X-PAYMENT": "ssrf-test-scrape"})
    assert r.status_code == 403
    assert "SSRF" in r.json()["error"]


# === Route coverage: deny-by-default (every /v1 route priced or free) ===
def test_all_v1_routes_priced_or_explicitly_free():
    import re
    from main import app, PRICES
    # Explicitly-free by design: health, telemetry, monitoring stats,
    # free-tier sample. Anything else unpriced here = fail-open bug.
    FREE_EXACT = {"/health", "/v1/health", "/v1/telemetry", "/",
                  "/v1/anti-replay/stats", "/v1/storage/drift/sample"}
    FREE_PREFIX = ("/v1/x402/", "/dashboard", "/donatex",
                   "/docs", "/openapi.json", "/redoc")
    missing = []
    for route in app.routes:
        path = getattr(route, "path", "")
        if not (path.startswith("/v1") or path.startswith("/api/v1")):
            continue
        canon = path.replace("/api/v1/", "/v1/")
        if canon in PRICES or canon in FREE_EXACT:
            continue
        if canon.startswith(FREE_PREFIX):
            continue
        missing.append(path)
    assert not missing, f"UNPRICED routes (fail-open!): {missing}"
