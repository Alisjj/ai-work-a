from __future__ import annotations

from datetime import datetime, timezone
from uuid import UUID

from sqlalchemy.orm import Session

from app.briefings import queries
from app.briefings.presenters import (
    ReportViewModel,
    build_briefing_out,
    build_report_view_model,
)
from app.core.exceptions import BriefingNotFoundError, BriefingNotGeneratedError
from app.models.briefing import Briefing, BriefingMetric, BriefingPoint, PointType
from app.schemas.briefing import (
    BriefingCreate,
    BriefingOut,
    PaginatedResponse,
    PaginationMeta,
    PaginationParams,
)


def _require_briefing(db: Session, briefing_id: UUID) -> Briefing:
    briefing = queries.get_briefing(db, briefing_id)
    if briefing is None:
        raise BriefingNotFoundError(str(briefing_id))
    return briefing


def _build_points(
    briefing_id: UUID, point_type: PointType, values: list[str]
) -> list[BriefingPoint]:
    return [
        BriefingPoint(
            briefing_id=briefing_id,
            point_type=point_type,
            content=value,
            display_order=index,
        )
        for index, value in enumerate(values)
    ]


def _build_metrics(briefing_id: UUID, payload: BriefingCreate) -> list[BriefingMetric]:
    if not payload.metrics:
        return []

    return [
        BriefingMetric(
            briefing_id=briefing_id,
            name=metric.name.strip(),
            value=metric.value.strip(),
            display_order=index,
        )
        for index, metric in enumerate(payload.metrics)
    ]


def list_briefings(db: Session, pagination: PaginationParams) -> PaginatedResponse[BriefingOut]:
    """List briefings with pagination."""
    total_items = queries.count_briefings(db)
    total_pages = (total_items + pagination.page_size - 1) // pagination.page_size

    briefings = queries.list_briefings(db, pagination)
    items = [build_briefing_out(briefing) for briefing in briefings]

    return PaginatedResponse(
        items=items,
        meta=PaginationMeta(
            page=pagination.page,
            page_size=pagination.page_size,
            total_items=total_items,
            total_pages=total_pages,
            has_next=pagination.page < total_pages,
            has_prev=pagination.page > 1,
        ),
    )


def create_briefing(db: Session, payload: BriefingCreate) -> BriefingOut:
    """Create a new briefing with points and metrics."""
    briefing = Briefing(
        company_name=payload.company_name,
        ticker=payload.ticker,
        sector=payload.sector,
        analyst_name=payload.analyst_name,
        summary=payload.summary,
        recommendation=payload.recommendation,
    )
    db.add(briefing)
    db.flush()

    for point in _build_points(briefing.id, PointType.KEY_POINT, payload.key_points):
        db.add(point)

    for point in _build_points(briefing.id, PointType.RISK, payload.risks):
        db.add(point)

    for metric in _build_metrics(briefing.id, payload):
        db.add(metric)

    db.commit()
    return build_briefing_out(_require_briefing(db, briefing.id))


def get_briefing(db: Session, briefing_id: UUID) -> BriefingOut:
    """Get a briefing by ID."""
    return build_briefing_out(_require_briefing(db, briefing_id))


def generate_briefing(db: Session, briefing_id: UUID) -> Briefing:
    """Mark a briefing as generated."""
    briefing = _require_briefing(db, briefing_id)
    briefing.is_generated = True
    briefing.generated_at = datetime.now(timezone.utc)
    db.commit()
    return _require_briefing(db, briefing_id)


def generate_briefing_out(db: Session, briefing_id: UUID) -> BriefingOut:
    """Generate briefing and return the output schema directly."""
    briefing = generate_briefing(db, briefing_id)
    return build_briefing_out(briefing)


def get_report_view_model(db: Session, briefing_id: UUID) -> ReportViewModel:
    """Get a report view model for template rendering."""
    briefing = _require_briefing(db, briefing_id)
    if not briefing.is_generated:
        raise BriefingNotGeneratedError(str(briefing_id))
    return build_report_view_model(briefing)
