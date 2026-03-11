"""
Test configuration using mocks.

Strategy:
  - Mock the repository layer to avoid database calls.
  - Use freezegun for deterministic timestamps.
  - FastAPI TestClient with dependency overrides for full isolation.

No Docker or database required.
"""
import os
from datetime import datetime, timezone
from unittest.mock import MagicMock, patch

import pytest
from fastapi.testclient import TestClient

from app.core import config
from app.db.session import get_db
from app.main import app

# Set test environment variables
os.environ["DEBUG"] = "1"
os.environ["API_KEY"] = "test-api-key"
os.environ["RATE_LIMIT_PER_MINUTE"] = "1000"  # High limit for tests


@pytest.fixture(scope="function")
def mock_db_session():
    """Create a mock database session."""
    session = MagicMock()
    session.__enter__ = MagicMock(return_value=session)
    session.__exit__ = MagicMock(return_value=False)
    return session


@pytest.fixture(scope="function")
def client(mock_db_session):
    """
    FastAPI TestClient with mocked database session.
    
    The repository layer is patched to use the mock session,
    so no actual database calls are made.
    """
    def override_get_db():
        yield mock_db_session

    app.dependency_overrides[get_db] = override_get_db
    
    with TestClient(app, headers={"X-API-Key": "test-api-key"}) as c:
        yield c
    
    app.dependency_overrides.clear()


@pytest.fixture(scope="function")
def frozen_time():
    """Freeze time for deterministic timestamp tests."""
    with patch('app.services.briefing_service.datetime') as mock_dt:
        mock_dt.now.return_value = datetime(2026, 3, 11, 12, 0, 0, tzinfo=timezone.utc)
        mock_dt.side_effect = lambda *args, **kw: datetime(*args, **kw, tzinfo=timezone.utc)
        yield mock_dt
