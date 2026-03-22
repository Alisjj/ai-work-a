from uuid import UUID

from fastapi import APIRouter, Depends, Query, status
from fastapi.responses import HTMLResponse
from sqlalchemy.orm import Session

from app.briefings import service
from app.db.session import get_db
from app.schemas.briefing import (
    BriefingCreate,
    BriefingGenerateOut,
    BriefingOut,
    PaginatedResponse,
    PaginationParams,
)
from app.templates.renderer import renderer

router = APIRouter(prefix="/briefings", tags=["briefings"])


@router.get("", response_model=PaginatedResponse[BriefingOut])
async def list_briefings(
    page: int = Query(default=1, ge=1, description="Page number (1-indexed)"),
    page_size: int = Query(default=20, ge=1, le=100, description="Items per page"),
    db: Session = Depends(get_db),
):
    """List all briefings with pagination."""
    pagination = PaginationParams(page=page, page_size=page_size)
    return service.list_briefings(db, pagination)


@router.post("", response_model=BriefingOut, status_code=status.HTTP_201_CREATED)
async def create_briefing(payload: BriefingCreate, db: Session = Depends(get_db)):
    """Create a new briefing with company details, points, and metrics."""
    return service.create_briefing(db, payload)


@router.get("/{briefing_id}", response_model=BriefingOut)
async def get_briefing(briefing_id: UUID, db: Session = Depends(get_db)):
    """Get a briefing by ID."""
    return service.get_briefing(db, briefing_id)


@router.post("/{briefing_id}/generate", response_model=BriefingGenerateOut)
async def generate_briefing(briefing_id: UUID, db: Session = Depends(get_db)):
    """Mark a briefing as generated."""
    return service.generate_briefing_out(db, briefing_id)


@router.get("/{briefing_id}/html", response_class=HTMLResponse)
async def get_briefing_html(briefing_id: UUID, db: Session = Depends(get_db)):
    """Get the rendered HTML report for a briefing."""
    view_model = service.get_report_view_model(db, briefing_id)
    html = renderer.render_briefing(view_model)
    return HTMLResponse(content=html, status_code=200)
