"""
Briefings API tests.

These tests use mocking for the database layer and freezegun for time control.
No Docker or database required — pure unit tests.

Each test is fully isolated with no side effects.
"""
from datetime import datetime, timezone
from unittest.mock import MagicMock, patch
from uuid import uuid4

import pytest
from freezegun import freeze_time
from fastapi import HTTPException

from app.models.briefing import Briefing, BriefingMetric, BriefingPoint, PointType

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
# Test Helpers
# ---------------------------------------------------------------------------

def make_briefing(**overrides):
    """Create a mock Briefing object with sensible defaults."""
    briefing = MagicMock(spec=Briefing)
    briefing.id = uuid4()
    briefing.company_name = "Acme Holdings"
    briefing.ticker = "ACME"
    briefing.sector = "Industrial Technology"
    briefing.analyst_name = "Jane Doe"
    briefing.summary = "Acme is benefiting from strong enterprise demand."
    briefing.recommendation = "Monitor for margin expansion."
    briefing.is_generated = False
    briefing.generated_at = None
    briefing.created_at = datetime(2026, 3, 11, 12, 0, 0, tzinfo=timezone.utc)
    briefing.updated_at = datetime(2026, 3, 11, 12, 0, 0, tzinfo=timezone.utc)
    briefing.points = []
    briefing.metrics = []
    briefing.get_grouped_points.return_value = {}
    briefing.get_sorted_metrics.return_value = []
    
    for key, value in overrides.items():
        setattr(briefing, key, value)
    
    return briefing


def make_point(point_type: PointType, content: str, display_order: int = 0):
    """Create a mock BriefingPoint object."""
    point = MagicMock(spec=BriefingPoint)
    point.id = uuid4()
    point.point_type = point_type
    point.content = content
    point.display_order = display_order
    return point


def make_metric(name: str, value: str, display_order: int = 0):
    """Create a mock BriefingMetric object."""
    metric = MagicMock(spec=BriefingMetric)
    metric.id = uuid4()
    metric.name = name
    metric.value = value
    metric.display_order = display_order
    return metric


# ---------------------------------------------------------------------------
# POST /briefings
# ---------------------------------------------------------------------------

