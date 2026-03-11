import logging
from contextlib import asynccontextmanager
from time import time

from fastapi import FastAPI, HTTPException, Request, Security, status
from fastapi.responses import JSONResponse
from fastapi.security import APIKeyHeader
from slowapi import Limiter
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address

from app.api.routes.briefings import router as briefings_router
from app.core.config import settings

# Configure logging
logging.basicConfig(
    level=logging.INFO if not settings.DEBUG else logging.DEBUG,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)


# Rate limiter
limiter = Limiter(
    key_func=get_remote_address,
    default_limits=[f"{settings.RATE_LIMIT_PER_MINUTE}/minute"],
)


# API Key authentication
API_KEY_HEADER = APIKeyHeader(name="X-API-Key", auto_error=False)


async def verify_api_key(api_key: str | None = Security(API_KEY_HEADER)) -> str:
    """Verify API key authentication."""
    if api_key is None:
        # Allow unauthenticated requests in debug mode
        if settings.DEBUG:
            return "debug-user"
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="API key required. Provide X-API-Key header.",
        )
    if api_key != settings.API_KEY:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid API key",
        )
    return api_key


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan handler."""
    logger.info("Starting Briefing Report Service")
    logger.info(f"Debug mode: {settings.DEBUG}")
    logger.info(f"Rate limit: {settings.RATE_LIMIT_PER_MINUTE} requests/minute")
    yield
    logger.info("Shutting down Briefing Report Service")


app = FastAPI(
    title="Briefing Report Service",
    description="Internal briefing report generator for analysts.",
    version="1.0.0",
    lifespan=lifespan,
)

# Add rate limiter
app.state.limiter = limiter


async def rate_limit_exception_handler(
    request: Request, exc: RateLimitExceeded
) -> JSONResponse:
    """Handle rate limit exceeded exceptions."""
    retry_after = getattr(exc.detail, "retry_after", None) if hasattr(exc.detail, "retry_after") else None
    return JSONResponse(
        status_code=429,
        content={"detail": "Rate limit exceeded. Please try again later."},
        headers={"Retry-After": str(retry_after)} if retry_after else {},
    )


app.add_exception_handler(RateLimitExceeded, rate_limit_exception_handler)  # type: ignore[arg-type]

# Add request logging middleware
@app.middleware("http")
async def log_requests(request: Request, call_next):
    """Log all incoming requests and responses."""
    start_time = time()

    # Log request
    logger.info(
        f"Request: {request.method} {request.url.path}",
        extra={
            "method": request.method,
            "path": request.url.path,
            "client": request.client.host if request.client else "unknown",
        },
    )

    # Process request
    response = await call_next(request)

    # Log response
    process_time = time() - start_time
    logger.info(
        f"Response: {response.status_code} in {process_time:.3f}s",
        extra={
            "status_code": response.status_code,
            "process_time_ms": round(process_time * 1000, 2),
        },
    )

    return response


@app.get("/health")
def health():
    """Health check endpoint."""
    return {"status": "ok", "version": "1.0.0"}


# Include routers (with rate limiting)
app.include_router(briefings_router)
