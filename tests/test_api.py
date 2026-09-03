"""aetheriusxAPI test suite.

Deterministic gates (no network needed):
  - /health is free (200, no payment header)
  - all 11 paid endpoints return 402 without X-PAYMENT, with x402 body shape
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

client = TestClient(app)
PAID = {"X-PAYMENT": "simulated-payment"}


def test_health_free():
    r = client.get("/health")
    assert r.status_code == 200
    body = r.json()
    assert body["status"] == "alive"
    assert body["service"] == "aetheriusxAPI"
    assert len(body["endpoints"]) == 17


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
    }
    r = client.get(route, params=params[route])
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
                   headers=PAID)
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
    r = client.get("/v1/token/price",
                   params={"address": "0xabc", "chain": "solana"},
                   headers=PAID)
    assert r.status_code in (200, 404, 500, 502)
    assert "error" in r.json() or "price_usd" in r.json()

    r = client.get("/v1/token/holders",
                   params={"address": "0xabc"}, headers=PAID)
    assert r.status_code in (200, 501, 502)
    assert "error" in r.json() or "holders" in r.json()

    r = client.get("/v1/web/scrape",
                   params={"url": "http://invalid.invalid"},
                   headers=PAID)
    assert r.status_code in (200, 500, 502)
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
