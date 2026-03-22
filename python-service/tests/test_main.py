import httpx
import pytest

from app.main import create_app

pytestmark = pytest.mark.anyio


async def test_root_endpoint_reports_service_status() -> None:
    app = create_app()
    transport = httpx.ASGITransport(app=app)

    async with httpx.AsyncClient(
        transport=transport,
        base_url="http://testserver",
    ) as client:
        response = await client.get("/")

    assert response.status_code == 200
    assert response.json() == {"service": "InsightOps", "status": "running"}
