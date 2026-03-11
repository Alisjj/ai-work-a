from __future__ import annotations

from collections import defaultdict
from datetime import datetime, timezone
from uuid import UUID

from sqlalchemy.orm import Session

from app.core.exceptions import BriefingNotFoundError, BriefingNotGeneratedError
from app.models.briefing import Briefing, BriefingMetric, BriefingPoint, PointType
from app.schemas.briefing import (
    BriefingCreate,
    BriefingOut,
    MetricOut,
    PaginatedResponse,
    PaginationMeta,
    PaginationParams,
    PointOut,
)

# ---------- Helpers ----------


def _group_points_by_type(
    points: list[BriefingPoint],
) -> dict[PointType, list[BriefingPoint]]:
    """Group points by their type, sorted by display order."""
    grouped: dict[PointType, list[BriefingPoint]] = defaultdict(list)
    for p in sorted(points, key=lambda x: x.display_order):
        grouped[p.point_type].append(p)
    return grouped

def _build_briefing_out(briefing: Briefing) -> BriefingOut:
    grouped_points = briefing.get_grouped_points()
    metrics = briefing.get_sorted_metrics()

    return BriefingOut(
        id=briefing.id,
        company_name=briefing.company_name,
        ticker=briefing.ticker,
        sector=briefing.sector,
        analyst_name=briefing.analyst_name,
        summary=briefing.summary,
        recommendation=briefing.recommendation,
        is_generated=briefing.is_generated,
        generated_at=briefing.generated_at,
        created_at=briefing.created_at,
        key_points=[
            PointOut.model_validate(p)
            for p in grouped_points.get(PointType.KEY_POINT, [])
        ],
        risks=[
            PointOut.model_validate(p)
            for p in grouped_points.get(PointType.RISK, [])
        ],
        metrics=[MetricOut.model_validate(m) for m in metrics],
    )


# ---------- Report View Model ----------

class ReportViewModel:
    """Formatted view model consumed by the Jinja2 template."""

    def __init__(self, briefing: Briefing):
        self.title = f"Briefing Report — {briefing.company_name} ({briefing.ticker})"
        self.company_name = briefing.company_name
        self.ticker = briefing.ticker
        self.sector = briefing.sector
        self.analyst_name = briefing.analyst_name
        self.summary = briefing.summary
        self.recommendation = briefing.recommendation
        self.generated_at = (
            briefing.generated_at.strftime("%B %d, %Y at %H:%M UTC")
            if briefing.generated_at is not None
            else "—"
        )

        grouped_points = briefing.get_grouped_points()
        self.key_points = [
            p.content
            for p in grouped_points.get(PointType.KEY_POINT, [])
        ]
        self.risks = [
            p.content
            for p in grouped_points.get(PointType.RISK, [])
        ]
        self.metrics = [
            {"name": m.name.title(), "value": m.value}
            for m in briefing.get_sorted_metrics()
        ]
        self.has_metrics = len(self.metrics) > 0


# ---------- Service ----------


def list_briefings(
    db: Session, pagination: PaginationParams
) -> PaginatedResponse[BriefingOut]:
    """List briefings with pagination."""
    # Get total count
    total_items = db.query(Briefing).count()
    total_pages = (total_items + pagination.page_size - 1) // pagination.page_size

    # Get paginated items
    briefings = (
        db.query(Briefing)
        .order_by(Briefing.created_at.desc())
        .offset(pagination.offset)
        .limit(pagination.page_size)
        .all()
    )

    items = [_build_briefing_out(b) for b in briefings]

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
    db.flush()  # get ID before inserting children

    for i, text in enumerate(payload.key_points):
        db.add(BriefingPoint(
            briefing_id=briefing.id,
            point_type=PointType.KEY_POINT,
            content=text,
            display_order=i,
        ))

    for i, text in enumerate(payload.risks):
        db.add(BriefingPoint(
            briefing_id=briefing.id,
            point_type=PointType.RISK,
            content=text,
            display_order=i,
        ))

    if payload.metrics:
        for i, metric in enumerate(payload.metrics):
            db.add(BriefingMetric(
                briefing_id=briefing.id,
                name=metric.name.strip(),
                value=metric.value.strip(),
                display_order=i,
            ))

    db.commit()
    db.refresh(briefing)

    # Reload with relationships
    briefing = db.query(Briefing).filter(Briefing.id == briefing.id).first()
    if briefing is None:
        raise RuntimeError("Briefing disappeared after commit")
    return _build_briefing_out(briefing)


def get_briefing(db: Session, briefing_id: UUID) -> BriefingOut:
    """Get a briefing by ID."""
    briefing = (
        db.query(Briefing)
        .filter(Briefing.id == briefing_id)
        .first()
    )
    if not briefing:
        raise BriefingNotFoundError(str(briefing_id))
    return _build_briefing_out(briefing)


def generate_briefing(db: Session, briefing_id: UUID) -> Briefing:
    """Mark a briefing as generated."""
    briefing = db.query(Briefing).filter(Briefing.id == briefing_id).first()
    if not briefing:
        raise BriefingNotFoundError(str(briefing_id))
    briefing.is_generated = True
    briefing.generated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(briefing)
    return briefing


def generate_briefing_out(db: Session, briefing_id: UUID) -> BriefingOut:
    """Generate briefing and return the output schema directly."""
    briefing = generate_briefing(db, briefing_id)
    return _build_briefing_out(briefing)


def get_report_view_model(db: Session, briefing_id: UUID) -> ReportViewModel:
    """Get a report view model for template rendering."""
    briefing = db.query(Briefing).filter(Briefing.id == briefing_id).first()
    if not briefing:
        raise BriefingNotFoundError(str(briefing_id))
    if not briefing.is_generated:
        raise BriefingNotGeneratedError(str(briefing_id))
    return ReportViewModel(briefing)
