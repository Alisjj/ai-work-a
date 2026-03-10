from fastapi import FastAPI

from app.api.routes.briefings import router as briefings_router

app = FastAPI(
    title="Briefing Report Service",
    description="Internal briefing report generator for analysts.",
    version="1.0.0",
)

app.include_router(briefings_router)


@app.get("/health")
def health():
    return {"status": "ok"}
