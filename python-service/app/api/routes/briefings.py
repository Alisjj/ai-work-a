from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import HTMLResponse
from jinja2 import Environment, FileSystemLoader, select_autoescape
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.briefing import BriefingCreate, BriefingOut, BriefingGenerateOut
from app.services import briefing_service

import os

router = APIRouter(prefix="/briefings", tags=["briefings"])

_templates_dir = os.path.join(os.path.dirname(__file__), "../../templates")
_jinja_env = Environment(
    loader=FileSystemLoader(_templates_dir),
    autoescape=select_autoescape(["html"]),
)


@router.post("", response_model=BriefingOut, status_code=status.HTTP_201_CREATED)
def create_briefing(payload: BriefingCreate, db: Session = Depends(get_db)):
    return briefing_service.create_briefing(db, payload)


@router.get("/{briefing_id}", response_model=BriefingOut)
def get_briefing(briefing_id: UUID, db: Session = Depends(get_db)):
    result = briefing_service.get_briefing(db, briefing_id)
    if not result:
        raise HTTPException(status_code=404, detail="Briefing not found")
    return result


@router.post("/{briefing_id}/generate", response_model=BriefingGenerateOut)
def generate_briefing(briefing_id: UUID, db: Session = Depends(get_db)):
    briefing = briefing_service.generate_briefing(db, briefing_id)
    if not briefing:
        raise HTTPException(status_code=404, detail="Briefing not found")
    return BriefingGenerateOut(
        id=briefing.id,
        is_generated=briefing.is_generated,
        generated_at=briefing.generated_at,
    )


@router.get("/{briefing_id}/html", response_class=HTMLResponse)
def get_briefing_html(briefing_id: UUID, db: Session = Depends(get_db)):
    view_model = briefing_service.get_report_view_model(db, briefing_id)
    if view_model is None:
        briefing = briefing_service.get_briefing(db, briefing_id)
        if not briefing:
            raise HTTPException(status_code=404, detail="Briefing not found")
        raise HTTPException(
            status_code=409,
            detail="Report has not been generated yet. Call POST /briefings/{id}/generate first.",
        )
    template = _jinja_env.get_template("briefing_report.html")
    html = template.render(report=view_model)
    return HTMLResponse(content=html, status_code=200)
