"""SQLAlchemy implementation of Briefing repository."""

from collections.abc import Sequence
from uuid import UUID

from sqlalchemy.orm import Session, joinedload

from app.models.briefing import Briefing, BriefingMetric, BriefingPoint
from app.repositories.interfaces import IBriefingRepository


class BriefingRepository(IBriefingRepository):
    """
    SQLAlchemy implementation of IBriefingRepository.

    This implementation uses SQLAlchemy for data access and can be
    swapped with any other implementation that satisfies the protocol.
    """

    def __init__(self, db: Session) -> None:
        self._db = db

    @property
    def db(self) -> Session:
        """Get the database session."""
        return self._db

    def get(self, briefing_id: UUID) -> Briefing | None:
        """
        Get a briefing by ID with related points and metrics.

        Args:
            briefing_id: The UUID of the briefing.

        Returns:
            Briefing object or None if not found.
        """
        return (
            self._db.query(Briefing)
            .options(
                joinedload(Briefing.points),
                joinedload(Briefing.metrics),
            )
            .filter(Briefing.id == briefing_id)
            .first()
        )

    def add(self, briefing: Briefing) -> None:
        """Add a new briefing to the database."""
        self._db.add(briefing)

    def add_point(self, point: BriefingPoint) -> None:
        """Add a new briefing point."""
        self._db.add(point)

    def add_metric(self, metric: BriefingMetric) -> None:
        """Add a new briefing metric."""
        self._db.add(metric)

    def commit(self) -> None:
        """Commit the current transaction."""
        self._db.commit()

    def refresh(self, briefing: Briefing) -> None:
        """Refresh a briefing object from the database."""
        self._db.refresh(briefing)

    def expire(self, briefing: Briefing) -> None:
        """Expire a briefing object to force reload of relationships."""
        self._db.expire(briefing)

    def count(self) -> int:
        """Get total count of briefings."""
        return self._db.query(Briefing).count()

    def list_paginated(
        self, offset: int, limit: int
    ) -> Sequence[Briefing]:
        """
        List briefings with pagination.

        Args:
            offset: Number of items to skip.
            limit: Maximum number of items to return.

        Returns:
            List of briefings ordered by created_at descending.
        """
        return (
            self._db.query(Briefing)
            .order_by(Briefing.created_at.desc())
            .offset(offset)
            .limit(limit)
            .all()
        )
