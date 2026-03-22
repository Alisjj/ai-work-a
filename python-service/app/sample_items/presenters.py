from app.models.sample_item import SampleItem
from app.schemas.sample_item import SampleItemRead


def to_read_model(item: SampleItem) -> SampleItemRead:
    return SampleItemRead.model_validate(item)