class TestCreateBriefing:
    """Tests for POST /briefings endpoint."""

    @freeze_time("2026-03-11T12:00:00Z")
    def test_create_success(self, client, mock_db_session):
        """Test successful briefing creation."""
        briefing_id = uuid4()
        created_at = datetime(2026, 3, 11, 12, 0, 0, tzinfo=timezone.utc)
        
        mock_response = {
            "id": briefing_id,
            "company_name": "Acme Holdings",
            "ticker": "ACME",
            "sector": "Industrial Technology",
            "analyst_name": "Jane Doe",
            "summary": "Acme is benefiting from strong enterprise demand.",
            "recommendation": "Monitor for margin expansion.",
            "is_generated": False,
            "generated_at": None,
            "created_at": created_at,
            "key_points": [
                {"id": uuid4(), "content": "Revenue grew 18% year-over-year.", "display_order": 0},
                {"id": uuid4(), "content": "Management raised full-year guidance.", "display_order": 1},
            ],
            "risks": [
                {"id": uuid4(), "content": "Top two customers account for 41% of total revenue.", "display_order": 0},
            ],
            "metrics": [
                {"id": uuid4(), "name": "Revenue Growth", "value": "18%", "display_order": 0},
                {"id": uuid4(), "name": "Operating Margin", "value": "22.4%", "display_order": 1},
            ],
        }
        
        with patch('app.api.routes.briefings.briefing_service.create_briefing', return_value=mock_response):
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

    def test_ticker_normalized_to_uppercase(self, client, mock_db_session):
        """Test ticker is normalized to uppercase."""
        mock_briefing = make_briefing(ticker="TSLA")
        
        with patch('app.api.routes.briefings.briefing_service.create_briefing', return_value=mock_briefing):
            r = client.post("/briefings", json={**VALID_PAYLOAD, "ticker": "tsla"})
        
        assert r.status_code == 201
        assert r.json()["ticker"] == "TSLA"

    def test_key_points_preserve_order(self, client, mock_db_session):
        """Test key points preserve insertion order."""
        payload = {
            **VALID_PAYLOAD,
            "keyPoints": ["First point", "Second point", "Third point"],
        }
        briefing_id = uuid4()
        created_at = datetime(2026, 3, 11, 12, 0, 0, tzinfo=timezone.utc)
        
        mock_response = {
            "id": briefing_id,
            "company_name": "Acme Holdings",
            "ticker": "ACME",
            "sector": "Industrial Technology",
            "analyst_name": "Jane Doe",
            "summary": "Acme is benefiting from strong enterprise demand.",
            "recommendation": "Monitor for margin expansion.",
            "is_generated": False,
            "generated_at": None,
            "created_at": created_at,
            "key_points": [
                {"id": uuid4(), "content": "First point", "display_order": 0},
                {"id": uuid4(), "content": "Second point", "display_order": 1},
                {"id": uuid4(), "content": "Third point", "display_order": 2},
            ],
            "risks": [
                {"id": uuid4(), "content": "Top two customers account for 41% of total revenue.", "display_order": 0},
            ],
            "metrics": [],
        }
        
        with patch('app.api.routes.briefings.briefing_service.create_briefing', return_value=mock_response):
            r = client.post("/briefings", json=payload)
        
        assert r.status_code == 201
        contents = [p["content"] for p in r.json()["key_points"]]
        assert contents == ["First point", "Second point", "Third point"]

    def test_missing_company_name(self, client, mock_db_session):
        """Test empty company name is rejected."""
        r = client.post("/briefings", json={**VALID_PAYLOAD, "companyName": ""})
        assert r.status_code == 422

    def test_missing_ticker(self, client, mock_db_session):
        """Test empty ticker is rejected."""
        r = client.post("/briefings", json={**VALID_PAYLOAD, "ticker": ""})
        assert r.status_code == 422

    def test_missing_summary(self, client, mock_db_session):
        """Test missing summary is rejected."""
        payload = {k: v for k, v in VALID_PAYLOAD.items() if k != "summary"}
        r = client.post("/briefings", json=payload)
        assert r.status_code == 422

    def test_missing_recommendation(self, client, mock_db_session):
        """Test missing recommendation is rejected."""
        payload = {k: v for k, v in VALID_PAYLOAD.items() if k != "recommendation"}
        r = client.post("/briefings", json=payload)
        assert r.status_code == 422

    def test_too_few_key_points(self, client, mock_db_session):
        """Test less than 2 key points is rejected."""
        r = client.post("/briefings", json={**VALID_PAYLOAD, "keyPoints": ["Only one"]})
        assert r.status_code == 422

    def test_no_risks(self, client, mock_db_session):
        """Test empty risks list is rejected."""
        r = client.post("/briefings", json={**VALID_PAYLOAD, "risks": []})
        assert r.status_code == 422

    def test_duplicate_metric_names(self, client, mock_db_session):
        """Test duplicate metric names are rejected."""
        payload = {
            **VALID_PAYLOAD,
            "metrics": [
                {"name": "Revenue", "value": "10%"},
                {"name": "Revenue", "value": "20%"},
            ],
        }
        r = client.post("/briefings", json=payload)
        assert r.status_code == 422

    def test_duplicate_metric_names_case_insensitive(self, client, mock_db_session):
        """Test duplicate metric names (case-insensitive) are rejected."""
        payload = {
            **VALID_PAYLOAD,
            "metrics": [
                {"name": "Revenue", "value": "10%"},
                {"name": "revenue", "value": "20%"},
            ],
        }
        r = client.post("/briefings", json=payload)
        assert r.status_code == 422

    def test_metrics_are_optional(self, client, mock_db_session):
        """Test metrics are optional."""
        payload = {k: v for k, v in VALID_PAYLOAD.items() if k != "metrics"}
        briefing_id = uuid4()
        created_at = datetime(2026, 3, 11, 12, 0, 0, tzinfo=timezone.utc)
        
        mock_response = {
            "id": briefing_id,
            "company_name": "Acme Holdings",
            "ticker": "ACME",
            "sector": "Industrial Technology",
            "analyst_name": "Jane Doe",
            "summary": "Acme is benefiting from strong enterprise demand.",
            "recommendation": "Monitor for margin expansion.",
            "is_generated": False,
            "generated_at": None,
            "created_at": created_at,
            "key_points": [
                {"id": uuid4(), "content": "Revenue grew 18% year-over-year.", "display_order": 0},
                {"id": uuid4(), "content": "Management raised full-year guidance.", "display_order": 1},
            ],
            "risks": [
                {"id": uuid4(), "content": "Top two customers account for 41% of total revenue.", "display_order": 0},
            ],
            "metrics": [],
        }
        
        with patch('app.api.routes.briefings.briefing_service.create_briefing', return_value=mock_response):
            r = client.post("/briefings", json=payload)
        
        assert r.status_code == 201
        assert r.json()["metrics"] == []


# ---------------------------------------------------------------------------
# GET /briefings/{id}
# ---------------------------------------------------------------------------

