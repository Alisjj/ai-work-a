from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.sample_item import SampleItem


def list_sample_items(db: Session) -> list[SampleItem]:
    statement = select(SampleItem).order_by(
        SampleItem.created_at.desc(),
        SampleItem.id.desc(),
    )
    return list(db.scalars(statement).all())
