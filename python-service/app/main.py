from fastapi import FastAPI

from app.api.health import router as health_router
from app.briefings.api import router as briefings_router
from app.briefings.exception_handlers import register_exception_handlers
from app.sample_items.api import router as sample_items_router


async def root() -> dict[str, str]:
    return {"service": "InsightOps", "status": "running"}


def create_app() -> FastAPI:
    app = FastAPI(title="InsightOps Service", version="0.1.0")
    register_exception_handlers(app)
    app.include_router(health_router)
    app.include_router(sample_items_router)
    app.include_router(briefings_router)
    app.add_api_route("/", root, methods=["GET"])
    return app


app = create_app()


__all__ = ["app", "create_app"]