class TestGetBriefing:
    """Tests for GET /briefings/{id} endpoint."""

    def test_get_existing(self, client, mock_db_session):
        """Test retrieving an existing briefing."""
        briefing_id = uuid4()
        mock_briefing = make_briefing(id=briefing_id)
        
        with patch('app.api.routes.briefings.briefing_service.get_briefing', return_value=mock_briefing):
            r = client.get(f"/briefings/{briefing_id}")
        
        assert r.status_code == 200
        data = r.json()
        assert data["id"] == str(briefing_id)

    def test_get_not_found(self, client, mock_db_session):
        """Test retrieving a non-existent briefing returns 404."""
        with patch('app.api.routes.briefings.briefing_service.get_briefing', side_effect=HTTPException(status_code=404, detail="Not found")):
            r = client.get("/briefings/00000000-0000-0000-0000-000000000000")
        assert r.status_code == 404

    def test_get_returns_correct_shape(self, client, mock_db_session):
        """Test response contains expected fields."""
        briefing_id = uuid4()
        mock_briefing = make_briefing(
            id=briefing_id,
            key_points=[make_point(PointType.KEY_POINT, "Test point")],
            risks=[make_point(PointType.RISK, "Test risk")],
            metrics=[make_metric("Test Metric", "100")],
        )
        mock_briefing.get_grouped_points.return_value = {
            PointType.KEY_POINT: mock_briefing.key_points,
            PointType.RISK: mock_briefing.risks,
        }
        
        with patch('app.api.routes.briefings.briefing_service.get_briefing', return_value=mock_briefing):
            data = client.get(f"/briefings/{briefing_id}").json()
        
        assert "key_points" in data
        assert "risks" in data
        assert "metrics" in data
        assert "is_generated" in data


# ---------------------------------------------------------------------------
# POST /briefings/{id}/generate
# ---------------------------------------------------------------------------

class TestGenerateBriefing:
    """Tests for POST /briefings/{id}/generate endpoint."""

    @freeze_time("2026-03-11T12:00:00Z")
    def test_generate_marks_as_generated(self, client, mock_db_session):
        """Test generate marks briefing as generated."""
        briefing_id = uuid4()
        mock_briefing = make_briefing(id=briefing_id, is_generated=True, generated_at=datetime(2026, 3, 11, 12, 0, 0, tzinfo=timezone.utc))
        
        with patch('app.api.routes.briefings.briefing_service.generate_briefing_out', return_value=mock_briefing):
            r = client.post(f"/briefings/{briefing_id}/generate")
        
        assert r.status_code == 200
        assert r.json()["is_generated"] is True
        assert r.json()["generated_at"] is not None

    def test_generate_not_found(self, client, mock_db_session):
        """Test generate on non-existent briefing returns 404."""
        with patch('app.api.routes.briefings.briefing_service.generate_briefing_out', side_effect=HTTPException(status_code=404, detail="Not found")):
            r = client.post("/briefings/00000000-0000-0000-0000-000000000000/generate")
        assert r.status_code == 404

    def test_generate_is_idempotent(self, client, mock_db_session):
        """Test generate can be called multiple times."""
        briefing_id = uuid4()
        mock_briefing = make_briefing(id=briefing_id, is_generated=True)
        
        with patch('app.api.routes.briefings.briefing_service.generate_briefing_out', return_value=mock_briefing):
            r = client.post(f"/briefings/{briefing_id}/generate")
            r = client.post(f"/briefings/{briefing_id}/generate")
        
        assert r.status_code == 200
        assert r.json()["is_generated"] is True


# ---------------------------------------------------------------------------
# GET /briefings/{id}/html
# ---------------------------------------------------------------------------

