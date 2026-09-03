from fastapi.testclient import TestClient

from main import app


client = TestClient(app)
PAYMENT = {"X-PAYMENT": "simulated-payment"}
ADDRESS = "0x0000000000000000000000000000000000000001"


def get(path: str):
    return client.get(path, headers=PAYMENT)


def test_payment_is_required_before_endpoint_execution():
    response = client.get("/v1/email/validate", params={"email": "user@example.com"})

    assert response.status_code == 402
    assert response.json()["currency"] == "USDC"
    assert response.json()["mode"] == "simulated"
    assert response.headers["X-PAYMENT-REQUIRED"] == "true"


def test_maps_search():
    response = get("/v1/maps/search?q=coffee&location=Mexico City")

    assert response.status_code == 200
    body = response.json()
    assert body["query"] == "coffee"
    assert body["count"] == len(body["results"])
    assert {"name", "address", "lat", "lon"} <= body["results"][0].keys()


def test_maps_reviews():
    body = get("/v1/maps/reviews?place_name=Zocalo").json()

    assert body["count"] == 1
    assert body["results"][0]["type"] == "place"
    assert isinstance(body["results"][0]["importance"], float)


def test_maps_nearby():
    body = get("/v1/maps/nearby?lat=19.4326&lon=-99.1332&radius=500&category=cafe").json()

    assert body["center"] == {"lat": 19.4326, "lon": -99.1332}
    assert body["radius"] == 500
    assert body["category"] == "cafe"
    assert all("distance_m" in item for item in body["results"])


def test_token_analyze():
    body = get(f"/v1/token/analyze?address={ADDRESS}").json()

    assert body["address"] == ADDRESS
    assert body["checks"]["verified"] is True
    assert body["risk_level"] == "low"
    assert 0 <= body["risk_score"] <= 100


def test_token_holders():
    body = get(f"/v1/token/holders?address={ADDRESS}&chain=base").json()

    assert body["chain"] == "base"
    assert body["holder_count"] > 0
    assert body["top_holders"][0]["rank"] == 1
    assert "share_percent" in body["top_holders"][0]


def test_token_price():
    body = get(f"/v1/token/price?address={ADDRESS}").json()

    assert body["symbol"] == "AETH"
    assert body["price_usd"] > 0
    assert "change_24h" in body


def test_web_scrape():
    body = get("/v1/web/scrape?url=https://example.com").json()

    assert body["status"] == 200
    assert body["title"] == "Example Domain"
    assert body["links_count"] == len(body["links"])
    assert body["content_length"] > len(body["text_preview"])


def test_web_screenshot():
    body = get("/v1/web/screenshot?url=https://example.com&width=800&height=600").json()

    assert body["status"] == 200
    assert body["width"] == 800
    assert body["height"] == 600
    assert body["content_type"] == "image/png"


def test_email_validate():
    body = get("/v1/email/validate?email=user@example.com").json()

    assert body == {
        "email": "user@example.com",
        "valid_syntax": True,
        "has_mx": True,
        "is_disposable": False,
        "risk_score": 10,
        "verdict": "valid",
    }


def test_weather():
    body = get("/v1/data/weather?lat=19.4326&lon=-99.1332").json()

    assert body["location"] == {"lat": 19.4326, "lon": -99.1332}
    assert body["current"]["temperature_c"] > -100
    assert len(body["forecast"]) == 2
    assert "precipitation_probability" in body["forecast"][0]


def test_invalid_input_returns_bad_request():
    response = get(f"/v1/token/price?address=not-an-address")

    assert response.status_code == 400
    assert "valid EVM contract address" in response.json()["detail"]


def test_json_simulated_payment_can_encode_amount():
    response = client.get(
        "/v1/email/validate?email=user@example.com",
        headers={"X-PAYMENT": '{"scheme":"simulated","amount":"0.005"}'},
    )

    assert response.status_code == 200
    assert response.headers["X-PAYMENT-RESPONSE"]
