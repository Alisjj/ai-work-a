"""
Test configuration using Testcontainers.

Strategy:
  - One real Postgres Docker container is started per test SESSION (fast).
  - Alembic migrations are run once against it (same migrations as production).
  - Each test runs inside a SAVEPOINT transaction that is rolled back after the
    test, so tests are fully isolated with zero table-truncation overhead.

Requirements:
  - Docker must be running on the host machine.
  - `testcontainers[postgres]` must be installed (see requirements.txt).
"""
import pytest
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from testcontainers.postgres import PostgresContainer
from alembic.config import Config
from alembic import command

from app.db.session import get_db
from app.main import app
from fastapi.testclient import TestClient


# ---------------------------------------------------------------------------
# Session-scoped container + engine
# Starts once, shared across all tests in the session.
# ---------------------------------------------------------------------------

@pytest.fixture(scope="session")
def postgres_container():
    """Start a real Postgres container for the entire test session."""
    with PostgresContainer("postgres:15-alpine") as pg:
        yield pg


@pytest.fixture(scope="session")
def db_engine(postgres_container):
    """
    Create the SQLAlchemy engine pointed at the test container,
    then run Alembic migrations exactly once.
    """
    url = postgres_container.get_connection_url()
    engine = create_engine(url, pool_pre_ping=True)

    # Run the real Alembic migrations — same as production
    alembic_cfg = Config("alembic.ini")
    alembic_cfg.set_main_option("sqlalchemy.url", url)
    command.upgrade(alembic_cfg, "head")

    yield engine

    engine.dispose()


# ---------------------------------------------------------------------------
# Function-scoped session with SAVEPOINT rollback
# Each test gets a clean slate without truncating tables.
# ---------------------------------------------------------------------------

@pytest.fixture(scope="function")
def db_session(db_engine):
    """
    Wrap each test in a transaction + savepoint so all changes are rolled
    back automatically when the test ends. No data bleeds between tests.
    """
    connection = db_engine.connect()
    transaction = connection.begin()

    # Use a SAVEPOINT so that even if the code under test issues a ROLLBACK,
    # it only rolls back to the savepoint, not the outer transaction.
    connection.execute(text("SAVEPOINT test_savepoint"))

    TestSession = sessionmaker(bind=connection)
    session = TestSession()

    yield session

    session.close()
    connection.execute(text("ROLLBACK TO SAVEPOINT test_savepoint"))
    transaction.rollback()
    connection.close()


# ---------------------------------------------------------------------------
# TestClient with the db_session injected via FastAPI dependency override
# ---------------------------------------------------------------------------

@pytest.fixture(scope="function")
def client(db_session):
    """FastAPI TestClient that uses the test transaction session."""
    def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()
