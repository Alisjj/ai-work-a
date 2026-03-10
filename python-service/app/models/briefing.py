import enum
from datetime import datetime, timezone

from sqlalchemy import (
    Column, String, Text, Boolean, Integer,
    ForeignKey, DateTime, Enum as SAEnum, UniqueConstraint
)
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
import uuid

from app.db.session import Base


def utcnow():
    return datetime.now(timezone.utc)


class PointType(str, enum.Enum):
    KEY_POINT = "key_point"
    RISK = "risk"


class Briefing(Base):
    __tablename__ = "briefings"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    company_name = Column(String(255), nullable=False)
    ticker = Column(String(20), nullable=False)
    sector = Column(String(255), nullable=False)
    analyst_name = Column(String(255), nullable=False)
    summary = Column(Text, nullable=False)
    recommendation = Column(Text, nullable=False)
    is_generated = Column(Boolean, default=False, nullable=False)
    generated_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utcnow, onupdate=utcnow, nullable=False)

    points = relationship("BriefingPoint", back_populates="briefing", cascade="all, delete-orphan")
    metrics = relationship("BriefingMetric", back_populates="briefing", cascade="all, delete-orphan")


class BriefingPoint(Base):
    __tablename__ = "briefing_points"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    briefing_id = Column(UUID(as_uuid=True), ForeignKey("briefings.id", ondelete="CASCADE"), nullable=False)
    point_type = Column(SAEnum(PointType, name="pointtype", values_callable=lambda obj: [e.value for e in obj]), nullable=False)
    content = Column(Text, nullable=False)
    display_order = Column(Integer, nullable=False, default=0)

    briefing = relationship("Briefing", back_populates="points")


class BriefingMetric(Base):
    __tablename__ = "briefing_metrics"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    briefing_id = Column(UUID(as_uuid=True), ForeignKey("briefings.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(255), nullable=False)
    value = Column(String(255), nullable=False)
    display_order = Column(Integer, nullable=False, default=0)

    __table_args__ = (
        UniqueConstraint("briefing_id", "name", name="uq_briefing_metric_name"),
    )

    briefing = relationship("Briefing", back_populates="metrics")
