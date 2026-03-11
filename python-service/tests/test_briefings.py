from collections.abc import Generator

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from app.db.base import Base
from app.db.session import get_db
from app.main import app
from app.models.briefing import Briefing, BriefingPoint, BriefingMetric  # noqa: F401


@pytest.fixture()
def client() -> Generator[TestClient, None, None]:
    engine = create_engine(
        "sqlite+pysqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    testing_session_local = sessionmaker(bind=engine, autoflush=False, autocommit=False, future=True)

    Base.metadata.create_all(bind=engine)

    def override_get_db() -> Generator[Session, None, None]:
        db = testing_session_local()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db

    with TestClient(app) as test_client:
        yield test_client

    app.dependency_overrides.clear()
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def valid_briefing_data():
    """Valid briefing data for testing."""
    return {
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
        "risks": [
            "Top customers account for 41% of revenue.",
        ],
        "metrics": [
            {"name": "Revenue Growth", "value": "18%"},
            {"name": "Operating Margin", "value": "22.4%"},
        ],
    }


class TestCreateBriefing:
    """Tests for POST /briefings endpoint."""

    def test_create_briefing_success(self, client, valid_briefing_data):
        """Test successful briefing creation."""
        response = client.post("/briefings", json=valid_briefing_data)
        assert response.status_code == 201
        data = response.json()
        
        assert data["company_name"] == "Acme Holdings"
        assert data["ticker"] == "ACME"  # Should be normalized to uppercase
        assert data["sector"] == "Industrial Technology"
        assert data["analyst_name"] == "Jane Doe"
        assert not data["is_generated"]
        assert len(data["key_points"]) == 2
        assert len(data["risks"]) == 1
        assert len(data["metrics"]) == 2
        assert "id" in data
        assert "created_at" in data

    def test_create_briefing_normalizes_ticker(self, client, valid_briefing_data):
        """Test that ticker is normalized to uppercase."""
        valid_briefing_data["ticker"] = "lowcase"
        response = client.post("/briefings", json=valid_briefing_data)
        assert response.status_code == 201
        data = response.json()
        assert data["ticker"] == "LOWCASE"

    def test_create_briefing_without_metrics(self, client, valid_briefing_data):
        """Test briefing creation without optional metrics."""
        del valid_briefing_data["metrics"]
        response = client.post("/briefings", json=valid_briefing_data)
        assert response.status_code == 201
        data = response.json()
        assert data["metrics"] == []

    def test_create_briefing_duplicate_metric_names_fails(
        self, client, valid_briefing_data
    ):
        """Test that duplicate metric names are rejected."""
        valid_briefing_data["metrics"] = [
            {"name": "Revenue", "value": "10%"},
            {"name": "revenue", "value": "20%"},  # Duplicate (case-insensitive)
        ]
        response = client.post("/briefings", json=valid_briefing_data)
        assert response.status_code == 422
        data = response.json()
        assert any("unique" in str(err).lower() for err in data["detail"])

    def test_create_briefing_empty_company_name_fails(
        self, client, valid_briefing_data
    ):
        """Test that empty company name is rejected."""
        valid_briefing_data["companyName"] = ""
        response = client.post("/briefings", json=valid_briefing_data)
        assert response.status_code == 422

    def test_create_briefing_insufficient_key_points_fails(
        self, client, valid_briefing_data
    ):
        """Test that less than 2 key points is rejected."""
        valid_briefing_data["keyPoints"] = ["Only one point"]
        response = client.post("/briefings", json=valid_briefing_data)
        assert response.status_code == 422
        data = response.json()
        assert any("2 key points" in str(err) for err in data["detail"])

    def test_create_briefing_no_risks_fails(self, client, valid_briefing_data):
        """Test that zero risks is rejected."""
        valid_briefing_data["risks"] = []
        response = client.post("/briefings", json=valid_briefing_data)
        assert response.status_code == 422
        data = response.json()
        assert any("1 risk" in str(err) for err in data["detail"])


class TestGetBriefing:
    """Tests for GET /briefings/{id} endpoint."""

    def test_get_briefing_success(self, client, valid_briefing_data):
        """Test successful briefing retrieval."""
        # Create briefing first
        create_response = client.post("/briefings", json=valid_briefing_data)
        briefing_id = create_response.json()["id"]

        # Retrieve briefing
        response = client.get(f"/briefings/{briefing_id}")
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == briefing_id
        assert data["company_name"] == "Acme Holdings"

    def test_get_briefing_not_found(self, client):
        """Test 404 for non-existent briefing."""
        from uuid import uuid4
        response = client.get(f"/briefings/{uuid4()}")
        assert response.status_code == 404
        assert "not found" in response.json()["detail"].lower()


class TestGenerateBriefing:
    """Tests for POST /briefings/{id}/generate endpoint."""

    def test_generate_briefing_success(self, client, valid_briefing_data):
        """Test successful briefing generation."""
        # Create briefing first
        create_response = client.post("/briefings", json=valid_briefing_data)
        briefing_id = create_response.json()["id"]

        # Generate briefing
        response = client.post(f"/briefings/{briefing_id}/generate")
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == briefing_id
        assert data["is_generated"] is True
        assert data["generated_at"] is not None

    def test_generate_briefing_not_found(self, client):
        """Test 404 for non-existent briefing."""
        from uuid import uuid4
        response = client.post(f"/briefings/{uuid4()}/generate")
        assert response.status_code == 404

    def test_generate_briefing_updates_status(self, client, valid_briefing_data):
        """Test that generation updates briefing status."""
        create_response = client.post("/briefings", json=valid_briefing_data)
        briefing_id = create_response.json()["id"]

        # Before generation
        assert not create_response.json()["is_generated"]

        # Generate
        client.post(f"/briefings/{briefing_id}/generate")

        # After generation
        response = client.get(f"/briefings/{briefing_id}")
        assert response.json()["is_generated"] is True


class TestGetBriefingHtml:
    """Tests for GET /briefings/{id}/html endpoint."""

    def test_get_briefing_html_success(self, client, valid_briefing_data):
        """Test successful HTML generation."""
        # Create and generate briefing
        create_response = client.post("/briefings", json=valid_briefing_data)
        briefing_id = create_response.json()["id"]
        client.post(f"/briefings/{briefing_id}/generate")

        # Get HTML
        response = client.get(f"/briefings/{briefing_id}/html")
        assert response.status_code == 200
        assert response.headers["content-type"].startswith("text/html")
        html = response.text
        assert "<!DOCTYPE html>" in html
        assert "Acme Holdings" in html
        assert "ACME" in html

    def test_get_briefing_html_not_generated(self, client, valid_briefing_data):
        """Test 409 when briefing not generated."""
        create_response = client.post("/briefings", json=valid_briefing_data)
        briefing_id = create_response.json()["id"]

        response = client.get(f"/briefings/{briefing_id}/html")
        assert response.status_code == 409
        assert "not been generated" in response.json()["detail"]

    def test_get_briefing_html_not_found(self, client):
        """Test 404 for non-existent briefing."""
        from uuid import uuid4
        response = client.get(f"/briefings/{uuid4()}/html")
        assert response.status_code == 404


class TestListBriefings:
    """Tests for GET /briefings endpoint."""

    def test_list_briefings_empty(self, client):
        """Test listing when no briefings exist."""
        response = client.get("/briefings")
        assert response.status_code == 200
        data = response.json()
        assert data["items"] == []
        assert data["meta"]["total_items"] == 0

    def test_list_briefings_with_data(self, client, valid_briefing_data):
        """Test listing with multiple briefings."""
        # Create multiple briefings
        for i in range(3):
            data = valid_briefing_data.copy()
            data["companyName"] = f"Company {i}"
            client.post("/briefings", json=data)

        response = client.get("/briefings")
        assert response.status_code == 200
        data = response.json()
        assert len(data["items"]) == 3
        assert data["meta"]["total_items"] == 3
        assert data["meta"]["page"] == 1

    def test_list_briefings_pagination(self, client, valid_briefing_data):
        """Test pagination works correctly."""
        # Create 5 briefings
        for i in range(5):
            data = valid_briefing_data.copy()
            data["companyName"] = f"Company {i}"
            client.post("/briefings", json=data)

        # Get first page (page_size=2)
        response = client.get("/briefings?page=1&page_size=2")
        data = response.json()
        assert len(data["items"]) == 2
        assert data["meta"]["page"] == 1
        assert data["meta"]["page_size"] == 2
        assert data["meta"]["total_items"] == 5
        assert data["meta"]["has_next"] is True
        assert data["meta"]["has_prev"] is False

        # Get second page
        response = client.get("/briefings?page=2&page_size=2")
        data = response.json()
        assert len(data["items"]) == 2
        assert data["meta"]["has_next"] is True
        assert data["meta"]["has_prev"] is True

        # Get last page
        response = client.get("/briefings?page=3&page_size=2")
        data = response.json()
        assert len(data["items"]) == 1
        assert data["meta"]["has_next"] is False
        assert data["meta"]["has_prev"] is True
