from __future__ import annotations

from datetime import datetime
from typing import List, Optional
from uuid import UUID

from pydantic import BaseModel, field_validator, model_validator


# ---------- Metrics ----------

class MetricIn(BaseModel):
    name: str
    value: str


class MetricOut(BaseModel):
    id: UUID
    name: str
    value: str
    display_order: int

    model_config = {"from_attributes": True}


# ---------- Points ----------

class PointOut(BaseModel):
    id: UUID
    content: str
    display_order: int

    model_config = {"from_attributes": True}


# ---------- Briefing ----------

class BriefingCreate(BaseModel):
    companyName: str
    ticker: str
    sector: str
    analystName: str
    summary: str
    recommendation: str
    keyPoints: List[str]
    risks: List[str]
    metrics: Optional[List[MetricIn]] = None

    @field_validator("companyName", "summary", "recommendation", "sector", "analystName")
    @classmethod
    def not_blank(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("Field must not be blank")
        return v.strip()

    @field_validator("ticker")
    @classmethod
    def normalize_ticker(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("ticker must not be blank")
        return v.strip().upper()

    @field_validator("keyPoints")
    @classmethod
    def at_least_two_key_points(cls, v: List[str]) -> List[str]:
        clean = [p.strip() for p in v if p.strip()]
        if len(clean) < 2:
            raise ValueError("At least 2 key points are required")
        return clean

    @field_validator("risks")
    @classmethod
    def at_least_one_risk(cls, v: List[str]) -> List[str]:
        clean = [r.strip() for r in v if r.strip()]
        if len(clean) < 1:
            raise ValueError("At least 1 risk is required")
        return clean

    @model_validator(mode="after")
    def unique_metric_names(self) -> BriefingCreate:
        if self.metrics:
            names = [m.name.strip().lower() for m in self.metrics]
            if len(names) != len(set(names)):
                raise ValueError("Metric names must be unique within the same briefing")
        return self


class BriefingOut(BaseModel):
    id: UUID
    company_name: str
    ticker: str
    sector: str
    analyst_name: str
    summary: str
    recommendation: str
    is_generated: bool
    generated_at: Optional[datetime]
    created_at: datetime
    key_points: List[PointOut] = []
    risks: List[PointOut] = []
    metrics: List[MetricOut] = []

    model_config = {"from_attributes": True}


class BriefingGenerateOut(BaseModel):
    id: UUID
    is_generated: bool
    generated_at: Optional[datetime]

    model_config = {"from_attributes": True}