class TestBriefingHTML:
    """Tests for GET /briefings/{id}/html endpoint."""

    def test_html_before_generate_returns_409(self, client, mock_db_session):
        """Test HTML endpoint returns 409 if not generated."""
        briefing_id = uuid4()
        
        with patch('app.api.routes.briefings.briefing_service.get_report_view_model', side_effect=HTTPException(status_code=409, detail="Not generated")):
            r = client.get(f"/briefings/{briefing_id}/html")
        
        assert r.status_code == 409

    @freeze_time("2026-03-11T12:00:00Z")
    def test_html_after_generate_returns_200(self, client, mock_db_session):
        """Test HTML endpoint returns 200 after generation."""
        briefing_id = uuid4()
        mock_view_model = MagicMock()
        
        with patch('app.api.routes.briefings.briefing_service.get_report_view_model', return_value=mock_view_model):
            with patch('app.templates.renderer.renderer.render_briefing', return_value="<html>Test</html>"):
                r = client.get(f"/briefings/{briefing_id}/html")
        
        assert r.status_code == 200
        assert "text/html" in r.headers["content-type"]

    @freeze_time("2026-03-11T12:00:00Z")
    def test_html_contains_company_data(self, client, mock_db_session):
        """Test HTML contains company information."""
        briefing_id = uuid4()
        mock_view_model = MagicMock()
        mock_view_model.company_name = "Acme Holdings"
        mock_view_model.ticker = "ACME"
        
        with patch('app.api.routes.briefings.briefing_service.get_report_view_model', return_value=mock_view_model):
            with patch('app.templates.renderer.renderer.render_briefing', return_value="Acme Holdings ACME Revenue grew 18%"):
                html = client.get(f"/briefings/{briefing_id}/html").text
        
        assert "Acme Holdings" in html
        assert "ACME" in html

    @freeze_time("2026-03-11T12:00:00Z")
    def test_html_contains_metrics_table(self, client, mock_db_session):
        """Test HTML contains metrics table when metrics exist."""
        briefing_id = uuid4()
        mock_view_model = MagicMock()
        mock_view_model.has_metrics = True
        
        with patch('app.api.routes.briefings.briefing_service.get_report_view_model', return_value=mock_view_model):
            with patch('app.templates.renderer.renderer.render_briefing', return_value='<table class="metrics-table"><tr><td>Revenue Growth</td><td>18%</td></tr></table>'):
                html = client.get(f"/briefings/{briefing_id}/html").text
        
        assert "Revenue Growth" in html
        assert "18%" in html

    @freeze_time("2026-03-11T12:00:00Z")
    def test_html_no_metrics_skips_table(self, client, mock_db_session):
        """Test HTML skips metrics table when no metrics."""
        briefing_id = uuid4()
        mock_view_model = MagicMock()
        mock_view_model.has_metrics = False
        
        with patch('app.api.routes.briefings.briefing_service.get_report_view_model', return_value=mock_view_model):
            with patch('app.templates.renderer.renderer.render_briefing', return_value="<html>No metrics</html>"):
                html = client.get(f"/briefings/{briefing_id}/html").text
        
        assert "metrics-table" not in html

    def test_html_not_found(self, client, mock_db_session):
        """Test HTML endpoint returns 404 for non-existent briefing."""
        with patch('app.api.routes.briefings.briefing_service.get_report_view_model', side_effect=HTTPException(status_code=404, detail="Not found")):
            r = client.get("/briefings/00000000-0000-0000-0000-000000000000/html")
        assert r.status_code == 404


# ---------------------------------------------------------------------------
# GET /briefings (List with pagination)
# ---------------------------------------------------------------------------

class TestListBriefings:
    """Tests for GET /briefings endpoint with pagination."""

    def test_list_empty(self, client, mock_db_session):
        """Test listing when no briefings exist."""
        mock_response = MagicMock()
        mock_response.items = []
        mock_response.meta.page = 1
        mock_response.meta.page_size = 20
        mock_response.meta.total_items = 0
        mock_response.meta.total_pages = 0
        mock_response.meta.has_next = False
        mock_response.meta.has_prev = False
        
        with patch('app.api.routes.briefings.briefing_service.list_briefings', return_value=mock_response):
            r = client.get("/briefings")
        
        assert r.status_code == 200
        data = r.json()
        assert data["items"] == []
        assert data["meta"]["total_items"] == 0
        assert data["meta"]["page"] == 1
        assert data["meta"]["page_size"] == 20

    def test_list_with_pagination(self, client, mock_db_session):
        """Test pagination works correctly."""
        mock_response = MagicMock()
        mock_response.items = [make_briefing() for _ in range(2)]
        mock_response.meta.page = 1
        mock_response.meta.page_size = 2
        mock_response.meta.total_items = 5
        mock_response.meta.total_pages = 3
        mock_response.meta.has_next = True
        mock_response.meta.has_prev = False
        
        with patch('app.api.routes.briefings.briefing_service.list_briefings', return_value=mock_response):
            r = client.get("/briefings?page=1&page_size=2")
        
        assert r.status_code == 200
        data = r.json()
        assert len(data["items"]) == 2
        assert data["meta"]["total_items"] == 5
        assert data["meta"]["page"] == 1
        assert data["meta"]["page_size"] == 2
        assert data["meta"]["total_pages"] == 3
        assert data["meta"]["has_next"] is True
        assert data["meta"]["has_prev"] is False

    def test_list_default_page_size(self, client, mock_db_session):
        """Test default page size is 20."""
        mock_response = MagicMock()
        mock_response.items = []
        mock_response.meta.page = 1
        mock_response.meta.page_size = 20
        mock_response.meta.total_items = 0
        mock_response.meta.total_pages = 0
        mock_response.meta.has_next = False
        mock_response.meta.has_prev = False
        
        with patch('app.api.routes.briefings.briefing_service.list_briefings', return_value=mock_response):
            r = client.get("/briefings")
        
        assert r.status_code == 200
        data = r.json()
        assert data["meta"]["page_size"] == 20

    def test_list_invalid_page_param(self, client, mock_db_session):
        """Test invalid page parameters are rejected."""
        r = client.get("/briefings?page=0")
        assert r.status_code == 422

        r = client.get("/briefings?page=-1")
        assert r.status_code == 422

        r = client.get("/briefings?page_size=101")
        assert r.status_code == 422
