from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

from app.core.exceptions import BriefingNotFoundError, BriefingNotGeneratedError


def register_exception_handlers(app: FastAPI) -> None:
    @app.exception_handler(BriefingNotFoundError)
    async def handle_briefing_not_found(
        request: Request, exc: BriefingNotFoundError
    ) -> JSONResponse:
        del request
        return JSONResponse(status_code=404, content={"detail": "Briefing not found"})

    @app.exception_handler(BriefingNotGeneratedError)
    async def handle_briefing_not_generated(
        request: Request, exc: BriefingNotGeneratedError
    ) -> JSONResponse:
        del request, exc
        return JSONResponse(
            status_code=409,
            content={
                "detail": "Report has not been generated yet. Call POST /briefings/{id}/generate first."
            },
        )
