"""aetheriusxAPI test suite.

Deterministic gates (no network needed):
  - /health is free (200, no payment header)
  - all 10 paid endpoints return 402 without X-PAYMENT, with x402 body shape
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
    assert len(body["endpoints"]) == 10


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


def test_live_email_valid_shape():
    r = client.get("/v1/email/validate", params={"email": "user@gmail.com"},
                   headers=PAID)
    assert_live_or_upstream_error(r, ["valid_syntax", "verdict"])


def test_live_weather_shape():
    r = client.get("/v1/data/weather",
                   params={"lat": 19.43, "lon": -99.13}, headers=PAID)
    assert_live_or_upstream_error(r, ["current", "data_source"])
