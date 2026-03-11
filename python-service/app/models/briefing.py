import enum
import uuid
from datetime import datetime, timezone
from typing import TYPE_CHECKING

from sqlalchemy import (
    Boolean,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy import Enum as SAEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

if TYPE_CHECKING:
    from uuid import UUID


def utcnow():
    return datetime.now(timezone.utc)


class PointType(str, enum.Enum):
    KEY_POINT = "key_point"
    RISK = "risk"


class Briefing(Base):
    __tablename__ = "briefings"

    id: Mapped[UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)  # type: ignore[call-arg]
    company_name: Mapped[str] = mapped_column(String(255), nullable=False)
    ticker: Mapped[str] = mapped_column(String(20), nullable=False)
    sector: Mapped[str] = mapped_column(String(255), nullable=False)
    analyst_name: Mapped[str] = mapped_column(String(255), nullable=False)
    summary: Mapped[str] = mapped_column(Text, nullable=False)
    recommendation: Mapped[str] = mapped_column(Text, nullable=False)
    is_generated: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    generated_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, onupdate=utcnow, nullable=False)

    points: Mapped[list["BriefingPoint"]] = relationship("BriefingPoint", back_populates="briefing", cascade="all, delete-orphan")
    metrics: Mapped[list["BriefingMetric"]] = relationship("BriefingMetric", back_populates="briefing", cascade="all, delete-orphan")

    def get_sorted_points(self, point_type: PointType) -> list["BriefingPoint"]:
        """Get points of a specific type sorted by display order."""
        return sorted(
            [p for p in self.points if p.point_type == point_type],
            key=lambda p: p.display_order,
        )

    def get_sorted_metrics(self) -> list["BriefingMetric"]:
        """Get metrics sorted by display order."""
        return sorted(self.metrics, key=lambda m: m.display_order)

    def get_grouped_points(self) -> dict[PointType, list["BriefingPoint"]]:
        """
        Group all points by their type, sorted by display order.

        Returns:
            Dictionary mapping PointType to list of points.
        """
        grouped: dict[PointType, list[BriefingPoint]] = {}
        for p in sorted(self.points, key=lambda x: x.display_order):
            if p.point_type not in grouped:
                grouped[p.point_type] = []
            grouped[p.point_type].append(p)
        return grouped


class BriefingPoint(Base):
    __tablename__ = "briefing_points"

    id: Mapped[UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)  # type: ignore[call-arg]
    briefing_id: Mapped[UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("briefings.id", ondelete="CASCADE"), nullable=False)  # type: ignore[call-arg]
    point_type: Mapped[PointType] = mapped_column(SAEnum(PointType, name="pointtype", values_callable=lambda obj: [e.value for e in obj]), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    display_order: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    briefing: Mapped["Briefing"] = relationship("Briefing", back_populates="points")


class BriefingMetric(Base):
    __tablename__ = "briefing_metrics"

    id: Mapped[UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)  # type: ignore[call-arg]
    briefing_id: Mapped[UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("briefings.id", ondelete="CASCADE"), nullable=False)  # type: ignore[call-arg]
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    value: Mapped[str] = mapped_column(String(255), nullable=False)
    display_order: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    __table_args__ = (
        UniqueConstraint("briefing_id", "name", name="uq_briefing_metric_name"),
    )

    briefing: Mapped["Briefing"] = relationship("Briefing", back_populates="metrics")
