"""
Briefings API tests.

These tests run against a real PostgreSQL instance managed by Testcontainers.
Docker must be running. No SQLite compatibility issues, no monkey-patching.

Each test is wrapped in a rolled-back transaction (see conftest.py),
so tests are fully isolated and leave no data behind.
"""

VALID_PAYLOAD = {
    "companyName": "Acme Holdings",
    "ticker": "acme",
    "sector": "Industrial Technology",
    "analystName": "Jane Doe",
    "summary": "Acme is benefiting from strong enterprise demand.",
    "recommendation": "Monitor for margin expansion.",
    "keyPoints": [
        "Revenue grew 18% year-over-year.",
        "Management raised full-year guidance.",
    ],
    "risks": ["Top two customers account for 41% of total revenue."],
    "metrics": [
        {"name": "Revenue Growth", "value": "18%"},
        {"name": "Operating Margin", "value": "22.4%"},
    ],
}


# ---------------------------------------------------------------------------
# POST /briefings
# ---------------------------------------------------------------------------

class TestCreateBriefing:

    def test_create_success(self, client):
        r = client.post("/briefings", json=VALID_PAYLOAD)
        assert r.status_code == 201
        data = r.json()
        assert data["ticker"] == "ACME"
        assert data["company_name"] == "Acme Holdings"
        assert len(data["key_points"]) == 2
        assert len(data["risks"]) == 1
        assert len(data["metrics"]) == 2
        assert data["is_generated"] is False
        assert data["generated_at"] is None

    def test_ticker_normalized_to_uppercase(self, client):
        r = client.post("/briefings", json={**VALID_PAYLOAD, "ticker": "tsla"})
        assert r.status_code == 201
        assert r.json()["ticker"] == "TSLA"

    def test_key_points_preserve_order(self, client):
        payload = {
            **VALID_PAYLOAD,
            "keyPoints": ["First point", "Second point", "Third point"],
        }
        r = client.post("/briefings", json=payload)
        assert r.status_code == 201
        contents = [p["content"] for p in r.json()["key_points"]]
        assert contents == ["First point", "Second point", "Third point"]

    def test_missing_company_name(self, client):
        r = client.post("/briefings", json={**VALID_PAYLOAD, "companyName": ""})
        assert r.status_code == 422

    def test_missing_ticker(self, client):
        r = client.post("/briefings", json={**VALID_PAYLOAD, "ticker": ""})
        assert r.status_code == 422

    def test_missing_summary(self, client):
        payload = {k: v for k, v in VALID_PAYLOAD.items() if k != "summary"}
        r = client.post("/briefings", json=payload)
        assert r.status_code == 422

    def test_missing_recommendation(self, client):
        payload = {k: v for k, v in VALID_PAYLOAD.items() if k != "recommendation"}
        r = client.post("/briefings", json=payload)
        assert r.status_code == 422

    def test_too_few_key_points(self, client):
        r = client.post("/briefings", json={**VALID_PAYLOAD, "keyPoints": ["Only one"]})
        assert r.status_code == 422

    def test_no_risks(self, client):
        r = client.post("/briefings", json={**VALID_PAYLOAD, "risks": []})
        assert r.status_code == 422

    def test_duplicate_metric_names(self, client):
        payload = {
            **VALID_PAYLOAD,
            "metrics": [
                {"name": "Revenue", "value": "10%"},
                {"name": "Revenue", "value": "20%"},
            ],
        }
        r = client.post("/briefings", json=payload)
        assert r.status_code == 422

    def test_duplicate_metric_names_case_insensitive(self, client):
        payload = {
            **VALID_PAYLOAD,
            "metrics": [
                {"name": "Revenue", "value": "10%"},
                {"name": "revenue", "value": "20%"},
            ],
        }
        r = client.post("/briefings", json=payload)
        assert r.status_code == 422

    def test_metrics_are_optional(self, client):
        payload = {k: v for k, v in VALID_PAYLOAD.items() if k != "metrics"}
        r = client.post("/briefings", json=payload)
        assert r.status_code == 201
        assert r.json()["metrics"] == []


