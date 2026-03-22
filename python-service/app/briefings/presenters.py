from __future__ import annotations

from dataclasses import dataclass

from app.models.briefing import Briefing, PointType
from app.schemas.briefing import BriefingOut, MetricOut, PointOut


@dataclass(slots=True)
class ReportMetricViewModel:
    name: str
    value: str


@dataclass(slots=True)
class ReportViewModel:
    title: str
    company_name: str
    ticker: str
    sector: str
    analyst_name: str
    summary: str
    recommendation: str
    generated_at: str
    key_points: list[str]
    risks: list[str]
    metrics: list[ReportMetricViewModel]

    @property
    def has_metrics(self) -> bool:
        return bool(self.metrics)


def build_briefing_out(briefing: Briefing) -> BriefingOut:
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
            PointOut.model_validate(point)
            for point in grouped_points.get(PointType.KEY_POINT, [])
        ],
        risks=[
            PointOut.model_validate(point)
            for point in grouped_points.get(PointType.RISK, [])
        ],
        metrics=[MetricOut.model_validate(metric) for metric in metrics],
    )


def build_report_view_model(briefing: Briefing) -> ReportViewModel:
    grouped_points = briefing.get_grouped_points()

    return ReportViewModel(
        title=f"Briefing Report - {briefing.company_name} ({briefing.ticker})",
        company_name=briefing.company_name,
        ticker=briefing.ticker,
        sector=briefing.sector,
        analyst_name=briefing.analyst_name,
        summary=briefing.summary,
        recommendation=briefing.recommendation,
        generated_at=(
            briefing.generated_at.strftime("%B %d, %Y at %H:%M UTC")
            if briefing.generated_at is not None
            else "-"
        ),
        key_points=[
            point.content for point in grouped_points.get(PointType.KEY_POINT, [])
        ],
        risks=[point.content for point in grouped_points.get(PointType.RISK, [])],
        metrics=[
            ReportMetricViewModel(name=metric.name.title(), value=metric.value)
            for metric in briefing.get_sorted_metrics()
        ],
    )
