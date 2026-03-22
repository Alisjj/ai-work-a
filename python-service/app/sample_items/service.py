from sqlalchemy.orm import Session

from app.models.sample_item import SampleItem
from app.sample_items import presenters, queries
from app.schemas.sample_item import SampleItemCreate, SampleItemRead


def create_sample_item(db: Session, payload: SampleItemCreate) -> SampleItem:
    item = SampleItem(name=payload.name.strip(), description=payload.description)
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


def list_sample_items(db: Session) -> list[SampleItem]:
    return queries.list_sample_items(db)


def to_read_model(item: SampleItem) -> SampleItemRead:
    return presenters.to_read_model(item)
