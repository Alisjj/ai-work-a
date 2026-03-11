"""Repository layer for data access abstraction."""

from app.repositories.briefing import BriefingRepository
from app.repositories.interfaces import IBriefingRepository

__all__ = ["IBriefingRepository", "BriefingRepository"]
