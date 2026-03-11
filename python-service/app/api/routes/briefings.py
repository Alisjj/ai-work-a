from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import HTMLResponse
from sqlalchemy.orm import Session

from app.core.exceptions import BriefingNotFoundError, BriefingNotGeneratedError
from app.db.session import get_db
from app.schemas.briefing import (
    BriefingCreate,
    BriefingGenerateOut,
    BriefingOut,
    PaginatedResponse,
    PaginationParams,
)
from app.services import briefing_service
from app.templates.renderer import renderer

router = APIRouter(prefix="/briefings", tags=["briefings"])


@router.get("", response_model=PaginatedResponse[BriefingOut])
def list_briefings(
    pagination: PaginationParams = Depends(),
    db: Session = Depends(get_db),
):
    """List all briefings with pagination."""
    return briefing_service.list_briefings(db, pagination)


@router.post("", response_model=BriefingOut, status_code=status.HTTP_201_CREATED)
def create_briefing(payload: BriefingCreate, db: Session = Depends(get_db)):
    return briefing_service.create_briefing(db, payload)


@router.get("/{briefing_id}", response_model=BriefingOut)
def get_briefing(briefing_id: UUID, db: Session = Depends(get_db)):
    try:
        return briefing_service.get_briefing(db, briefing_id)
    except BriefingNotFoundError:
        raise HTTPException(status_code=404, detail="Briefing not found")


@router.post("/{briefing_id}/generate", response_model=BriefingGenerateOut)
def generate_briefing(briefing_id: UUID, db: Session = Depends(get_db)):
    try:
        return briefing_service.generate_briefing_out(db, briefing_id)
    except BriefingNotFoundError:
        raise HTTPException(status_code=404, detail="Briefing not found")


@router.get("/{briefing_id}/html", response_class=HTMLResponse)
def get_briefing_html(briefing_id: UUID, db: Session = Depends(get_db)):
    try:
        view_model = briefing_service.get_report_view_model(db, briefing_id)
    except BriefingNotFoundError:
        raise HTTPException(status_code=404, detail="Briefing not found")
    except BriefingNotGeneratedError:
        raise HTTPException(
            status_code=409,
            detail="Report has not been generated yet. Call POST /briefings/{id}/generate first.",
        )
    html = renderer.render_briefing(view_model)
    return HTMLResponse(content=html, status_code=200)
