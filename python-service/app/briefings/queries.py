from __future__ import annotations

from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload

from app.models.briefing import Briefing
from app.schemas.briefing import PaginationParams

_BRIEFING_LOAD_OPTIONS = (
    selectinload(Briefing.points),
    selectinload(Briefing.metrics),
)


def count_briefings(db: Session) -> int:
    total_items = db.scalar(select(func.count()).select_from(Briefing))
    return total_items or 0


def list_briefings(db: Session, pagination: PaginationParams) -> list[Briefing]:
    statement = (
        select(Briefing)
        .options(*_BRIEFING_LOAD_OPTIONS)
        .order_by(Briefing.created_at.desc())
        .offset(pagination.offset)
        .limit(pagination.page_size)
    )
    return list(db.scalars(statement).all())


def get_briefing(db: Session, briefing_id: UUID) -> Briefing | None:
    statement = (
        select(Briefing)
        .options(*_BRIEFING_LOAD_OPTIONS)
        .where(Briefing.id == briefing_id)
    )
    return db.scalar(statement)