# ---------------------------------------------------------------------------
# GET /briefings/{id}
# ---------------------------------------------------------------------------

class TestGetBriefing:

    def test_get_existing(self, client):
        briefing_id = client.post("/briefings", json=VALID_PAYLOAD).json()["id"]
        r = client.get(f"/briefings/{briefing_id}")
        assert r.status_code == 200
        assert r.json()["id"] == briefing_id

    def test_get_not_found(self, client):
        r = client.get("/briefings/00000000-0000-0000-0000-000000000000")
        assert r.status_code == 404

    def test_get_returns_correct_shape(self, client):
        briefing_id = client.post("/briefings", json=VALID_PAYLOAD).json()["id"]
        data = client.get(f"/briefings/{briefing_id}").json()
        assert "key_points" in data
        assert "risks" in data
        assert "metrics" in data
        assert "is_generated" in data


# ---------------------------------------------------------------------------
# POST /briefings/{id}/generate
# ---------------------------------------------------------------------------

class TestGenerateBriefing:

    def test_generate_marks_as_generated(self, client):
        briefing_id = client.post("/briefings", json=VALID_PAYLOAD).json()["id"]
        r = client.post(f"/briefings/{briefing_id}/generate")
        assert r.status_code == 200
        assert r.json()["is_generated"] is True
        assert r.json()["generated_at"] is not None

    def test_generate_not_found(self, client):
        r = client.post("/briefings/00000000-0000-0000-0000-000000000000/generate")
        assert r.status_code == 404

    def test_generate_is_idempotent(self, client):
        briefing_id = client.post("/briefings", json=VALID_PAYLOAD).json()["id"]
        client.post(f"/briefings/{briefing_id}/generate")
        r = client.post(f"/briefings/{briefing_id}/generate")
        assert r.status_code == 200
        assert r.json()["is_generated"] is True


# ---------------------------------------------------------------------------
# GET /briefings/{id}/html
# ---------------------------------------------------------------------------

class TestBriefingHTML:

    def test_html_before_generate_returns_409(self, client):
        briefing_id = client.post("/briefings", json=VALID_PAYLOAD).json()["id"]
        r = client.get(f"/briefings/{briefing_id}/html")
        assert r.status_code == 409

    def test_html_after_generate_returns_200(self, client):
        briefing_id = client.post("/briefings", json=VALID_PAYLOAD).json()["id"]
        client.post(f"/briefings/{briefing_id}/generate")
        r = client.get(f"/briefings/{briefing_id}/html")
        assert r.status_code == 200
        assert "text/html" in r.headers["content-type"]

    def test_html_contains_company_data(self, client):
        briefing_id = client.post("/briefings", json=VALID_PAYLOAD).json()["id"]
        client.post(f"/briefings/{briefing_id}/generate")
        html = client.get(f"/briefings/{briefing_id}/html").text
        assert "Acme Holdings" in html
        assert "ACME" in html
        assert "Revenue grew 18%" in html
        assert "Top two customers" in html
        assert "Monitor for margin expansion" in html

    def test_html_contains_metrics_table(self, client):
        briefing_id = client.post("/briefings", json=VALID_PAYLOAD).json()["id"]
        client.post(f"/briefings/{briefing_id}/generate")
        html = client.get(f"/briefings/{briefing_id}/html").text
        assert "Revenue Growth" in html
        assert "18%" in html

    def test_html_no_metrics_skips_table(self, client):
        payload = {k: v for k, v in VALID_PAYLOAD.items() if k != "metrics"}
        briefing_id = client.post("/briefings", json=payload).json()["id"]
        client.post(f"/briefings/{briefing_id}/generate")
        html = client.get(f"/briefings/{briefing_id}/html").text
        assert "metrics-table" not in html

    def test_html_not_found(self, client):
        r = client.get("/briefings/00000000-0000-0000-0000-000000000000/html")
        assert r.status_code == 404
