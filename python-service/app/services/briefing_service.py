from __future__ import annotations

from datetime import datetime, timezone
from typing import Optional
from uuid import UUID

from sqlalchemy.orm import Session, joinedload

from app.models.briefing import Briefing, BriefingPoint, BriefingMetric, PointType
from app.schemas.briefing import BriefingCreate, BriefingOut, PointOut, MetricOut


# ---------- Helpers ----------

def _build_briefing_out(briefing: Briefing) -> BriefingOut:
    key_points = sorted(
        [p for p in briefing.points if p.point_type == PointType.KEY_POINT],
        key=lambda p: p.display_order,
    )
    risks = sorted(
        [p for p in briefing.points if p.point_type == PointType.RISK],
        key=lambda p: p.display_order,
    )
    metrics = sorted(briefing.metrics, key=lambda m: m.display_order)

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
        key_points=[PointOut.model_validate(p) for p in key_points],
        risks=[PointOut.model_validate(p) for p in risks],
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
            if briefing.generated_at
            else "—"
        )

        self.key_points = [
            p.content
            for p in sorted(
                [p for p in briefing.points if p.point_type == PointType.KEY_POINT],
                key=lambda p: p.display_order,
            )
        ]
        self.risks = [
            p.content
            for p in sorted(
                [p for p in briefing.points if p.point_type == PointType.RISK],
                key=lambda p: p.display_order,
            )
        ]
        self.metrics = [
            {"name": m.name.title(), "value": m.value}
            for m in sorted(briefing.metrics, key=lambda m: m.display_order)
        ]
        self.has_metrics = len(self.metrics) > 0


# ---------- Service ----------

def _load(db: Session, briefing_id: UUID) -> Optional[Briefing]:
    return (
        db.query(Briefing)
        .options(joinedload(Briefing.points), joinedload(Briefing.metrics))
        .filter(Briefing.id == briefing_id)
        .first()
    )


def create_briefing(db: Session, payload: BriefingCreate) -> BriefingOut:
    briefing = Briefing(
        company_name=payload.companyName,
        ticker=payload.ticker,
        sector=payload.sector,
        analyst_name=payload.analystName,
        summary=payload.summary,
        recommendation=payload.recommendation,
    )
    db.add(briefing)
    db.flush()  # get ID before inserting children

    for i, text in enumerate(payload.keyPoints):
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
    db.expire(briefing)  # force reload relationships

    briefing = _load(db, briefing.id)
    return _build_briefing_out(briefing)


def get_briefing(db: Session, briefing_id: UUID) -> Optional[BriefingOut]:
    briefing = _load(db, briefing_id)
    if not briefing:
        return None
    return _build_briefing_out(briefing)


def generate_briefing(db: Session, briefing_id: UUID) -> Optional[Briefing]:
    briefing = _load(db, briefing_id)
    if not briefing:
        return None
    briefing.is_generated = True
    briefing.generated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(briefing)
    briefing = _load(db, briefing_id)
    return briefing


def get_report_view_model(db: Session, briefing_id: UUID) -> Optional[ReportViewModel]:
    briefing = _load(db, briefing_id)
    if not briefing or not briefing.is_generated:
        return None
    return ReportViewModel(briefing)
