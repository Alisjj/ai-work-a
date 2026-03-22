from __future__ import annotations

from datetime import datetime
from typing import Any, Generic, TypeVar
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

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
    model_config = ConfigDict(populate_by_name=True)

    company_name: str
    ticker: str
    sector: str
    analyst_name: str
    summary: str
    recommendation: str
    key_points: list[str]
    risks: list[str]
    metrics: list[MetricIn] | None = None

    @model_validator(mode="before")
    @classmethod
    def normalize_field_names(cls, data: Any) -> Any:
        if not isinstance(data, dict):
            return data

        normalized = dict(data)
        field_map = {
            "companyName": "company_name",
            "analystName": "analyst_name",
            "keyPoints": "key_points",
        }

        for source_name, target_name in field_map.items():
            if source_name in normalized and target_name not in normalized:
                normalized[target_name] = normalized.pop(source_name)

        return normalized

    @field_validator("company_name", "summary", "recommendation", "sector", "analyst_name")
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

    @field_validator("key_points")
    @classmethod
    def at_least_two_key_points(cls, v: list[str]) -> list[str]:
        clean = [p.strip() for p in v if p.strip()]
        if len(clean) < 2:
            raise ValueError("At least 2 key points are required")
        return clean

    @field_validator("risks")
    @classmethod
    def at_least_one_risk(cls, v: list[str]) -> list[str]:
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
    generated_at: datetime | None
    created_at: datetime
    key_points: list[PointOut] = []
    risks: list[PointOut] = []
    metrics: list[MetricOut] = []

    model_config = {"from_attributes": True}


class BriefingGenerateOut(BaseModel):
    id: UUID
    is_generated: bool
    generated_at: datetime | None

    model_config = {"from_attributes": True}


# ---------- Pagination ----------

T = TypeVar("T")


class PaginationParams(BaseModel):
    """Pagination parameters for list endpoints."""

    page: int = Field(default=1, ge=1, description="Page number (1-indexed)")
    page_size: int = Field(default=20, ge=1, le=100, description="Items per page")

    @property
    def offset(self) -> int:
        """Calculate offset from page number."""
        return (self.page - 1) * self.page_size


class PaginationMeta(BaseModel):
    """Pagination metadata returned in list responses."""

    page: int
    page_size: int
    total_items: int
    total_pages: int
    has_next: bool
    has_prev: bool


class PaginatedResponse(BaseModel, Generic[T]):
    """Paginated response wrapper."""

    items: list[T]
    meta: PaginationMeta
