import httpx
import pytest

pytestmark = pytest.mark.anyio


async def test_health_check(client: httpx.AsyncClient) -> None:
    response = await client.get("/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}
