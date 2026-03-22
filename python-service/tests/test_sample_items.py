import httpx
import pytest

pytestmark = pytest.mark.anyio


async def test_create_and_list_sample_items(client: httpx.AsyncClient) -> None:
    create_response = await client.post(
        "/sample-items",
        json={"name": "Starter Item", "description": "Used for starter validation"},
    )

    assert create_response.status_code == 201
    created_payload = create_response.json()
    assert created_payload["name"] == "Starter Item"

    list_response = await client.get("/sample-items")
    assert list_response.status_code == 200

    items = list_response.json()
    assert len(items) == 1
    assert items[0]["id"] == created_payload["id"]
