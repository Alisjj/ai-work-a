from collections.abc import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from app.core.config import settings

engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,  # Enable connection health checks
    pool_size=10,
    max_overflow=20,
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


def get_db() -> Generator[Session, None, None]:
    """Dependency for FastAPI routes that provides a database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_db_session() -> Generator[Session, None, None]:
    """
    Get a database session for use outside of FastAPI routes.
    Caller is responsible for closing the session.

    Usage:
        with get_db_session() as db:
            # use db
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
