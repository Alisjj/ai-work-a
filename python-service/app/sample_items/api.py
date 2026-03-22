from typing import Annotated

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.sample_items import service
from app.schemas.sample_item import SampleItemCreate, SampleItemRead

router = APIRouter(prefix="/sample-items", tags=["sample-items"])


@router.post("", response_model=SampleItemRead, status_code=status.HTTP_201_CREATED)
async def create_item(
    payload: SampleItemCreate,
    db: Annotated[Session, Depends(get_db)],
) -> SampleItemRead:
    item = service.create_sample_item(db, payload)
    return service.to_read_model(item)


@router.get("", response_model=list[SampleItemRead])
async def get_items(db: Annotated[Session, Depends(get_db)]) -> list[SampleItemRead]:
    items = service.list_sample_items(db)
    return [service.to_read_model(item) for item in items]
