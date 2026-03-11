"""Repository interfaces/protocols for dependency inversion."""

from collections.abc import Sequence
from typing import Protocol
from uuid import UUID

from app.models.briefing import Briefing, BriefingMetric, BriefingPoint


class IBriefingRepository(Protocol):
    """
    Interface for Briefing repository operations.

    This protocol defines the contract for any briefing repository
    implementation, enabling dependency inversion and easier testing.
    """

    def get(self, briefing_id: UUID) -> Briefing | None:
        """Get a briefing by ID with related points and metrics."""
        ...

    def add(self, briefing: Briefing) -> None:
        """Add a new briefing to the database."""
        ...

    def add_point(self, point: BriefingPoint) -> None:
        """Add a new briefing point."""
        ...

    def add_metric(self, metric: BriefingMetric) -> None:
        """Add a new briefing metric."""
        ...

    def commit(self) -> None:
        """Commit the current transaction."""
        ...

    def refresh(self, briefing: Briefing) -> None:
        """Refresh a briefing object from the database."""
        ...

    def expire(self, briefing: Briefing) -> None:
        """Expire a briefing object to force reload of relationships."""
        ...

    def count(self) -> int:
        """Get total count of briefings."""
        ...

    def list_paginated(self, offset: int, limit: int) -> Sequence[Briefing]:
        """List briefings with pagination."""
        ...


__all__ = ["IBriefingRepository"]
